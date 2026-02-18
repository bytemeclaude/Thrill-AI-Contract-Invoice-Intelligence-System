# UI Wireframes & Navigation

## 1. Dashboard (Home)
**Goal**: Quick status overview and extraction start point.
- **Top Bar**: "Upload Document" Button (Primary Call to Action).
- **Cards**:
    - "Processing": 2 Docs
    - "Needs Review": 5 Docs (Red Badge)
    - "Approved": 120 Docs
- **Recent List**: Table of recently uploaded docs with Status columns.

## 2. Doc Review (Split Screen)
**Goal**: Verify extraction and address risks.
- **Left Panel**: PDF Viewer.
    - Highlights text corresponding to extracted fields.
- **Right Panel**: "Intelligence Sidebar".
    - **Header**: Doc Type | Vendor | confidence score.
    - **Section 1**: Extracted Fields (inputs).
    - **Section 2**: Risk Findings (Cards).
        - *Example*: "Price Mismatch: Invoice $100 vs Contract $90".
        - *Actions*: [Accept Variance] [Reject/Flag].

## 3. Risk/Redline Detail (Modal)
**Goal**: Deep dive into a specific contract clause.
- **Trigger**: Clicking a "Clause Risk" in the Sidebar.
- **Content**:
    - "Standard Clause": [Text of standard liability clause]
    - "Current Clause": [Text from this document]
    - **AI Suggestion**: "This liability cap is 5x higher than company policy."
    - **Action**: "Generate Redline Comment" -> Inserts comment into PDF.

## 4. Audit Report
**Goal**: Post-processing summary.
- **Layout**: Data Table.
- **Columns**:
    - Date
    - Vendor
    - Invoice Total
    - Contract Match (Yes/No)
    - Risk Score (High/Med/Low)
    - Link to PDF
- **Export**: Button to "Download CSV".
