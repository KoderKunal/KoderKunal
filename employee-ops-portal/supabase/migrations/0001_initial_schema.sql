-- WorkLedger employee operations portal
-- Apply in Supabase SQL Editor after creating the first Auth user.
-- This migration creates an organisation and its initial admin profile.
-- Replace the bootstrap values at the bottom before running.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  email text not null,
  role text not null default 'employee' check (role in ('employee','manager','admin')),
  timezone text not null default 'Asia/Kolkata',
  manager_id uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  client_name text not null,
  description text not null default '',
  status text not null default 'planning' check (status in ('planning','active','on_hold','completed','archived')),
  start_date date,
  target_end_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement text not null,
  acceptance_criteria text not null default '',
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  due_date date,
  status text not null default 'open' check (status in ('open','in_progress','met','waived')),
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid references public.project_requirements(id) on delete set null,
  title text not null,
  description text not null default '',
  assigned_to uuid not null references public.profiles(id),
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done')),
  percent_complete int not null default 0 check (percent_complete between 0 and 100),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  start_date date,
  due_date date,
  blocker text not null default '',
  update_note text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status <> 'done') or percent_complete = 100)
);

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  check (checked_out_at is null or checked_out_at >= checked_in_at)
);
create unique index if not exists one_open_attendance_per_user
  on public.attendance_sessions(user_id) where checked_out_at is null;

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  work_date date not null default current_date,
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  update_date date not null default current_date,
  accomplished text not null,
  next_steps text not null default '',
  blockers text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text not null default '',
  url text not null,
  submitted_by uuid not null references public.profiles(id),
  status text not null default 'submitted' check (status in ('submitted','in_review','approved','changes_requested')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  manager_feedback text not null default ''
);

create table if not exists public.review_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  initiated_by uuid not null references public.profiles(id),
  title text not null,
  purpose text not null,
  evidence_summary text not null default '',
  employee_response text not null default '',
  status text not null default 'open' check (status in ('open','employee_response','manager_review','closed')),
  opened_at timestamptz not null default now(),
  due_date date,
  closed_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

 
-- Composite organisation keys prevent cross-tenant references even if a manager
-- accidentally selects a user/project from another organisation.
alter table public.profiles add constraint profiles_id_org_unique unique (id, organization_id);
alter table public.profiles add constraint profiles_manager_org_fk foreign key (manager_id, organization_id) references public.profiles(id, organization_id);
alter table public.projects add constraint projects_id_org_unique unique (id, organization_id);
alter table public.project_requirements add constraint requirements_id_org_unique unique (id, organization_id);
alter table public.tasks add constraint tasks_id_org_unique unique (id, organization_id);
alter table public.tasks add constraint tasks_assignee_org_fk foreign key (assigned_to, organization_id) references public.profiles(id, organization_id);
alter table public.tasks add constraint tasks_project_org_fk foreign key (project_id, organization_id) references public.projects(id, organization_id);
alter table public.tasks add constraint tasks_requirement_org_fk foreign key (requirement_id, organization_id) references public.project_requirements(id, organization_id);
alter table public.projects add constraint projects_creator_org_fk foreign key (created_by, organization_id) references public.profiles(id, organization_id);
alter table public.project_requirements add constraint requirements_creator_org_fk foreign key (created_by, organization_id) references public.profiles(id, organization_id);
alter table public.project_requirements add constraint requirements_project_org_fk foreign key (project_id, organization_id) references public.projects(id, organization_id);
alter table public.project_requirements add constraint requirements_owner_org_fk foreign key (owner_id, organization_id) references public.profiles(id, organization_id);
alter table public.tasks add constraint tasks_creator_org_fk foreign key (created_by, organization_id) references public.profiles(id, organization_id);
alter table public.attendance_sessions add constraint attendance_user_org_fk foreign key (user_id, organization_id) references public.profiles(id, organization_id);
alter table public.work_logs add constraint work_logs_user_org_fk foreign key (user_id, organization_id) references public.profiles(id, organization_id);
alter table public.work_logs add constraint work_logs_project_org_fk foreign key (project_id, organization_id) references public.projects(id, organization_id);
alter table public.work_logs add constraint work_logs_task_org_fk foreign key (task_id, organization_id) references public.tasks(id, organization_id);
alter table public.progress_updates add constraint progress_user_org_fk foreign key (user_id, organization_id) references public.profiles(id, organization_id);
alter table public.progress_updates add constraint progress_project_org_fk foreign key (project_id, organization_id) references public.projects(id, organization_id);
alter table public.deliverables add constraint deliverables_submitter_org_fk foreign key (submitted_by, organization_id) references public.profiles(id, organization_id);
alter table public.deliverables add constraint deliverables_project_org_fk foreign key (project_id, organization_id) references public.projects(id, organization_id);
alter table public.deliverables add constraint deliverables_task_org_fk foreign key (task_id, organization_id) references public.tasks(id, organization_id);
alter table public.deliverables add constraint deliverables_reviewer_org_fk foreign key (reviewed_by, organization_id) references public.profiles(id, organization_id);
alter table public.review_cycles add constraint reviews_employee_org_fk foreign key (employee_id, organization_id) references public.profiles(id, organization_id);
alter table public.review_cycles add constraint reviews_initiator_org_fk foreign key (initiated_by, organization_id) references public.profiles(id, organization_id);
alter table public.audit_events add constraint audit_actor_org_fk foreign key (actor_id, organization_id) references public.profiles(id, organization_id);

