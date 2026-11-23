# Kunal Sharma

**Analytics | Research | Decision Science | AI-enabled Business Transformation**

Postgraduate candidate in Global Business Operations at Shri Ram College of Commerce, with experience in structured research, computational analysis and evidence-led problem solving. Selected for the inaugural EY–SRCC AI VIBE cohort.

## Technical toolkit

- **Programming & data:** Python, Pandas, NumPy, Matplotlib, SQL / MySQL
- **Statistics:** hypothesis testing, t-tests, one-way ANOVA, chi-square, correlation, inferential statistics; JASP and JMP
- **Analytics & BI:** Excel, data cleaning, EDA, KPI reporting, Power BI, Tableau
- **Machine learning & AI:** scikit-learn, classification, regression, Generative AI, local LLMs with Ollama
- **Automation & prototyping:** n8n, Google AI Studio, Stitch

## Featured projects

| Project | Business problem | Stack / methods |
|---|---|---|
| **[WorkLedger — Employee Operations Portal](./employee-ops-portal/)** · [Open portal](https://koderkunal.github.io/KoderKunal/) | How can a team manage attendance, work logs, task progress, client requirements, deliverables and daily reporting in one role-based workspace? | React, TypeScript, Supabase Auth, PostgreSQL, RLS, GitHub Actions, read-only reporting agent |
| [Workforce Intelligence & Attrition Prediction](./analytics-ai-consulting-portfolio/project-01-workforce-intelligence/) | How can workforce patterns and attrition drivers be analysed responsibly? | Excel, MySQL, Python, inferential statistics, logistic regression |
| [Enterprise AI Value & Investment Prioritisation](./analytics-ai-consulting-portfolio/project-02-ai-value-portfolio/) | How can AI initiatives be compared by value, readiness, cost and governance risk? | Excel, MySQL, Python, regression, budget-constrained optimisation |
| [AgentGuard — AI Agent Governance & Risk Assessment](./analytics-ai-consulting-portfolio/agentguard/) | How can agent risks, control maturity and residual exposure be assessed and remediated? | Python, risk scoring, OWASP Agentic Applications, NIST AI RMF |

### WorkLedger — project overview

**[Live portal](https://koderkunal.github.io/KoderKunal/) · [Source code and setup](./employee-ops-portal/README.md) · [Database schema](./employee-ops-portal/supabase/migrations/0001_initial_schema.sql) · [Reporting agent](./employee-ops-portal/src/reportingAgent.ts)**

WorkLedger is a multi-user employee operations and project-delivery portal prototype. Its employee workspace covers individual sign-in, attendance sessions, daily updates, task progress, self-reported work hours and deliverable submissions. Its manager workspace covers client requirements, task assignment, team updates, deliverable review and human-led review cycles.

The reporting agent uses a fixed, read-only set of data tools to compile operational reports and surface work-item exceptions. It does not score employees or make employment decisions. The app has a successful GitHub Pages deployment and automated frontend/database-migration checks; end-to-end authentication and role-isolation tests must be completed against the configured Supabase project before real employee use.

## Data and responsible-use notes

- The workforce and AI-portfolio datasets are synthetic educational data. They do not represent real employees, organisations, clients or investment outcomes.
- Model metrics in those projects are demonstrations on generated data, not evidence of real-world performance.
- WorkLedger attendance and work-hour records are self-reported. Work-item alerts are not employee performance conclusions.
- AgentGuard uses heuristic risk scores, not calibrated probabilities or security certification.

## Relevant experience

- **Evalueserve — Junior Analyst, IP Research & Development:** analysed 500+ technical documents per day at 95%+ accuracy; delivered structured research across prior art, landscape, FTO, whitespace, validity and state-of-the-art studies; supported whitespace analysis and GTM inputs.
- **CSIR–IGIB — Research Intern:** used Python (Pandas, NumPy, Matplotlib), Linux shell scripting and basic R for computational research and data analysis.
- **EY–SRCC AI VIBE:** selected for the inaugural cohort of the 12-month applied AI programme.

## Selected publications

- Ahmad, N., Dugad, S., Chauhan, V., Ahmed, S., **Sharma, K.**, et al. (2022). *Allosteric cooperation in β-lactam binding to a non-classical transpeptidase*. eLife, 11:e73055. [DOI](https://doi.org/10.7554/eLife.73055). Kunal Sharma is the fifth listed author.
- **Sharma, K.**, Noor Khan, N., Sana, H.B., Khan, M.A., & Kumar, P. (2020). *Non-Synonymous Mutation Analysis in SARS-CoV-2 Variants Isolated from Humans and Prediction of Conserved Linear Antibody Epitopes for Use in Country-wise Epitope-Based Vaccine Development*. Preprints.org. [DOI](https://doi.org/10.20944/preprints202006.0024.v1). This is a preprint, not a peer-reviewed publication.

## Portfolio directory

For implementation notes, code, SQL, Excel guides, n8n templates and project limitations, see the [Analytics & AI Consulting Portfolio](./analytics-ai-consulting-portfolio/README.md).
