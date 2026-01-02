# Evaluation Metrics & Accuracy Calculation

This document outlines how the **AI Contract & Invoice Intelligence System** measures performance and calculates accuracy across its three core pillars: Extraction, Mismatch Detection, and Risk Assessment.

## 1. Extraction Accuracy (Data Quality)

We measure how accurately the system extracts structured fields (e.g., Total Amount, Vendor Name, Date) from unstructured PDFs.

### Metric: Extraction Score (Exact Match / F1)
*   **Definition**: For a given field, does the extracted value match the Ground Truth value?
*   **Calculation**:
    *   **Score = 1.0**: Perfect match (within `0.01` tolerance for floats).
    *   **Score = 0.0**: Mismatch or extraction failure.
*   **Aggegration**: We average the score across all documents in the test set.

**Example**:
-   Ground Truth Total: `$1,050.00`
-   Extracted Total: `$1,050.00` -> **Score: 1.0**
-   Extracted Total: `$1,000.00` -> **Score: 0.0**

## 2. Mismatch Logic Accuracy (Reasoning)

We measure the system's ability to correctly identify discrepancies between an Invoice and its related Contract (e.g., verifying if the Invoice Total exceeds the Contract Rate).

### Metric: Mismatch Accuracy
*   **Definition**: The percentage of scenarios where the system correctly flags (or correctly ignores) a mismatch.
*   **Calculation**:
    *   `Correct Predictions` / `Total Scenarios`
*   **Logic**:
    *   If Ground Truth says "Mismatch Expected" AND System finds "Term Mismatch" -> **Correct**.
    *   If Ground Truth says "No Mismatch" AND System finds "No Mismatch" -> **Correct**.
    *   Otherwise -> **Incorrect**.

## 3. Risk Assessment Recall (Safety)

For legal contracts, missing a high-risk clause is more dangerous than flagging a benign one. Therefore, we prioritize Recall over Precision.

### Metric: Risk Recall
*   **Definition**: Of all the high-risk clauses present in a contract, what percentage did the AI identify?
*   **Calculation**:
    *   `High Risks Detected by AI` / `Total High Risks in Ground Truth`
*   **Target**: > 95%

## 🚀 How to Run the Evaluation

1.  **Generate Synthetic Data**:
    If you don't have existing test data, generate the "Gold Set":
    ```bash
    docker-compose exec worker python3 evaluation/generate_gold.py
    ```

2.  **Run the Evaluator**:
    This script uploads the data, triggers analysis, and compares results against the ground truth.
    ```bash
    python3 backend/evaluation/eval_runner.py
    ```

3.  **View Results**:
    The script outputs a summary to the console and saves a detailed report to `backend/evaluation/eval_report.json`.
    You can also view the **Evaluation Dashboard** at:
    [http://localhost:3000/evaluations](http://localhost:3000/evaluations)
