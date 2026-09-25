-- ============================================================
-- NORTH CRM
-- Migration 001 — Initial Schema
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

create table public.organizations (
    id uuid primary key default extensions.gen_random_uuid(),
    name text not null,
    slug text not null unique,
    timezone text not null default 'America/Sao_Paulo',
    logo_url text,
    phone text,
    email text,
    plan text not null default 'trial',
    created_at timestamptz not null default now(),

    constraint organizations_name_check
        check (char_length(trim(name)) between 1 and 200),

    constraint organizations_slug_check
        check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    created_at timestamptz not null default now()
);

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================

create table public.organization_members (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    user_id uuid not null
        references public.profiles(id) on delete cascade,
    role text not null default 'member',
    created_at timestamptz not null default now(),

    constraint organization_members_role_check
        check (role in ('owner', 'admin', 'manager', 'member')),

    constraint organization_members_org_user_unique
        unique (organization_id, user_id),

    constraint organization_members_org_id_unique
        unique (organization_id, id)
);

-- ============================================================
-- INVITATIONS
-- ============================================================

create table public.invitations (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    email text not null,
    role text not null default 'member',
    invited_by uuid
        references public.profiles(id) on delete set null,
    token_hash text not null unique,
    expires_at timestamptz not null,
    accepted_at timestamptz,
    created_at timestamptz not null default now(),

    constraint invitations_role_check
        check (role in ('admin', 'manager', 'member')),

    constraint invitations_email_check
        check (email = lower(trim(email)))
);

create unique index invitations_pending_email_unique
    on public.invitations (organization_id, email)
    where accepted_at is null;

create index invitations_token_hash_idx
    on public.invitations (token_hash);

-- ============================================================
-- PIPELINE STAGES
-- ============================================================

create table public.pipeline_stages (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    name text not null,
    position integer not null,
    color text,
    is_final boolean not null default false,
    created_at timestamptz not null default now(),

    constraint pipeline_stages_name_check
        check (char_length(trim(name)) between 1 and 100),

    constraint pipeline_stages_position_check
        check (position >= 0),

    constraint pipeline_stages_org_position_unique
        unique (organization_id, position),

    constraint pipeline_stages_org_id_unique
        unique (organization_id, id)
);

-- ============================================================
-- LEAD SOURCES
-- ============================================================

create table public.lead_sources (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now(),

    constraint lead_sources_name_check
        check (char_length(trim(name)) between 1 and 100),

    constraint lead_sources_org_name_unique
        unique (organization_id, name),

    constraint lead_sources_org_id_unique
        unique (organization_id, id)
);

-- ============================================================
-- LEADS
-- ============================================================

create table public.leads (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    name text not null,
    phone text,
    phone_normalized text generated always as (
        nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '')
    ) stored,

    email text,
    email_normalized text generated always as (
        nullif(lower(trim(coalesce(email, ''))), '')
    ) stored,

    source_id uuid,
    stage_id uuid,

    responsible_id uuid
        references public.profiles(id) on delete set null,

    status text not null default 'novo',

    potential_value numeric(12,2) not null default 0,

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_contact_at timestamptz,
    next_follow_up_at timestamptz,
    deleted_at timestamptz,

    constraint leads_name_check
        check (char_length(trim(name)) between 1 and 200),

    constraint leads_status_check
        check (status in ('novo', 'em_contato', 'qualificado', 'convertido', 'perdido')),

    constraint leads_potential_value_check
        check (potential_value >= 0),

    constraint leads_org_id_unique
        unique (organization_id, id),

    constraint leads_source_org_fkey
        foreign key (organization_id, source_id)
        references public.lead_sources (organization_id, id)
        on delete set null (source_id),

    constraint leads_stage_org_fkey
        foreign key (organization_id, stage_id)
        references public.pipeline_stages (organization_id, id)
        on delete no action
        deferrable initially deferred
);

create index leads_organization_stage_idx
    on public.leads (organization_id, stage_id);

create index leads_organization_responsible_idx
    on public.leads (organization_id, responsible_id);

create index leads_organization_next_follow_up_idx
    on public.leads (organization_id, next_follow_up_at)
    where deleted_at is null;

create index leads_organization_created_at_idx
    on public.leads (organization_id, created_at);

create index leads_organization_phone_idx
    on public.leads (organization_id, phone_normalized);

create index leads_organization_email_idx
    on public.leads (organization_id, email_normalized);

-- ============================================================
-- LEAD STAGE HISTORY
-- ============================================================

create table public.lead_stage_history (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    lead_id uuid not null,

    from_stage_id uuid,
    to_stage_id uuid,

    changed_by uuid
        references public.profiles(id) on delete set null,

    changed_at timestamptz not null default now(),

    constraint lead_stage_history_lead_org_fkey
        foreign key (organization_id, lead_id)
        references public.leads (organization_id, id)
        on delete cascade,

    constraint lead_stage_history_from_stage_org_fkey
        foreign key (organization_id, from_stage_id)
        references public.pipeline_stages (organization_id, id)
        on delete set null (from_stage_id),

    constraint lead_stage_history_to_stage_org_fkey
        foreign key (organization_id, to_stage_id)
        references public.pipeline_stages (organization_id, id)
        on delete set null (to_stage_id)
);