create index if not exists profiles_org_role_idx on public.profiles(organization_id,role);
create index if not exists projects_org_status_idx on public.projects(organization_id,status);
create index if not exists tasks_assignee_status_idx on public.tasks(assigned_to,status);
create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists attendance_user_date_idx on public.attendance_sessions(user_id,checked_in_at);
create index if not exists work_logs_user_date_idx on public.work_logs(user_id,work_date);
create index if not exists deliverables_project_status_idx on public.deliverables(project_id,status);
create index if not exists reviews_employee_status_idx on public.review_cycles(employee_id,status);

create or replace function private.current_org_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.organization_id from public.profiles p where p.id = (select auth.uid()) and p.active = true limit 1
$$;

create or replace function private.is_manager_or_admin(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.organization_id = target_org
      and p.active = true and p.role in ('manager','admin')
  )
$$;

create or replace function private.is_admin(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.organization_id = target_org
      and p.active = true and p.role = 'admin'
  )
$$;

create or replace function private.is_active_member(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.organization_id = target_org and p.active = true
  )
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_org_id() to authenticated;
grant execute on function private.is_manager_or_admin(uuid) to authenticated;
grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.is_active_member(uuid) to authenticated;

-- Task progress updates are constrained to safe employee-editable fields.
create or replace function public.update_task_progress(
  p_task_id uuid, p_status text, p_percent_complete integer,
  p_blocker text default '', p_update_note text default ''
)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_task public.tasks%rowtype;
begin
  if p_status not in ('todo','in_progress','blocked','done') then
    raise exception 'Invalid task status';
  end if;
  if p_percent_complete < 0 or p_percent_complete > 100 then
    raise exception 'Progress must be between 0 and 100';
  end if;
  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then raise exception 'Task not found or access denied'; end if;
  if not private.is_active_member(v_task.organization_id) then
    raise exception 'Not authorised: inactive or unrelated organisation member';
  end if;
  if v_task.assigned_to <> (select auth.uid())
     and not private.is_manager_or_admin(v_task.organization_id) then
    raise exception 'Not authorised to update this task';
  end if;
  update public.tasks set status = p_status,
      percent_complete = case when p_status = 'done' then 100 else p_percent_complete end,
      blocker = coalesce(p_blocker,''),
      update_note = coalesce(p_update_note,''),
      updated_at = now(),
      completed_at = case when p_status = 'done' then now() else null end
    where id = p_task_id;
end;
$$;
revoke all on function public.update_task_progress(uuid,text,integer,text,text) from public, anon;
grant execute on function public.update_task_progress(uuid,text,integer,text,text) to authenticated;

