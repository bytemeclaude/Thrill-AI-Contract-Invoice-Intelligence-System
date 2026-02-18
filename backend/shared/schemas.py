from typing import List, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field

class ExtractedField(BaseModel):
    value: Union[str, float, int, None]
    confidence: float = Field(default=1.0)
    source_chunk_id: Optional[str] = None
    page_number: Optional[int] = None

class LineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    total_amount: float

class InvoiceSchema(BaseModel):
    vendor_name: str
    invoice_date: str
    invoice_number: str
    payment_terms: Optional[str] = None
    total_amount: float
    currency: str = "USD"
    line_items: List[LineItem] = []

class ContractRate(BaseModel):
    item_description: str
    agreed_rate: float
    unit: str = "each"

class ContractSchema(BaseModel):
    party_a: str
    party_b: str
    effective_date: str
    agreement_type: str
    payment_terms: str
    liability_cap: Optional[str] = None
    rate_table: List[ContractRate] = []

class DocumentExtraction(BaseModel):
    doc_type: str = Field(description="One of: 'invoice', 'contract', 'other'")
    data: Union[InvoiceSchema, ContractSchema, dict] = {}

class FindingSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FindingType(str, Enum):
    TERM_MISMATCH = "term_mismatch"
    RATE_MISMATCH = "rate_mismatch"
    CALCULATION_ERROR = "calculation_error"
    MISSING_PO = "missing_po"
    ANOMALY = "anomaly"

class Finding(BaseModel):
    id: Optional[int] = None
    finding_type: FindingType
    severity: FindingSeverity
    description: str
    evidence: Optional[dict] = None # JSON evidence
    recommendation: Optional[str] = None

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RiskFinding(BaseModel):
    clause_type: str
    risk_score: int = Field(ge=1, le=10)
    risk_level: RiskLevel
    explanation: str
    redline_text: Optional[str] = None
    original_text: str
    standard_clause: Optional[str] = None