create index lead_stage_history_lead_changed_at_idx
    on public.lead_stage_history (lead_id, changed_at desc);

-- ============================================================
-- FOLLOW-UPS
-- ============================================================

create table public.follow_ups (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    lead_id uuid not null,

    responsible_id uuid not null
        references public.profiles(id) on delete restrict,

    scheduled_at timestamptz not null,

    type text not null,
    note text,

    status text not null default 'pending',
    completed_at timestamptz,

    created_at timestamptz not null default now(),

    constraint follow_ups_lead_org_fkey
        foreign key (organization_id, lead_id)
        references public.leads (organization_id, id)
        on delete cascade,

    constraint follow_ups_status_check
        check (status in ('pending', 'completed', 'canceled')),

    constraint follow_ups_type_check
        check (char_length(trim(type)) between 1 and 50),

    constraint follow_ups_completed_at_check
        check (
            (status = 'completed' and completed_at is not null)
            or
            (status <> 'completed')
        )
);

create index follow_ups_organization_status_scheduled_idx
    on public.follow_ups (organization_id, status, scheduled_at);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

create table public.appointments (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    lead_id uuid not null,

    scheduled_at timestamptz not null,
    status text not null default 'scheduled',
    notes text,

    created_at timestamptz not null default now(),
    deleted_at timestamptz,

    constraint appointments_lead_org_fkey
        foreign key (organization_id, lead_id)
        references public.leads (organization_id, id)
        on delete cascade,

    constraint appointments_status_check
        check (status in (
            'scheduled',
            'confirmed',
            'attended',
            'no_show',
            'canceled'
        ))
);

create index appointments_organization_scheduled_idx
    on public.appointments (organization_id, scheduled_at);

-- ============================================================
-- ACTIVITIES
-- ============================================================

create table public.activities (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    lead_id uuid not null,

    type text not null,
    content text,
    metadata jsonb not null default '{}'::jsonb,

    created_by uuid
        references public.profiles(id) on delete set null,

    created_at timestamptz not null default now(),

    constraint activities_lead_org_fkey
        foreign key (organization_id, lead_id)
        references public.leads (organization_id, id)
        on delete cascade,

    constraint activities_type_check
        check (char_length(trim(type)) between 1 and 50)
);

create index activities_lead_created_at_idx
    on public.activities (lead_id, created_at desc);

-- ============================================================
-- CLIENTS
-- ============================================================

create table public.clients (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    lead_id uuid,

    name text not null,
    phone text,
    email text,

    converted_at timestamptz not null default now(),
    created_at timestamptz not null default now(),

    deleted_at timestamptz,

    constraint clients_name_check
        check (char_length(trim(name)) between 1 and 200),

    constraint clients_lead_org_fkey
        foreign key (organization_id, lead_id)
        references public.leads (organization_id, id)
        on delete set null (lead_id),

    constraint clients_org_id_unique
        unique (organization_id, id)
);

create unique index clients_active_lead_unique
    on public.clients (lead_id)
    where lead_id is not null
      and deleted_at is null;

-- ============================================================
-- TAGS
-- ============================================================

create table public.tags (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    name text not null,
    created_at timestamptz not null default now(),

    constraint tags_name_check
        check (char_length(trim(name)) between 1 and 50),

    constraint tags_org_name_unique
        unique (organization_id, name),

    constraint tags_org_id_unique
        unique (organization_id, id)
);

-- ============================================================
-- LEAD TAGS
-- ============================================================

create table public.lead_tags (
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    lead_id uuid not null,
    tag_id uuid not null,

    primary key (lead_id, tag_id),

    constraint lead_tags_lead_org_fkey
        foreign key (organization_id, lead_id)
        references public.leads (organization_id, id)
        on delete cascade,

    constraint lead_tags_tag_org_fkey
        foreign key (organization_id, tag_id)
        references public.tags (organization_id, id)
        on delete cascade
);

create index lead_tags_organization_idx
    on public.lead_tags (organization_id);

-- ============================================================
-- SCRIPTS
-- ============================================================

create table public.scripts (
    id uuid primary key default extensions.gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    name text not null,
    content text not null,
    variables jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,

    constraint scripts_name_check
        check (char_length(trim(name)) between 1 and 200)
);

create index scripts_organization_idx
    on public.scripts (organization_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table public.audit_logs (
    id uuid primary key default extensions.gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id) on delete cascade,

    user_id uuid
        references public.profiles(id) on delete set null,

    action text not null,
    entity_type text not null,
    entity_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    constraint audit_logs_action_check
        check (char_length(trim(action)) between 1 and 100),

    constraint audit_logs_entity_type_check
        check (char_length(trim(entity_type)) between 1 and 100)
);

create index audit_logs_organization_created_at_idx
    on public.audit_logs (organization_id, created_at desc);

create index audit_logs_entity_idx
    on public.audit_logs (entity_type, entity_id);

-- ============================================================
-- ORGANIZATION MEMBERS — SUPPORTING INDEX
-- ============================================================

create index organization_members_user_idx
    on public.organization_members (user_id);

-- ============================================================
-- ONE ACTIVE OWNER PER ORGANIZATION
-- ============================================================

create unique index organization_members_one_owner_idx
    on public.organization_members (organization_id)
    where role = 'owner';