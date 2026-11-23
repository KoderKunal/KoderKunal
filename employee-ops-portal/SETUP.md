# WorkLedger — Administrator setup

## 1. Create Supabase project
1. Open https://supabase.com/dashboard and create a project in an appropriate region.
2. Save the database password securely.
3. Open Project Settings → API (or Connect) and copy the Project URL and publishable key.
4. Do not use the secret/service_role key in this frontend.

## 2. Apply the database migration
1. Open Supabase → SQL Editor.
2. Open `supabase/migrations/0001_initial_schema.sql` in this repository.
3. Run the SQL in the SQL Editor.
4. The final bootstrap block is intentionally skipped while its UUID placeholder remains. This allows you to create your first Auth user separately.

## 3. Create the first administrator
1. In Supabase → Authentication → Users, choose Add user / Invite user.
2. Create or invite your own administrator email. Confirm the email if required by your project's settings.
3. Open the new Auth user and copy its UUID.
4. Open SQL Editor and run this block after replacing the values:

```sql
do $$
declare
  v_org uuid;
  v_user uuid := 'REPLACE_WITH_ADMIN_AUTH_USER_UUID';
begin
  insert into public.organizations(name, timezone)
  values ('Your Organisation', 'Asia/Kolkata')
  returning id into v_org;

  insert into public.profiles(id, organization_id, full_name, email, role)
  select v_user, v_org,
         coalesce(u.raw_user_meta_data->>'full_name', 'Portal Admin'),
         u.email, 'admin'
  from auth.users u
  where u.id = v_user;
end $$;
```

Save the generated organisation UUID from the SQL output if you need it later. You can retrieve it with:

```sql
select id, name from public.organizations;
```

## 4. Invite and provision each employee or manager
1. Invite the person through Supabase → Authentication → Users. Do not enable anonymous/public sign-up for this portal.
2. Copy the Auth user UUID.
3. Use the organisation UUID from step 3 and run this SQL as the administrator in SQL Editor:

```sql
insert into public.profiles
  (id, organization_id, full_name, email, role, manager_id)
select
  u.id,
  'REPLACE_WITH_ORGANISATION_UUID'::uuid,
  'EMPLOYEE_DISPLAY_NAME',
  u.email,
  'employee',
  null
from auth.users u
where u.id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid
on conflict (id) do update set
  organization_id = excluded.organization_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  manager_id = excluded.manager_id,
  active = true;
```

For managers, change role to `manager`. For additional administrators, use `admin` sparingly. Manager and admin accounts can view organisation-wide project and employee operational records.

To deactivate someone, set `active = false` on their profile and revoke their Auth access. Do not delete historical work or audit records unless your retention policy requires it.

## 5. Configure Supabase Auth URLs
In Supabase → Authentication → URL Configuration:
- Set Site URL to `https://koderkunal.github.io/KoderKunal/`.
- Add `https://koderkunal.github.io/KoderKunal/**` to Redirect URLs if required for your email invite/verification flows.
- For local testing add `http://localhost:5173/**`.

Use strong passwords and enable MFA for administrators and managers. Configure email delivery before inviting the workforce.

## 6. Configure GitHub Pages secrets
In GitHub repository `KoderKunal/KoderKunal`:
1. Settings → Secrets and variables → Actions → New repository secret.
2. Add `VITE_SUPABASE_URL` with your Supabase Project URL.
3. Add `VITE_SUPABASE_PUBLISHABLE_KEY` with your Supabase publishable key.
4. Settings → Pages → Build and deployment → Source: GitHub Actions.
5. Actions → Deploy WorkLedger Portal → Run workflow (or push a change under `employee-ops-portal/`).

The publishable key is intended for browser use when RLS is correctly configured. Never add the Supabase secret/service_role key as a Vite variable.

## 7. Smoke test with two accounts
- Create an admin and one employee.
- Sign in as employee A. Confirm employee A sees only their own attendance, time logs, tasks, deliverables and review cycle.
- Sign in as manager. Confirm manager can see organisation records, assign a task, create a requirement, review a deliverable and initiate a review cycle.
- Create employee B. Confirm employee A cannot read employee B's records.
- Test task update RPC, check-in/out, review response and manager close-cycle actions.
- Inspect `audit_events` for record changes.
- Verify a non-manager cannot open the manager tab or read another employee's records even if API calls are attempted directly.

This repository contains schema and UI code, but the migration must be applied and tested in your own Supabase project before using actual employee data.
