# WorkLedger — Employee Operations & Project Delivery Portal

A multi-user employee operations portal for attendance sessions, daily updates, task tracking, work-hour logs, client requirements, deliverable review, project progress and manager reporting.

**Frontend:** React + TypeScript + Vite  
**Authentication and database:** Supabase Auth + PostgreSQL  
**Hosting:** GitHub Pages (deployment workflow succeeded)  
**Reporting:** Read-only, allow-listed, multi-step reporting agent  
**Roles:** employee, manager, admin

## What the portal supports

### Employee workspace
- Individual email/password sign-in; invitation-only, no public self-registration.
- Check-in and check-out attendance sessions.
- Submit daily accomplishments, next steps and blockers.
- Update assigned task status, percent complete and blockers.
- Log work hours against projects and assigned tasks.
- Submit deliverable links and descriptions for manager review.
- Read manager feedback and respond to an open review cycle.

### Manager workspace
- Create client projects and define requirements/acceptance criteria.
- Assign tasks, due dates and priorities.
- Review team check-in/check-out sessions, daily updates and time logs.
- Inspect overdue and blocked work items.
- Review submitted deliverables, approve them or request specific changes.
- Generate an employee-specific daily operational report.
- Open and close human-led review cycles with documented context and an employee response.

## Reporting agent boundary

The reporting agent in `src/reportingAgent.ts` orchestrates a fixed allow-list of read-only data tools: attendance, tasks, time logs, deliverables, daily updates and projects. It validates the caller and relies on Supabase RLS for access control. It generates a structured report, counts exceptions and identifies work items needing manager attention.

It is deliberately not allowed to:
- update tasks or time records;
- approve or reject deliverables;
- open or close a personnel review cycle;
- score, rank or label employees as performers/non-performers;
- recommend disciplinary action.

The current reporting agent is a deterministic, tool-orchestrated reporting system, not an LLM that autonomously controls business systems. A local LLM may be added as an optional narrative summariser, but it should receive only de-identified aggregate metrics and never receive tool execution authority.

## Important employee-review safeguard

The portal flags operational facts attached to work items: a task is overdue, a blocker has been recorded, a progress update is missing, or a deliverable needs changes. These signals are not an employee performance score. A manager must review scope, workload, dependencies, leave, access, client changes, support needs and employee context before deciding whether a review cycle is appropriate. Employees can respond. No automated adverse employment decision is made.

## Setup overview

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor.
3. Create the first Auth user in Supabase Dashboard, then use the SQL bootstrap instructions in `SETUP.md` to create the organisation and admin profile.
4. Invite employees and managers in Supabase Auth, then provision their profile rows using the SQL examples in `SETUP.md`.
5. Add GitHub Actions repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
6. In GitHub repository Settings → Pages, choose **GitHub Actions** as the publishing source.
7. Push to `main` or manually run the workflow `.github/workflows/deploy-employee-portal.yml`.

The intended GitHub Pages URL is:

https://koderkunal.github.io/KoderKunal/

**Deployment status:** the GitHub Actions build and deployment jobs both succeeded after the Supabase URL and publishable-key secrets were added. The application is published at the URL above.

**Still required before real use:** confirm the organisation and administrator profile in Supabase, provision employee/manager profiles, then test sign-in and role-based data isolation with separate accounts. The successful deployment proves the static application was built and published; it does not by itself prove end-to-end employee authentication or access-control behaviour.

## Local development

Requirements: Node.js 20+ and npm.

    cd employee-ops-portal
    cp .env.example .env.local
    # populate VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
    npm install
    npm run dev

Build locally:

    npm run build

## Security notes

- The browser uses only the Supabase project URL and publishable key.
- Never place a Supabase secret/service-role key in frontend code or Vite environment variables.
- All business tables have RLS enabled. The SQL migration also adds composite organisation foreign keys to reduce cross-tenant reference mistakes.
- New users must be invited and have a provisioned profile row with a role.
- Use MFA for administrator and manager accounts; apply Supabase Auth rate limits and email verification.
- Configure backup, retention, incident response and privacy notices before real employee use.
- Attendance and work-hour entries are self-reported; this portal does not use biometrics, GPS or covert monitoring.
- Do not upload sensitive employee records or client-confidential deliverables to the public GitHub repository.

Read `SETUP.md`, `SECURITY_MODEL.md` and `REPORTING_AGENT.md` before use.
