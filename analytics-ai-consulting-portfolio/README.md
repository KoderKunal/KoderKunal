# Analytics & AI Consulting Portfolio

**Two reproducible portfolio projects** connecting business questions to the full analytics lifecycle: descriptive → diagnostic → predictive → prescriptive.

All included datasets are synthetic educational data. They do not represent real employees, employers, client engagements, or investment outcomes.

## Projects

### 1. [Workforce Intelligence & Attrition Prediction](./project-01-workforce-intelligence/README.md)
Analyse synthetic workforce patterns and attrition; apply inferential statistics and logistic regression with explicit limits on HR use.

- [Python analysis.py](./project-01-workforce-intelligence/analysis.py)
- [MySQL schema](./project-01-workforce-intelligence/schema.sql) · [SQL analytics](./project-01-workforce-intelligence/queries.sql)
- [Excel / Power Query guide](./excel/README.md)
- [n8n workflow](./n8n/workforce_daily_summary.json)

### 2. [Enterprise AI Value & Investment Prioritisation](./project-02-ai-value-portfolio/README.md)
Compare hypothetical AI initiatives by cost, benefit, readiness, adoption, risk and budget.

- [Python analysis.py](./project-02-ai-value-portfolio/analysis.py)
- [MySQL schema](./project-02-ai-value-portfolio/schema.sql) · [SQL analytics](./project-02-ai-value-portfolio/queries.sql)
- [n8n workflow](./n8n/ai_portfolio_daily_summary.json)

### 3. [AgentGuard — AI Agent Governance & Risk Assessment](./agentguard/README.md)

A rule-based, explainable risk assessment prototype covering ten OWASP Agentic Applications risk categories. It evaluates six exposure dimensions, 12 governance controls, control maturity, residual risk and remediation evidence.

- [Interactive Streamlit dashboard](./agentguard/app.py)
- [Python scoring engine](./agentguard/risk_engine.py)
- [Model card and limitations](./agentguard/MODEL_CARD.md)
- [References](./agentguard/REFERENCES.md)
- [Controlled test plan](./agentguard/data/red_team_test_plan.csv)

AgentGuard scores are heuristic indices, not calibrated probabilities or evidence of security certification.

## Tested outputs from synthetic generators

| Project | Metric | Result |
|---|---|---:|
| Workforce | Logistic-regression holdout ROC-AUC | 0.716 |
| AI portfolio | Random Forest holdout R² | 0.912 |
| AI portfolio | Random Forest holdout MAE | ₹11.40 lakh |

The values above are synthetic-data demonstrations only. They are not evidence of real-world model performance.

## Run the code

Use Python 3.10+. From this directory:

```bash
pip install -r requirements.txt
python project-01-workforce-intelligence/analysis.py
python project-02-ai-value-portfolio/analysis.py
streamlit run streamlit_app.py
```

Both project scripts generate their own synthetic data under their respective `data/` folders and save results under `outputs/`.

## Local AI assistant

Install Ollama and pull a local model such as `qwen2.5:3b`, then run:

```bash
ollama serve
python local_analytics_agent.py --project workforce --question "Which departments have the highest attrition?"
python local_analytics_agent.py --project ai_portfolio --question "Which sectors have the strongest synthetic ROI?"
```

The assistant is allow-listed and aggregate-only. It does not make HR or investment decisions. See [n8n workflow notes](./n8n/README.md) before importing workflows; configure MySQL credentials and the local Ollama endpoint and test manually first.

## Excel

See the [Excel implementation guide](./excel/README.md) and the Power Query M examples. The separate VBA module is [RefreshPortfolio.bas](./excel/RefreshPortfolio.bas). Review macros before running and follow your organisation's macro policy.

## Industry context

The project themes are inspired by public materials on AI transformation, decision science, value realization and responsible AI from [Accenture](./FIRM_ALIGNMENT.md), Deloitte and EY. They are not presented as work completed for those firms.

## Limitations

- Synthetic data only; model results do not generalise to real populations or portfolios.
- Statistical association does not establish causality.
- The AI-initiative selection exercise uses an illustrative 0/1 knapsack objective and rounded cost units; it is not investment advice.
- Real deployments require representative lawful data, validation, security, privacy, fairness and accountable human review.
