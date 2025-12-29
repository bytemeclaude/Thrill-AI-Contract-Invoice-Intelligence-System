# Evaluation Plan

## 1. Metrics Strategy
We will measure success on two axes: **Extraction Quality** and **Risk Detection**.

### Axis 1: Extraction Quality (OCR + Parsing)
- **Metric**: **F1 Score** per field.
- **Fields**: Vendor Name, Invoice Date, Total Amount, Line Item Quantity/Price.
- **Target**: >90% F1 for digital-born PDFs.

### Axis 2: Risk Detection (Logic/Reasoning)
- **Metric**: **Recall** (Sensitivity).
    - *Why?* Better to flag a false positive mismatch than miss a real overcharge.
- **Scenario**: "Invoice Price > Contract Price".
- **Target**: 95% Recall.

## 2. Dataset Format
We will build a "Golden Set" of 20 documents.

| ID | Type | Ground Truth JSON |
|:---|:---|:---|
| `doc_001.pdf` | Invoice | `{"total": 1050.00, "vendor": "Acme", ...}` |
| `doc_002.pdf` | Contract | `{"rates": [{"item": "Consulting", "rate": 100}]}` |

## 3. Testing Routine
1.  **Unit Tests**: Regex patterns for dates/currency.
2.  **Integration Tests**: Upload -> Process -> Verify Database State.
3.  **Accuracy Eval**: Run `eval.py` script against Golden Set and output report.
