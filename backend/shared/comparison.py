from typing import Dict, Any, TypedDict, Optional, List
import logging
import json
import os
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain_mistralai import ChatMistralAI
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from shared.models import Document, Finding as DBFinding
from shared.schemas import Finding, FindingType, FindingSeverity, InvoiceSchema, ContractSchema

logger = logging.getLogger(__name__)


def _extract_value(field):
    """Extract the raw value from either a wrapped {'value': x} or plain value."""
    if isinstance(field, dict) and "value" in field:
        return field["value"]
    return field


def _fuzzy_match(a: str, b: str) -> bool:
    """Case-insensitive substring match in either direction."""
    a_norm = a.lower().strip()
    b_norm = b.lower().strip()
    return a_norm in b_norm or b_norm in a_norm


class ComparisonState(TypedDict):
    invoice_id: int
    invoice_data: Dict[str, Any]
    contract_id: Optional[int]
    contract_data: Optional[Dict[str, Any]]
    findings: List[Finding]


class ComparisonGraph:
    def __init__(self, db: Session):
        self.db = db
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")

        if self.mistral_key:
            self.llm = ChatMistralAI(model="mistral-small-latest", temperature=0)
        elif self.openai_key:
            self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        else:
            self.llm = None

    def retrieve_contract(self, state: ComparisonState):
        """Find the matching contract for the invoice vendor."""
        logger.info("Node: Retrieve Contract")
        invoice_data = state["invoice_data"]
        vendor_name = _extract_value(invoice_data.get("vendor_name"))

        if not vendor_name:
            logger.warning("No vendor name in invoice data")
            return {"contract_id": None}

        contracts = self.db.query(Document).filter(
            Document.extraction_result.isnot(None)
        ).all()

        best_match = None
        for doc in contracts:
            if not doc.extraction_result or doc.extraction_result.get("doc_type") != "contract":
                continue

            data = doc.extraction_result.get("data", {})
            party_a = _extract_value(data.get("party_a", "")) or ""
            party_b = _extract_value(data.get("party_b", "")) or ""

            if _fuzzy_match(vendor_name, party_a) or _fuzzy_match(vendor_name, party_b):
                best_match = doc
                break

        if best_match:
            logger.info(f"Found related contract: {best_match.id}")
            return {
                "contract_id": best_match.id,
                "contract_data": best_match.extraction_result.get("data")
            }

        return {"contract_id": None}

    def compare_terms(self, state: ComparisonState):
        """Compare payment terms between invoice and contract."""
        logger.info("Node: Compare Terms")
        findings = state.get("findings", [])

        if not state["contract_id"]:
            findings.append(Finding(
                finding_type=FindingType.MISSING_PO,
                severity=FindingSeverity.HIGH,
                description="No matching contract found for this vendor.",
                recommendation="Upload a contract for this vendor."
            ))
            return {"findings": findings}

        inv_terms_val = _extract_value(state["invoice_data"].get("payment_terms"))
        cont_terms_val = _extract_value(state["contract_data"].get("payment_terms"))

        if inv_terms_val and cont_terms_val and self.llm:
            prompt = ChatPromptTemplate.from_template(
                """Compare the following payment terms. Are they consistent?
                If no, explain why briefly.

                Invoice Terms: {inv_terms}
                Contract Terms: {cont_terms}

                Return JSON: {{"consistent": bool, "explanation": str}}"""
            )
            chain = prompt | self.llm
            res = chain.invoke({"inv_terms": inv_terms_val, "cont_terms": cont_terms_val})
            try:
                content = res.content.replace("```json", "").replace("```", "")
                parsed = json.loads(content)
                if not parsed["consistent"]:
                    findings.append(Finding(
                        finding_type=FindingType.TERM_MISMATCH,
                        severity=FindingSeverity.HIGH,
                        description=f"Invoice terms '{inv_terms_val}' conflict with Contract '{cont_terms_val}'. {parsed['explanation']}",
                        evidence={
                            "invoice_terms": inv_terms_val,
                            "contract_terms": cont_terms_val
                        }
                    ))
            except Exception as e:
                logger.error(f"Comparison LLM failed: {e}")

        elif not self.llm and inv_terms_val and cont_terms_val:
            norm_inv = str(inv_terms_val).lower().strip()
            norm_cont = str(cont_terms_val).lower().strip()
            if norm_inv != norm_cont:
                findings.append(Finding(
                    finding_type=FindingType.TERM_MISMATCH,
                    severity=FindingSeverity.HIGH,
                    description=f"Invoice terms '{inv_terms_val}' do not match Contract '{cont_terms_val}'.",
                    evidence={
                        "invoice_terms": inv_terms_val,
                        "contract_terms": cont_terms_val
                    }
                ))

        return {"findings": findings}

    def compare_line_items(self, state: ComparisonState):
        """Compare invoice line-item prices against contract agreed rates."""
        logger.info("Node: Compare Line Items")
        findings = state.get("findings", [])

        if not state["contract_id"]:
            return {"findings": findings}

        # Extract line items from invoice
        inv_line_items = _extract_value(state["invoice_data"].get("line_items")) or []
        # Extract rate table from contract
        cont_rate_table = _extract_value(state["contract_data"].get("rate_table")) or []

        if not inv_line_items or not cont_rate_table:
            logger.info("No line items or rate table to compare")
            return {"findings": findings}

        # Build a lookup from contract rates (description -> agreed_rate)
        rate_lookup = {}
        for rate in cont_rate_table:
            if isinstance(rate, dict):
                desc = (rate.get("item_description") or "").lower().strip()
                agreed = rate.get("agreed_rate")
                if desc and agreed is not None:
                    rate_lookup[desc] = rate

        # Compare each invoice line item against contract rates
        for item in inv_line_items:
            if isinstance(item, dict):
                inv_desc = (item.get("description") or "").lower().strip()
                inv_price = item.get("unit_price")

                if inv_price is None:
                    continue

                # Find matching contract rate via fuzzy match
                matched_rate = None
                for rate_desc, rate_data in rate_lookup.items():
                    if _fuzzy_match(inv_desc, rate_desc):
                        matched_rate = rate_data
                        break

                if matched_rate is None:
                    # No contract rate found for this line item
                    findings.append(Finding(
                        finding_type=FindingType.ANOMALY,
                        severity=FindingSeverity.MEDIUM,
                        description=f"Invoice line item '{item.get('description')}' has no matching contract rate.",
                        evidence={
                            "invoice_item": item.get("description"),
                            "invoice_unit_price": inv_price
                        },
                        recommendation="Verify this item is covered under the contract."
                    ))
                    continue

                agreed_rate = matched_rate.get("agreed_rate", 0)
                try:
                    inv_price_f = float(inv_price)
                    agreed_rate_f = float(agreed_rate)
                except (ValueError, TypeError):
                    continue

                if inv_price_f > agreed_rate_f:
                    variance = inv_price_f - agreed_rate_f
                    variance_pct = (variance / agreed_rate_f * 100) if agreed_rate_f > 0 else 0

                    severity = FindingSeverity.MEDIUM
                    if variance_pct > 20:
                        severity = FindingSeverity.CRITICAL
                    elif variance_pct > 10:
                        severity = FindingSeverity.HIGH

                    findings.append(Finding(
                        finding_type=FindingType.RATE_MISMATCH,
                        severity=severity,
                        description=(
                            f"Invoice price ${inv_price_f:.2f} exceeds contract rate "
                            f"${agreed_rate_f:.2f} for '{item.get('description')}' "
                            f"(+${variance:.2f}, +{variance_pct:.1f}%)."
                        ),
                        evidence={
                            "invoice_item": item.get("description"),
                            "invoice_unit_price": inv_price_f,
                            "contract_agreed_rate": agreed_rate_f,
                            "variance": variance,
                            "variance_pct": round(variance_pct, 1),
                            "contract_item": matched_rate.get("item_description"),
                            "contract_unit": matched_rate.get("unit")
                        },
                        recommendation=f"Negotiate invoice price down to contracted rate of ${agreed_rate_f:.2f}."
                    ))

        return {"findings": findings}

    def build_graph(self):
        workflow = StateGraph(ComparisonState)
        workflow.add_node("retrieve", self.retrieve_contract)
        workflow.add_node("compare_terms", self.compare_terms)
        workflow.add_node("compare_line_items", self.compare_line_items)

        workflow.set_entry_point("retrieve")
        workflow.add_edge("retrieve", "compare_terms")
        workflow.add_edge("compare_terms", "compare_line_items")
        workflow.add_edge("compare_line_items", END)

        return workflow.compile()

    def run(self, invoice_id: int):
        doc = self.db.query(Document).filter(Document.id == invoice_id).first()
        if not doc or not doc.extraction_result:
            raise ValueError("Invoice not found or not extracted")

        initial_state = {
            "invoice_id": invoice_id,
            "invoice_data": doc.extraction_result.get("data", {}),
            "contract_id": None,
            "contract_data": None,
            "findings": []
        }

        app = self.build_graph()
        result = app.invoke(initial_state)
        return result["findings"]
