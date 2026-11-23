# WorkLedger security and employee safeguards

## Roles
- **Employee:** own profile fields (name/timezone), own attendance, time logs, daily updates, assigned task progress, submitted deliverables and own review-cycle response.
- **Manager:** organisation-wide project/task/attendance/work-log/deliverable/progress visibility; create projects, requirements and tasks; review deliverables; initiate/close human review cycles.
- **Admin:** manager permissions plus user/role provisioning through the Supabase administrator process.

Role changes are not permitted from the employee UI. Profiles are provisioned by an administrator. The database is the authority; hiding a button is not an access control.

## Data boundaries
- RLS is enabled on each business table.
- Employees can read their own records and assigned tasks.
- Managers/admins can read organisation data.
- Composite foreign keys tie employees, managers, projects, tasks, work logs and deliverables to the same organisation.
- The task progress function checks caller membership and assignment/manager role and only updates progress fields.
- Audit triggers record metadata for important changes without copying sensitive narrative content.

## Sensitive employment context
This software does not compute an employee performance score, rank employees, infer commitment from attendance, or automatically recommend disciplinary action or termination.

A work-item alert may indicate:
- a task due date has passed;
- an employee has reported a blocker;
- the task has no recent update;
- a deliverable has been sent back for changes.

These indicators can be caused by missing client inputs, unrealistic scope, workload imbalance, approved leave, access problems, dependencies or data-entry mistakes. They are not evidence by themselves of poor performance.

A manager may open a review cycle manually, record its purpose and evidence, invite an employee response and close it after consideration. This is a human-led process, not an automated model output.

## Production controls still required
- Apply and validate Supabase RLS; perform cross-user and cross-organisation negative tests.
- Enable MFA for privileged roles and strong authentication policies.
- Configure backups, database monitoring, retention and incident response.
- Review privacy notices, employee consultation, applicable labour/data protection requirements, client confidentiality and contractual retention.
- Use a custom domain and TLS if desired; GitHub Pages uses HTTPS.
- Conduct a security review before real deployment. This starter implementation is not a certified HRIS or payroll product.
