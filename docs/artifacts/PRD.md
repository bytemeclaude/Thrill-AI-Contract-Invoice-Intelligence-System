# Product Requirements Document (PRD)
**Project:** AI Contract & Invoice Intelligence System
**Date:** 2025-12-29
**Status:** DRAFT

## 1. Problem Statement
Manual processing of invoices against contracts is time-consuming and error-prone. Organizations suffer from revenue leakage due to missed pricing mismatches and legal risk from non-compliant contract clauses.

## 2. User Personas
| Persona | Role | Primary Goal | Pain Points |
|:--- |:--- |:--- |:--- |
| **AP Clerk** | Processor | Process invoices quickly and accurately. | Manual data entry, "stare and compare" fatigue. |
| **Procurement Analyst** | Monitor | Identify leakage and vendor performance. | Lack of aggregate data, buried in PDFs. |
| **Legal Reviewer** | Risk Manager | Ensure contract compliance. | Tedious clause review, missed expiry dates. |

## 3. Core Workflows
1.  **Ingestion**: User uploads PDF (Contract or Invoice). System classifies and extracts text.
2.  **Extraction & Validation**:
    *   *Invoice*: Extract Vendor, Date, Line Items, Total.
    *   *Contract*: Extract Parties, Effective Dates, Rate Tables, Liability Clauses.
    *   *Match*: Compare Invoice Line Items against Contract Rates.
3.  **Review Loop**: System highlights mismatches (e.g., Invoice Price $100 vs Contract Rate $90). User accepts or rejects.
4.  **Risk Analysis**: System flags risky clauses (e.g., "Unlimited Liability") in Draft Contracts.
5.  **Reporting**: Export Audit Report showing all processed docs and findings.

## 4. MVP Scope Definition
**"What is Done?"**
The system is "Done" when a user can complete the "Happy Path" of uploading 1 contract and 1 related invoice, viewing extracted data, and seeing a flag for a price mismatch.

### In Scope (MVP)
- **Upload**: Support for PDF and Image text (OCR).
- **Processing**:
    - Regex/LLM-based field extraction.
    - Basic Two-Way Matching (Invoice Total/Lines vs Contract Rates).
- **UI**:
    - Dashboard with "Upload" and "Recent Activity".
    - Split-view Document verification page.
- **Export**: CSV download of extraction results.
- **Language**: English only.

### Out of Scope (For Now)
- **ERP Integration**: No direct write-back to SAP/Oracle (File export only).
- **Complex Tables**: Nested tables or handwritten invoices.
- **Multi-language**: Non-English documents.
- **Advanced Legal Logic**: automated negotiation or rewriting of clauses.
- **Mobile App**: Desktop Web only.

## 5. Exit Criteria
1.  **Accuracy**: >90% extraction accuracy on "Standard" clean invoices.
2.  **Performance**: Document processing time < 10 seconds.
3.  **Usability**: User can resolve a mismatch flag in < 3 clicks.
4.  **Artifacts**: All designs and code committed to repository.
