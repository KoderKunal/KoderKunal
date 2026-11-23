# WorkLedger Reporting Agent

## Architecture
The reporting agent is a bounded, read-only orchestration layer. It uses an authenticated Supabase client from the current signed-in session and executes a fixed allowlist of tools:

1. Read today's attendance sessions.
2. Read assigned tasks and current work-item state.
3. Read work-log entries for the reporting date.
4. Read deliverables submitted by the reporting employee.
5. Read daily progress updates.
6. Read organisation project names/status for authorised project progress grouping.

It validates the authenticated caller, prevents an employee from requesting a report for a different user, and relies on row-level security for manager access to other employees in the same organisation. It does not accept model-generated SQL or arbitrary tool names.

## Report outputs
- Check-in/check-out sessions and closed-session elapsed time.
- Self-reported work-log hours.
- Assigned tasks, completed/open tasks, blockers and overdue work items.
- Daily accomplishments, next steps and blockers.
- Deliverables submitted that day.
- Per-project average task progress for the selected employee.
- Work-item exception list for manager review.

## Why the agent is read-only
The agent cannot update tasks, approve deliverables, alter attendance, create review cycles or change employee roles. This follows least privilege: use an orchestrator to gather and structure facts, but reserve consequential actions for a person with an authorised role and an auditable UI action.

## LLM extension
If adding Ollama or another language model later, send only de-identified aggregate counts and remove names, email addresses, raw daily narratives, client details and deliverable URLs. The model may draft a summary, but it must not create records, approve work, assign ratings or initiate employment action. Verify every claim against the underlying structured report.

## Limitations
- Attendance sessions and hours are self-reported; elapsed attendance time is not the same as productive work time.
- Task percent complete is employee/manager reported and is not an objective productivity measure.
- Project progress is a simple unweighted average of assigned task percentages, not an earned-value measure.
- Missing updates and overdue tasks need context; they are not employee performance conclusions.
