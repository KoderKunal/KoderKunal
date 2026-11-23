# Example AI Agent Governance Remediation Roadmap

This is a generic planning template. Actual priority, owner and timeline must follow the assessed architecture, threat model and business impact.

## Immediate containment (0–2 weeks)
- Inventory agents, owners, models, tools, data sources, identities and external connections.
- Remove unused tools and excessive write permissions.
- Require human approval for irreversible/high-impact actions.
- Issue scoped, short-lived credentials and enforce resource-level authorization.
- Define emergency stop and credential-revocation procedures.

## Engineering controls (2–4 weeks)
- Enforce tool allowlists and strict server-side argument validation.
- Separate trusted instructions from untrusted retrieved/user content.
- Sandbox code execution and restrict filesystem/network egress.
- Add memory provenance, write governance and retention limits.
- Authenticate inter-agent messages and validate typed contracts.
- Set retry, step, token, cost and concurrency budgets; add circuit breakers.

## Assurance and monitoring (4–6 weeks)
- Execute controlled tests in staging with synthetic data.
- Capture model/version, retrieval, tool, policy and approval traces.
- Test output validation, DLP and privacy filtering.
- Add recurring evaluations, monitoring thresholds and remediation owners.
- Exercise incident response, kill switch and rollback.

## Evidence before accepting residual risk
- Current agent/tool/data-flow diagram and named owner.
- Permission matrix and least-privilege test evidence.
- Approval logs for consequential actions.
- Results for prompt-injection, tool, identity, sandbox, memory, inter-agent, retry and emergency-stop tests.
- Observability/retention evidence and exception register.
- Signed risk acceptance by an accountable business owner with expiry/review date.
