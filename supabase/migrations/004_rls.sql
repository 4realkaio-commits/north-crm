-- ============================================================
-- NORTH CRM
-- Migration 004 — Row Level Security
-- ============================================================

-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.invitations enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.lead_sources enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.follow_ups enable row level security;
alter table public.appointments enable row level security;
alter table public.activities enable row level security;
alter table public.clients enable row level security;
alter table public.tags enable row level security;
alter table public.lead_tags enable row level security;
alter table public.scripts enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

create policy organizations_select
on public.organizations
for select
to authenticated
using (
    public.is_org_member(id)
);

create policy organizations_update
on public.organizations
for update
to authenticated
using (
    public.get_user_role(id) in ('owner', 'admin')
)
with check (
    public.get_user_role(id) in ('owner', 'admin')
);

create policy organizations_delete
on public.organizations
for delete
to authenticated
using (
    public.get_user_role(id) = 'owner'
);

-- ============================================================
-- PROFILES
-- ============================================================

create policy profiles_select
on public.profiles
for select
to authenticated
using (
    id = (select auth.uid())
    or exists (
        select 1
        from public.organization_members mine
        join public.organization_members other
          on other.organization_id = mine.organization_id
        where mine.user_id = (select auth.uid())
          and other.user_id = profiles.id
    )
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (
    id = (select auth.uid())
)
with check (
    id = (select auth.uid())
);

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================

create policy organization_members_select
on public.organization_members
for select
to authenticated
using (
    public.is_org_member(organization_id)
);

create policy organization_members_update
on public.organization_members
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- Direct member deletion is intentionally not allowed.
-- Removal must happen through the RPC.

-- ============================================================
-- INVITATIONS
-- ============================================================

create policy invitations_select
on public.invitations
for select
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy invitations_insert
on public.invitations
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
    and invited_by = (select auth.uid())
);

create policy invitations_update
on public.invitations
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy invitations_delete
on public.invitations
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- PIPELINE STAGES
-- ============================================================

create policy pipeline_stages_select
on public.pipeline_stages
for select
to authenticated
using (
    public.is_org_member(organization_id)
);

create policy pipeline_stages_insert
on public.pipeline_stages
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy pipeline_stages_update
on public.pipeline_stages
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy pipeline_stages_delete
on public.pipeline_stages
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- LEAD SOURCES
-- ============================================================

create policy lead_sources_select
on public.lead_sources
for select
to authenticated
using (
    public.is_org_member(organization_id)
);

create policy lead_sources_insert
on public.lead_sources
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy lead_sources_update
on public.lead_sources
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy lead_sources_delete
on public.lead_sources
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- LEADS
-- ============================================================

create policy leads_select
on public.leads
for select
to authenticated
using (
    public.can_access_lead(id)
);

create policy leads_insert
on public.leads
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
    or (
        public.get_user_role(organization_id) = 'member'
        and responsible_id = (select auth.uid())
    )
);

create policy leads_update
on public.leads
for update
to authenticated
using (
    public.can_access_lead(id)
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
    or (
        public.get_user_role(organization_id) = 'member'
        and responsible_id = (select auth.uid())
    )
);

create policy leads_delete
on public.leads
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- LEAD STAGE HISTORY
-- ============================================================

create policy lead_stage_history_select
on public.lead_stage_history
for select
to authenticated
using (
    public.can_access_lead(lead_id)
);

-- Inserts are intentionally restricted.
-- Stage history must be generated by the stage-change RPC.

-- ============================================================
-- FOLLOW-UPS
-- ============================================================

create policy follow_ups_select
on public.follow_ups
for select
to authenticated
using (
    public.can_access_lead(lead_id)
);

create policy follow_ups_insert
on public.follow_ups
for insert
to authenticated
with check (
    public.can_access_lead(lead_id)
    and (
        public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
        or responsible_id = (select auth.uid())
    )
);

create policy follow_ups_update
on public.follow_ups
for update
to authenticated
using (
    public.can_access_lead(lead_id)
)
with check (
    public.can_access_lead(lead_id)
    and (
        public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
        or responsible_id = (select auth.uid())
    )
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

create policy appointments_select
on public.appointments
for select
to authenticated
using (
    public.can_access_lead(lead_id)
);

create policy appointments_insert
on public.appointments
for insert
to authenticated
with check (
    public.can_access_lead(lead_id)
);

create policy appointments_update
on public.appointments
for update
to authenticated
using (
    public.can_access_lead(lead_id)
)
with check (
    public.can_access_lead(lead_id)
);

-- No direct delete policy.
-- Appointments use soft delete.

-- ============================================================
-- ACTIVITIES
-- ============================================================

create policy activities_select
on public.activities
for select
to authenticated
using (
    public.can_access_lead(lead_id)
);

create policy activities_insert
on public.activities
for insert
to authenticated
with check (
    public.can_access_lead(lead_id)
);

-- ============================================================
-- CLIENTS
-- ============================================================

create policy clients_select
on public.clients
for select
to authenticated
using (
    public.is_org_member(organization_id)
);

create policy clients_insert
on public.clients
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
    or (
        public.get_user_role(organization_id) = 'member'
        and lead_id is not null
        and public.can_access_lead(lead_id)
    )
);

create policy clients_update
on public.clients
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
);

create policy clients_delete
on public.clients
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- TAGS
-- ============================================================

create policy tags_select
on public.tags
for select
to authenticated
using (
    public.is_org_member(organization_id)
);

create policy tags_insert
on public.tags
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy tags_update
on public.tags
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy tags_delete
on public.tags
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- LEAD TAGS
-- ============================================================

create policy lead_tags_select
on public.lead_tags
for select
to authenticated
using (
    public.can_access_lead(lead_id)
);

create policy lead_tags_insert
on public.lead_tags
for insert
to authenticated
with check (
    public.can_access_lead(lead_id)
);

create policy lead_tags_delete
on public.lead_tags
for delete
to authenticated
using (
    public.can_access_lead(lead_id)
);

-- ============================================================
-- SCRIPTS
-- ============================================================

create policy scripts_select
on public.scripts
for select
to authenticated
using (
    public.is_org_member(organization_id)
);

create policy scripts_insert
on public.scripts
for insert
to authenticated
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy scripts_update
on public.scripts
for update
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
)
with check (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

create policy scripts_delete
on public.scripts
for delete
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin')
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create policy audit_logs_select
on public.audit_logs
for select
to authenticated
using (
    public.get_user_role(organization_id) in ('owner', 'admin', 'manager')
);

-- No INSERT / UPDATE / DELETE policies.
-- Audit logs are written only by SECURITY DEFINER RPCs.