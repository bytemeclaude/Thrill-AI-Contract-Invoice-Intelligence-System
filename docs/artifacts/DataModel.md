# Data Model

## Conceptual Schema

```mermaid
erDiagram
    DOCUMENT {
        string id PK
        string type "INVOICE | CONTRACT"
        datetime upload_date
        string status "PROCESSING | REVIEW_NEEDED | COMPLETED"
        string file_path
    }

    INVOICE {
        string document_id FK
        string vendor_name
        date invoice_date
        decimal total_amount
        string currency
    }

    INVOICE_LINE_ITEM {
        string id PK
        string invoice_id FK
        string description
        decimal quantity
        decimal unit_price
        decimal total_price
    }

    CONTRACT {
        string document_id FK
        string vendor_name
        date start_date
        date end_date
        string status "DRAFT | ACTIVE | EXPIRED"
    }

    CONTRACT_RATE {
        string id PK
        string contract_id FK
        string item_description
        decimal agreed_rate
        string unit
    }

    RISK_FINDING {
        string id PK
        string document_id FK
        string type "MISMATCH | CLAUSE_RISK"
        string severity "HIGH | MEDIUM | LOW"
        string description
        string evidence_span "Text snippet from doc"
    }

    DOCUMENT ||--|| INVOICE : is
    DOCUMENT ||--|| CONTRACT : is
    INVOICE ||--|{ INVOICE_LINE_ITEM : contains
    CONTRACT ||--|{ CONTRACT_RATE : defines
    DOCUMENT ||--|{ RISK_FINDING : has
```

## Entity Descriptions

### 1. Document
The root entity representing an uploaded file.
- **Fields**: `id`, `uploaded_by`, `s3_path`, `ocr_status`.

### 2. RiskFinding
Represents a discrepancy or risk detected by the AI.
- **Mismatch**: When `InvoiceLineItem.unit_price` > `ContractRate.agreed_rate`.
- **ClauseRisk**: A problematic legal clause (e.g., "Governing Law: Mars").
- **Fields**: `evidence_span` is crucial for the UI to highlight the exact location in the PDF.
