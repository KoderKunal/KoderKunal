# Project 2 — Enterprise AI Value & Investment Prioritisation

**Business question:** How could a hypothetical enterprise compare AI initiatives by implementation cost, annual benefit estimate, data readiness, adoption readiness and governance risk under a constrained budget?

## Analytics lifecycle
- **Descriptive:** sector/function portfolio, cost, benefit, ROI and readiness summaries.
- **Diagnostic:** one-way ANOVA, Pearson correlation and low-risk/high-risk group comparison.
- **Predictive:** Random Forest regression to estimate annual benefit, evaluated on a holdout set.
- **Prescriptive:** 0/1 knapsack selection to maximise predicted annual benefit subject to a stated budget, with rounded cost units.

## Run
From this folder, install dependencies from the portfolio root and execute:

```bash
python analysis.py
```

The script creates its synthetic initiative dataset and writes model metrics, statistical tests and selected initiative scenario to `data/` and `outputs/`.

## Data and decision transparency
All rows and outcomes are synthetic. Predicted benefit is not guaranteed savings. The portfolio objective omits real-world factors such as multi-year cash flows, implementation dependencies, procurement, legal review, security, operational capacity and discount rates. Results are educational scenarios, not investment advice.
