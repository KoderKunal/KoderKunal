# Analytics & AI Consulting Portfolio

Two reproducible projects structured around the full analytics lifecycle:

1. **Descriptive:** What happened? Build reliable KPIs and summaries.
2. **Diagnostic:** Why might patterns differ? Apply statistical tests and examine associations.
3. **Predictive:** What might happen? Train and evaluate a machine-learning model on held-out synthetic data.
4. **Prescriptive:** What options could be considered? Translate outputs into transparent, human-reviewed scenarios.

## Project 1 — Workforce Intelligence & Attrition Prediction

**Business question:** Which synthetic workforce segments show different attrition rates, how do selected variables relate to attrition, and how can an interpretable model support exploratory analysis?

- Excel: Power Query cleaning, PivotTables, department KPIs and charts.
- MySQL 8.0: staging table, relational joins, analytical views, CTEs, window functions, stored function and stored procedure.
- Python: EDA, Welch t-test, one-way ANOVA, chi-square, correlation and logistic-regression classification.
- Automation: n8n scheduled summary template and a bounded, aggregate-only local Ollama assistant.
- Responsible use: no employee-level assistant context and no automated employment decisions.

## Project 2 — Enterprise AI Value & Investment Prioritisation

**Business question:** How could a hypothetical enterprise compare candidate AI initiatives by implementation cost, estimated annual benefit, readiness, adoption and governance risk under a limited budget?

- Excel: Power Query, PivotTables, ROI analysis, sector reporting and scenario views.
- MySQL 8.0: relational portfolio table, sector views, joins, window functions, stored function and procedure.
- Python: EDA, t-test, ANOVA, correlation, Random Forest regression and 0/1 budget-constrained selection.
- Automation: n8n sector-summary template and a bounded local Ollama assistant.
- Decision transparency: objective, budget and rounded-cost assumption are explicit; results are not investment advice.

## Tested synthetic-data outputs

These results were produced by executing the Python scripts against the included synthetic-data generators:

| Project | Test result | Value |
|---|---|---:|
| Workforce | Logistic-regression holdout ROC-AUC | 0.716 |
| AI portfolio | Random Forest holdout R² | 0.912 |
| AI portfolio | Random Forest holdout MAE | ₹11.40 lakh |

These results demonstrate code execution on intentionally generated data only. They do not establish real-world predictive performance or business impact.

## Repository layout

- `project-01-workforce-intelligence/` — workforce data generator, analysis, model and project instructions.
- `project-02-ai-value-portfolio/` — AI initiative generator, analysis, model and prioritisation.
- `README.md` — project design, limitations and reproducibility.

## Reproducibility

Use Python 3.10+ and install the dependencies listed in the repository root `requirements.txt`. Run the project scripts in order: data generation → statistical analysis → model training/evaluation. The scripts regenerate the CSVs and JSON/CSV outputs.

**Synthetic data only.** Do not use these models for employee decisions, live investments or claims about actual consulting-firm clients. For real use, obtain lawful representative data, validate assumptions and model performance, assess fairness/security/privacy, and retain accountable human review.
