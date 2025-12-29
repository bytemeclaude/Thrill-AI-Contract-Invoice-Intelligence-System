# Model Card: AI Contract & Invoice Intelligence

## Model Details
- **Name**: Contract & Invoice Intelligence Engine
- **Version**: 1.0.0
- **Type**: RAG-based Document Understanding & Analysis System
- **Core Components**: 
    - **Extraction**: LangGraph + Mistral/OpenAI / Mock
    - **Embedding**: `all-MiniLM-L6-v2` (Sentence Transformers)
    - **Vector Store**: Qdrant
    - **LLM**: GPT-3.5-Turbo or Mistral-Small

## Intended Use
- **Primary Use Case**: Automated auditing of Invoices against Contracts.
- **Secondary Use Case**: Risk assessment of legal contracts using a standard clause library.
- **Target Users**: Accounts Payable (AP) Teams, Legal Auditors.

## Capabilities
1.  **Extraction**: Extracts structured data (Vendor, Date, Total, Line Items) from PDFs.
2.  **Mismatch Detection**: Compares Invoice Terms/Amounts against Contract Terms.
    - Flags: `term_mismatch`, `amount_mismatch`.
3.  **Risk Scoring**: Identifies risky clauses (e.g., "Unlimited Liability") by comparing against a library of safe standards.

## Performance Metrics (Target)
- **Extraction F1 Score**: > 90%
- **Mismatch Detection Accuracy**: > 80%
- **Risk Recall**: > 95% (Validation pending via Evaluation Dashboard)

## Limitations
- **Language**: English documents only.
- **Format**: Digital PDFs preferred. Scanned images rely on `pdfplumber` text extraction (OCR not integrated in MVP).
- **Latency**: Processing time is ~5-10s per document (dependent on LLM latency).

## Ethical Considerations
- **Bias**: LLM may hallucinate or misinterpret complex legal jargon. Human review is required (Human-in-the-Loop enabled via Review UI).
- **Data Privacy**: Documents are stored in MinIO. Production deployment requires encryption at rest.