-- RLS enabled on every organisation/business table.
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_requirements enable row level security;
alter table public.tasks enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.work_logs enable row level security;
alter table public.progress_updates enable row level security;
alter table public.deliverables enable row level security;
alter table public.review_cycles enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.organizations,public.profiles,public.projects,public.project_requirements,
 public.tasks,public.attendance_sessions,public.work_logs,public.progress_updates,
 public.deliverables,public.review_cycles,public.audit_events from anon;
grant select on public.organizations,public.profiles,public.projects,public.project_requirements,
 public.tasks,public.attendance_sessions,public.work_logs,public.progress_updates,
 public.deliverables,public.review_cycles,public.audit_events to authenticated;
grant insert on public.projects,public.project_requirements,public.tasks,
 public.attendance_sessions,public.work_logs,public.progress_updates,public.deliverables,
 public.review_cycles,public.audit_events to authenticated;
grant update (full_name,timezone) on public.profiles to authenticated;
grant update (checked_out_at,note) on public.attendance_sessions to authenticated;
grant update (status,manager_feedback,reviewed_by,reviewed_at) on public.deliverables to authenticated;
grant update (employee_response,status) on public.review_cycles to authenticated;
grant update (evidence_summary,status,closed_at) on public.review_cycles to authenticated;

create policy org_read_member on public.organizations for select to authenticated
using (id = private.current_org_id());

create policy profiles_read_self_or_manager on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid()) and active = true)
with check (id = (select auth.uid()) and active = true);

create policy projects_read_org on public.projects for select to authenticated
using (private.is_active_member(organization_id));
create policy projects_insert_manager on public.projects for insert to authenticated
with check (private.is_manager_or_admin(organization_id) and created_by = (select auth.uid()));
create policy projects_update_manager on public.projects for update to authenticated
using (private.is_manager_or_admin(organization_id))
with check (private.is_manager_or_admin(organization_id));

create policy requirements_read_org on public.project_requirements for select to authenticated
using (private.is_active_member(organization_id));
create policy requirements_insert_manager on public.project_requirements for insert to authenticated
with check (private.is_manager_or_admin(organization_id) and created_by = (select auth.uid()));
create policy requirements_update_manager on public.project_requirements for update to authenticated
using (private.is_manager_or_admin(organization_id))
with check (private.is_manager_or_admin(organization_id));

