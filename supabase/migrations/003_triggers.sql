-- ============================================================
-- NORTH CRM
-- Migration 003 — Triggers
-- ============================================================

-- ============================================================
-- ORGANIZATION TIMEZONE
-- ============================================================

create trigger organizations_validate_timezone
before insert or update of timezone
on public.organizations
for each row
execute function public.validate_organization_timezone();

-- ============================================================
-- CREATE PROFILE AFTER AUTH USER CREATION
-- ============================================================

create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- NORMALIZE INVITATION EMAIL
-- ============================================================

create trigger invitations_normalize_email
before insert or update of email
on public.invitations
for each row
execute function public.normalize_invitation_email();

-- ============================================================
-- LEADS UPDATED_AT
-- ============================================================

create trigger leads_set_updated_at
before update
on public.leads
for each row
execute function public.set_updated_at();

-- ============================================================
-- SCRIPTS UPDATED_AT
-- ============================================================

create trigger scripts_set_updated_at
before update
on public.scripts
for each row
execute function public.set_updated_at();

-- ============================================================
-- LEAD RESPONSIBLE VALIDATION
-- ============================================================

create trigger leads_validate_responsible
before insert or update of responsible_id, organization_id
on public.leads
for each row
execute function public.validate_lead_responsible();

-- ============================================================
-- FOLLOW-UP RESPONSIBLE VALIDATION
-- ============================================================

create trigger follow_ups_validate_responsible
before insert or update of responsible_id, organization_id, status
on public.follow_ups
for each row
execute function public.validate_follow_up_responsible();

-- ============================================================
-- PREVENT DIRECT OWNERSHIP CHANGES
-- ============================================================

create trigger organization_members_prevent_direct_ownership_change
before update of role
on public.organization_members
for each row
execute function public.prevent_direct_ownership_change();

-- ============================================================
-- PREVENT MEMBER USER CHANGE
-- ============================================================

create trigger organization_members_prevent_user_change
before update of user_id
on public.organization_members
for each row
execute function public.prevent_member_user_change();

-- ============================================================
-- ORGANIZATION MEMBERS TENANT IMMUTABILITY
-- ============================================================

create trigger organization_members_prevent_org_change
before update of organization_id
on public.organization_members
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — INVITATIONS
-- ============================================================

create trigger invitations_prevent_org_change
before update of organization_id
on public.invitations
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — PIPELINE STAGES
-- ============================================================

create trigger pipeline_stages_prevent_org_change
before update of organization_id
on public.pipeline_stages
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — LEAD SOURCES
-- ============================================================

create trigger lead_sources_prevent_org_change
before update of organization_id
on public.lead_sources
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — LEADS
-- ============================================================

create trigger leads_prevent_org_change
before update of organization_id
on public.leads
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — STAGE HISTORY
-- ============================================================

create trigger lead_stage_history_prevent_org_change
before update of organization_id
on public.lead_stage_history
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — FOLLOW-UPS
-- ============================================================

create trigger follow_ups_prevent_org_change
before update of organization_id
on public.follow_ups
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — APPOINTMENTS
-- ============================================================

create trigger appointments_prevent_org_change
before update of organization_id
on public.appointments
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — ACTIVITIES
-- ============================================================

create trigger activities_prevent_org_change
before update of organization_id
on public.activities
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — CLIENTS
-- ============================================================

create trigger clients_prevent_org_change
before update of organization_id
on public.clients
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — TAGS
-- ============================================================

create trigger tags_prevent_org_change
before update of organization_id
on public.tags
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — LEAD TAGS
-- ============================================================

create trigger lead_tags_prevent_org_change
before update of organization_id
on public.lead_tags
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — SCRIPTS
-- ============================================================

create trigger scripts_prevent_org_change
before update of organization_id
on public.scripts
for each row
execute function public.prevent_organization_change();

-- ============================================================
-- TENANT IMMUTABILITY — AUDIT LOGS
-- ============================================================

create trigger audit_logs_prevent_org_change
before update of organization_id
on public.audit_logs
for each row
execute function public.prevent_audit_organization_change();

-- ============================================================
-- FORCE ACTIVITY ACTOR
-- ============================================================

create trigger activities_force_actor
before insert
on public.activities
for each row
execute function public.force_activity_actor();

-- ============================================================
-- PREVENT MEMBER SOFT DELETE — LEADS
-- ============================================================

create trigger leads_prevent_member_soft_delete
before update of deleted_at
on public.leads
for each row
execute function public.prevent_member_soft_delete();

-- ============================================================
-- PREVENT MEMBER SOFT DELETE — APPOINTMENTS
-- ============================================================

create trigger appointments_prevent_member_soft_delete
before update of deleted_at
on public.appointments
for each row
execute function public.prevent_member_soft_delete();

-- ============================================================
-- ORGANIZATION OWNER INTEGRITY
-- ============================================================

create constraint trigger organization_members_must_have_owner
after insert or update of role, organization_id or delete
on public.organization_members
deferrable initially deferred
for each row
execute function public.check_org_has_owner();