from typing import Dict, Any, TypedDict, Optional, List
import logging
import json
import os
from enum import Enum

from langchain_openai import ChatOpenAI
from langchain_mistralai import ChatMistralAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langgraph.graph import StateGraph, END

from shared.schemas import RiskFinding, RiskLevel
from shared.ingestion import VectorService

logger = logging.getLogger(__name__)

class RiskState(TypedDict):
    doc_id: int
    doc_text: str
    extracted_clauses: Dict[str, str] # type -> text
    risk_findings: List[RiskFinding]

class RiskAssessmentGraph:
    def __init__(self):
        self.vector_service = VectorService(collection_name="clause_library")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.mistral_key = os.getenv("MISTRAL_API_KEY")
        
        if self.mistral_key:
            self.llm = ChatMistralAI(model="mistral-small-latest", temperature=0)
        elif self.openai_key:
            self.llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        else:
            self.llm = None

    def identify_clauses(self, state: RiskState):
        logger.info("Node: Identify Clauses")
        text = state["doc_text"][:8000] # Limit context
        
        target_clauses = ["Liability Cap", "Payment Terms", "Indemnification", "Termination for Convenience"]
        
        if not self.llm:
            # Mock Identification
            extracted = {}
            lower_text = text.lower()
            if "liability" in lower_text:
                extracted["Liability Cap"] = "The total liability shall be unlimited." # Mock risky
            if "payment" in lower_text:
                extracted["Payment Terms"] = "Net 60 Days."
            return {"extracted_clauses": extracted}

        # LLM Identification
        prompt = ChatPromptTemplate.from_template(
            """Extract the full text of the following clauses from the document: {clauses}.
            Return JSON: {{ "Clause Name": "Extracted Text", ... }}
            If a clause is missing, omit it.
            
            Document:
            {text}"""
        )
        chain = prompt | self.llm
        try:
            res = chain.invoke({"text": text, "clauses": ", ".join(target_clauses)})
            content = res.content.replace("```json", "").replace("```", "")
            extracted = json.loads(content)
            return {"extracted_clauses": extracted}
        except Exception as e:
            logger.error(f"Clause extraction failed: {e}")
            return {"extracted_clauses": {}}

    def assess_risk(self, state: RiskState):
        logger.info("Node: Assess Risk")
        extracted = state["extracted_clauses"]
        findings = []
        
        for clause_type, clause_text in extracted.items():
            # Retrieve Standard Clause
            results = self.vector_service.search(query=clause_type, limit=1)
            standard_text = results[0].payload.get("text") if results else "Standard not found."
            
            if not self.llm:
                # Mock Assessment
                if "unlimited" in clause_text.lower():
                     findings.append(RiskFinding(
                        clause_type=clause_type,
                        risk_score=9,
                        risk_level=RiskLevel.HIGH,
                        explanation="Unlimited liability is high risk.",
                        original_text=clause_text,
                        redline_text="Liability limited to 1x Fees.",
                        standard_clause=standard_text
                    ))
                continue

            # LLM Assessment
            parser = PydanticOutputParser(pydantic_object=RiskFinding)
            prompt = ChatPromptTemplate.from_template(
                """You are a strict Legal Risk Auditor.
                Compare the Actual Clause against the Standard Clause (Policy).
                
                Clause Type: {clause_type}
                Actual Clause: {actual}
                Standard Clause (Policy): {standard}
                
                1. Score risk (1-10). 1=Safe, 10=Critical.
                2. Explain risk.
                3. Provide a Redline (rewrite Actual to match Standard intent, keeping context).
                
                {format_instructions}
                """
            )
            chain = prompt | self.llm | parser
            try:
                finding = chain.invoke({
                    "clause_type": clause_type,
                    "actual": clause_text,
                    "standard": standard_text,
                    "format_instructions": parser.get_format_instructions()
                })
                # Inject extras
                finding.original_text = clause_text
                finding.standard_clause = standard_text
                
                if finding.risk_score > 3: # Filter low risk
                    findings.append(finding)
            except Exception as e:
                logger.error(f"Risk assessment failed for {clause_type}: {e}")
        
        return {"risk_findings": findings}

    def build_graph(self):
        workflow = StateGraph(RiskState)
        workflow.add_node("identify", self.identify_clauses)
        workflow.add_node("assess", self.assess_risk)
        
        workflow.set_entry_point("identify")
        workflow.add_edge("identify", "assess")
        workflow.add_edge("assess", END)
        
        return workflow.compile()

    def run(self, doc_id: int, text: str):
        app = self.build_graph()
        result = app.invoke({
            "doc_id": doc_id,
            "doc_text": text,
            "extracted_clauses": {},
            "risk_findings": []
        })
        return result["risk_findings"]
