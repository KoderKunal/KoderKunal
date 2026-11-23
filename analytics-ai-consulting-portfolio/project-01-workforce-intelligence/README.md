# Project 1 — Workforce Intelligence & Attrition Prediction

**Business question:** Which synthetic workforce groups show different attrition patterns, what associations appear in the data, and how might an interpretable model support exploratory analysis?

## Analytics lifecycle
- **Descriptive:** headcount, attrition rate, department and overtime summaries.
- **Diagnostic:** Welch t-test, one-way ANOVA, chi-square and Pearson correlation.
- **Predictive:** logistic regression with one-hot encoding, scaling and a stratified holdout split.
- **Prescriptive:** use department-level summaries to frame human-reviewed retention questions; no automated HR decision is produced.

## Run
From this folder, install dependencies from the portfolio root and execute:

```bash
python analysis.py
```

The script generates its own synthetic dataset, analytical test results and holdout model metrics under `data/` and `outputs/`.

## Tools
Python, Pandas, NumPy, SciPy, scikit-learn. The companion workbook and MySQL/n8n/Ollama templates are in the downloadable starter kit.

## Data and responsible-use note
All records are synthetic educational data. The model is not validated for any real employer. Never use this project for hiring, firing, promotion, compensation or individual employee scoring. Association does not prove causation; real use would require lawful representative data, fairness and privacy reviews, and accountable human oversight.
