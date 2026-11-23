# AgentGuard — AI Agent Governance & Risk Assessment

An interactive, explainable decision-support prototype to assess common agentic-AI risk scenarios, rate control maturity, calculate inherent and residual risk indices, and produce prioritised remediation recommendations.

**Important:** AgentGuard is a heuristic prioritisation tool, not a calibrated probability model, penetration test, security audit, certification or proof that an agent is secure.

## Why agent governance?
An agent can retrieve information, call tools, delegate work, retain memory and trigger external side effects. Risk assessment must therefore consider not only answer quality, but also identity, privilege, tool boundaries, instruction trust, memory, code execution, inter-agent communication, failure propagation and human oversight.

## Risk taxonomy
The prototype uses the ten categories from the OWASP Top 10 for Agentic Applications 2026:
- ASI01 Agent Goal Hijack
- ASI02 Tool Misuse and Exploitation
- ASI03 Identity and Privilege Abuse
- ASI04 Agentic Supply Chain Vulnerabilities
- ASI05 Unexpected Code Execution (RCE)
- ASI06 Memory and Context Poisoning
- ASI07 Insecure Inter-Agent Communication
- ASI08 Cascading Failures
- ASI09 Human-Agent Trust Exploitation
- ASI10 Rogue Agents

See REFERENCES.md. The taxonomy is mapped for traceability; AgentGuard does not claim formal OWASP, NIST or MITRE conformance.

## How the model works

### Inherent risk
Six assessor-rated dimensions use an ordinal scale of 1–5:
- Likelihood 15%
- Business/safety impact 25%
- Tool privilege 20%
- Autonomy 15%
- External exposure 15%
- Blast radius 10%

Each rating is normalised as (rating - 1) / 4. The weighted sum is multiplied by 100 to produce a prioritisation index from 0 to 100.

### Control maturity
Each control is rated 0–4:
- 0 Absent
- 1 Documented
- 2 Implemented, not independently tested
- 3 Tested with recorded evidence
- 4 Continuously monitored with evidence and accountable ownership

### Residual risk
For each mapped control, assumed control effect = design strength × maturity/4. Combined heuristic effect uses a diminishing-returns approximation:

E = 1 - product(1 - control_effect_i)

Residual = Inherent × (1 - E)

Mandatory controls below maturity 3 are separately flagged. Risk bands are prototype conventions: Low 0–24, Moderate 25–49, High 50–74, Critical 75–100.

The control-strength values, weights and bands are AgentGuard design assumptions—not figures published by OWASP, NIST or MITRE. The combined-control formula is not empirically calibrated; controls may be correlated and fail together.

## Included agent archetypes
1. Read-only research assistant
2. HR operations assistant (sensitive data; consequential changes require human approval)
3. Software engineering agent (repository and code tooling)

Defaults are illustrative starting assumptions. Replace them with a real architecture review and evidence.

## Run locally
Python 3.10+:

    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    python risk_engine.py --profile software_engineering_agent
    streamlit run app.py

On Windows PowerShell, activate with .venv\Scripts\Activate.ps1.

## Outputs
- Scenario-wise inherent and residual scores
- Control maturity coverage and tested-control counts
- Mandatory control gaps
- Recommended controls, implementation actions and requested evidence
- CSV risk register and JSON assessment export
- Safe, controlled red-team test plan in data/red_team_test_plan.csv
- Control evidence register template

## Tests
Run:

    python -m unittest discover -s tests -v

The tests validate code logic and invariants; they do not validate risk calibration against real incidents.

## Governance boundaries
Do not use AgentGuard as an automated deployment gate or for hiring, firing, credit, health, safety-critical, financial or other regulated decisions. Use a qualified security review, privacy/legal review and accountable business approval. Run the test plan only in an authorised sandbox with synthetic data.

See MODEL_CARD.md, ACTION_PLAN.md and REFERENCES.md.
