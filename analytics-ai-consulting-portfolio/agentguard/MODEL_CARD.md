# AgentGuard Model Card

**Name:** AgentGuard Heuristic AI Agent Governance & Risk Assessment Model v1.0.

**Purpose:** Structure an early-stage assessment of agentic AI exposure, control maturity, residual prioritisation and remediation evidence gaps.

**Intended users:** AI engineers, product owners, security practitioners, risk/compliance analysts, internal auditors and students.

**Not intended for:** deployment approval automation, security certification, penetration testing, exploit validation, incident attribution, legal/regulatory sign-off, or employment, credit, health, safety-critical or financial decisions.

**Inputs:** Agent archetype; six ordinal scenario ratings (1–5); 12 control maturity ratings (0–4).

**Outputs:** Inherent and residual risk indices, risk bands, control coverage, tested-control counts, mandatory control gaps, remediation recommendations, CSV and JSON exports.

**Model type:** Rule-based heuristic; no machine learning, training data or learned parameters.

**Validation:** Unit tests verify scoring bounds, monotonicity as maturity improves, dimension weights, rating validation and presence of all ten OWASP Agentic Applications categories. Tests validate software logic only, not empirical calibration.

**Assumptions:** Dimension weights, control strengths, default profile values, risk bands and diminishing-returns control aggregation are design assumptions. Ratings are subjective. Controls may be correlated and fail together.

**Limitations:** AgentGuard cannot inspect a deployed agent, verify access controls, scan code, detect prompt injection, observe network traffic or independently prove that control evidence is genuine. Self-reported maturity is not independent assurance.

**Human oversight:** A business owner, security reviewer and relevant privacy/legal stakeholders should validate inputs, evidence and remediation. High-impact actions require independent technical enforcement and accountable human approval.