create policy tasks_read_assigned_or_manager on public.tasks for select to authenticated
using (assigned_to = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy tasks_insert_manager on public.tasks for insert to authenticated
with check (private.is_manager_or_admin(organization_id) and created_by = (select auth.uid()));
create policy tasks_update_manager on public.tasks for update to authenticated
using (private.is_manager_or_admin(organization_id))
with check (private.is_manager_or_admin(organization_id));

create policy attendance_read_self_or_manager on public.attendance_sessions for select to authenticated
using (user_id = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy attendance_insert_self on public.attendance_sessions for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_active_member(organization_id));
create policy attendance_checkout_self_or_manager on public.attendance_sessions for update to authenticated
using (user_id = (select auth.uid()) or private.is_manager_or_admin(organization_id))
with check (user_id = (select auth.uid()) or private.is_manager_or_admin(organization_id));

create policy work_logs_read_self_or_manager on public.work_logs for select to authenticated
using (user_id = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy work_logs_insert_self on public.work_logs for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_active_member(organization_id));

create policy progress_read_self_or_manager on public.progress_updates for select to authenticated
using (user_id = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy progress_insert_self on public.progress_updates for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_active_member(organization_id));

create policy deliverables_read_self_or_manager on public.deliverables for select to authenticated
using (submitted_by = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy deliverables_insert_self on public.deliverables for insert to authenticated
with check (submitted_by = (select auth.uid()) and status = 'submitted' and reviewed_by is null and private.is_active_member(organization_id));
create policy deliverables_review_manager on public.deliverables for update to authenticated
using (private.is_manager_or_admin(organization_id))
with check (private.is_manager_or_admin(organization_id));
create policy deliverables_resubmit_self on public.deliverables for update to authenticated
using (submitted_by = (select auth.uid()) and status = 'changes_requested')
with check (submitted_by = (select auth.uid()) and status = 'submitted' and reviewed_by is null);

create policy reviews_read_self_or_manager on public.review_cycles for select to authenticated
using (employee_id = (select auth.uid()) or private.is_manager_or_admin(organization_id));
create policy reviews_insert_manager on public.review_cycles for insert to authenticated
with check (private.is_manager_or_admin(organization_id) and initiated_by = (select auth.uid()));
create policy reviews_employee_response on public.review_cycles for update to authenticated
using (employee_id = (select auth.uid()) and status in ('open','employee_response'))
with check (employee_id = (select auth.uid()) and status in ('employee_response','open'));
create policy reviews_manager_update on public.review_cycles for update to authenticated
using (private.is_manager_or_admin(organization_id))
with check (private.is_manager_or_admin(organization_id));

create policy audit_read_manager on public.audit_events for select to authenticated
using (private.is_manager_or_admin(organization_id));
create policy audit_insert_member on public.audit_events for insert to authenticated
with check (actor_id = (select auth.uid()) and private.is_active_member(organization_id));

 
-- Append minimal audit metadata for business-record changes. Do not log passwords,
-- access tokens, full deliverable content or sensitive employee narrative.
create or replace function private.write_audit_event()
returns trigger language plpgsql security definer set search_path = ''
as $
declare
  v_org uuid;
  v_entity uuid;
  v_action text := lower(TG_OP);
begin
  if TG_OP = 'DELETE' then
    v_org := OLD.organization_id;
    v_entity := OLD.id;
    insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,details)
      values(v_org,auth.uid(),TG_TABLE_NAME,v_entity,v_action,jsonb_build_object('logged_at',now()));
    return OLD;
  else
    v_org := NEW.organization_id;
    v_entity := NEW.id;
    insert into public.audit_events(organization_id,actor_id,entity_type,entity_id,action,details)
      values(v_org,auth.uid(),TG_TABLE_NAME,v_entity,v_action,jsonb_build_object('logged_at',now()));
    return NEW;
  end if;
end;
$;
revoke all on function private.write_audit_event() from public, anon, authenticated;

create trigger audit_projects after insert or update or delete on public.projects
  for each row execute function private.write_audit_event();
create trigger audit_requirements after insert or update or delete on public.project_requirements
  for each row execute function private.write_audit_event();
create trigger audit_tasks after insert or update or delete on public.tasks
  for each row execute function private.write_audit_event();
create trigger audit_attendance after insert or update or delete on public.attendance_sessions
  for each row execute function private.write_audit_event();
create trigger audit_work_logs after insert or update or delete on public.work_logs
  for each row execute function private.write_audit_event();
create trigger audit_progress_updates after insert or update or delete on public.progress_updates
  for each row execute function private.write_audit_event();
create trigger audit_deliverables after insert or update or delete on public.deliverables
  for each row execute function private.write_audit_event();
create trigger audit_review_cycles after insert or update or delete on public.review_cycles
  for each row execute function private.write_audit_event();

-- Bootstrap one organisation and the initial admin user. Replace both placeholders.
-- Create the first Auth user using Supabase Dashboard > Authentication > Users > Add user.
-- Then replace the values below and run this block.
do $bootstrap$
declare
  v_org uuid;
  v_user_text text := 'REPLACE_WITH_FIRST_AUTH_USER_UUID';
  v_user uuid;
begin
  if v_user_text = 'REPLACE_WITH_FIRST_AUTH_USER_UUID' then
    raise notice 'Bootstrap skipped. Replace the user UUID before running this block.';
    return;
  end if;
  v_user := v_user_text::uuid;
  insert into public.organizations(name) values ('Your Organisation')
    returning id into v_org;
  insert into public.profiles(id,organization_id,full_name,email,role)
  select v_user,v_org,coalesce(u.raw_user_meta_data->>'full_name','Portal Admin'),u.email,'admin'
  from auth.users u where u.id = v_user;
end
$bootstrap$;
