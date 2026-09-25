-- ============================================================
-- NORTH CRM
-- Migration 002 — Functions
-- ============================================================

-- ============================================================
-- GENERIC UPDATED_AT
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ============================================================
-- ORGANIZATION TIMEZONE VALIDATION
-- ============================================================

create or replace function public.validate_organization_timezone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not exists (
        select 1
        from pg_catalog.pg_timezone_names
        where name = new.timezone
    ) then
        raise exception 'Invalid timezone: %', new.timezone;
    end if;

    return new;
end;
$$;

-- ============================================================
-- CREATE PROFILE WHEN AUTH USER IS CREATED
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (
        id,
        full_name
    )
    values (
        new.id,
        nullif(
            trim(new.raw_user_meta_data ->> 'full_name'),
            ''
        )
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

-- ============================================================
-- NORMALIZE INVITATION EMAIL
-- ============================================================

create or replace function public.normalize_invitation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    new.email = lower(trim(new.email));
    return new;
end;
$$;

-- ============================================================
-- VALIDATE LEAD RESPONSIBLE
-- ============================================================

create or replace function public.validate_lead_responsible()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.responsible_id is null then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and new.organization_id = old.organization_id
       and new.responsible_id is not distinct from old.responsible_id then
        return new;
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            new.organization_id::text
            || ':member:'
            || new.responsible_id::text,
            0
        )
    );

    if not exists (
        select 1
        from public.organization_members om
        where om.organization_id = new.organization_id
          and om.user_id = new.responsible_id
    ) then
        raise exception 'Responsible user is not a member of this organization';
    end if;

    return new;
end;
$$;

-- ============================================================
-- VALIDATE FOLLOW-UP RESPONSIBLE
-- ============================================================

create or replace function public.validate_follow_up_responsible()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.responsible_id is null then
        raise exception 'Follow-up responsible_id cannot be null';
    end if;

    if tg_op = 'UPDATE'
       and new.organization_id = old.organization_id
       and new.responsible_id is not distinct from old.responsible_id
       and new.status is not distinct from old.status then
        return new;
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            new.organization_id::text
            || ':member:'
            || new.responsible_id::text,
            0
        )
    );

    if not exists (
        select 1
        from public.organization_members om
        where om.organization_id = new.organization_id
          and om.user_id = new.responsible_id
    ) then
        raise exception 'Follow-up responsible user is not a member of this organization';
    end if;

    return new;
end;
$$;

-- ============================================================
-- PREVENT DIRECT OWNERSHIP CHANGES
-- ============================================================

create or replace function public.prevent_direct_ownership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.role is not distinct from old.role then
        return new;
    end if;

    if old.role = 'owner' or new.role = 'owner' then
        if pg_catalog.current_setting(
            'north_crm.allow_ownership_change',
            true
        ) is distinct from 'true' then
            raise exception
                'Ownership changes must be performed through the ownership transfer function';
        end if;
    end if;

    return new;
end;
$$;

-- ============================================================
-- PREVENT MEMBER USER CHANGE
-- ============================================================

create or replace function public.prevent_member_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.user_id is distinct from old.user_id then
        raise exception
            'organization_members.user_id cannot be changed';
    end if;

    return new;
end;
$$;

-- ============================================================
-- CHECK ORGANIZATION HAS AN OWNER
-- ============================================================

create or replace function public.check_org_has_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_organization_id uuid;
    v_owner_count integer;
begin
    v_organization_id := coalesce(new.organization_id, old.organization_id);

    -- During organization deletion, the organization itself may
    -- already be gone because of cascading deletes.
    if not exists (
        select 1
        from public.organizations o
        where o.id = v_organization_id
    ) then
        return null;
    end if;

    select count(*)
    into v_owner_count
    from public.organization_members om
    where om.organization_id = v_organization_id
      and om.role = 'owner';

    if v_owner_count = 0 then
        raise exception
            'Organization must have at least one owner';
    end if;

    return null;
end;
$$;

-- ============================================================
-- USER ORGANIZATIONS
-- ============================================================

create or replace function public.get_user_organizations()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
    select om.organization_id
    from public.organization_members om
    where om.user_id = (select auth.uid());
$$;

-- ============================================================
-- CHECK ORGANIZATION MEMBERSHIP
-- ============================================================

create or replace function public.is_org_member(
    p_organization_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
    select exists (
        select 1
        from public.organization_members om
        where om.organization_id = p_organization_id
          and om.user_id = (select auth.uid())
    );
$$;

-- ============================================================
-- GET USER ROLE
-- ============================================================

create or replace function public.get_user_role(
    p_organization_id uuid
)
returns text
language sql
security definer
stable
set search_path = ''
as $$
    select om.role
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = (select auth.uid())
    limit 1;
$$;

-- ============================================================
-- CHECK LEAD ACCESS
-- ============================================================

create or replace function public.can_access_lead(
    p_lead_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
    select exists (
        select 1
        from public.leads l
        join public.organization_members om
          on om.organization_id = l.organization_id
         and om.user_id = (select auth.uid())
        where l.id = p_lead_id
          and (
              om.role in ('owner', 'admin', 'manager')
              or l.responsible_id = (select auth.uid())
          )
    );
$$;

-- ============================================================
-- FUNCTION EXECUTION PRIVILEGES
-- ============================================================

revoke execute on function public.get_user_organizations()
    from public, anon, authenticated;

revoke execute on function public.is_org_member(uuid)
    from public, anon, authenticated;

revoke execute on function public.get_user_role(uuid)
    from public, anon, authenticated;

revoke execute on function public.can_access_lead(uuid)
    from public, anon, authenticated;

grant execute on function public.get_user_organizations()
    to authenticated;

grant execute on function public.is_org_member(uuid)
    to authenticated;

grant execute on function public.get_user_role(uuid)
    to authenticated;

grant execute on function public.can_access_lead(uuid)
    to authenticated;

revoke execute on function public.set_updated_at()
    from public, anon, authenticated;

revoke execute on function public.validate_organization_timezone()
    from public, anon, authenticated;

revoke execute on function public.handle_new_user()
    from public, anon, authenticated;

revoke execute on function public.normalize_invitation_email()
    from public, anon, authenticated;

revoke execute on function public.validate_lead_responsible()
    from public, anon, authenticated;

revoke execute on function public.validate_follow_up_responsible()
    from public, anon, authenticated;

revoke execute on function public.prevent_direct_ownership_change()
    from public, anon, authenticated;

revoke execute on function public.prevent_member_user_change()
    from public, anon, authenticated;

revoke execute on function public.check_org_has_owner()
    from public, anon, authenticated;-- ============================================================
-- PREVENT ORGANIZATION CHANGE
-- ============================================================

create or replace function public.prevent_organization_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.organization_id is distinct from old.organization_id then
        raise exception
            'organization_id cannot be changed';
    end if;

    return new;
end;
$$;

-- ============================================================
-- FORCE ACTIVITY ACTOR
-- ============================================================

create or replace function public.force_activity_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if (select auth.uid()) is not null then
        new.created_by = (select auth.uid());
    end if;

    return new;
end;
$$;

-- ============================================================
-- AUDIT LOG ORGANIZATION IMMUTABILITY
-- ============================================================

create or replace function public.prevent_audit_organization_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.organization_id is distinct from old.organization_id then
        raise exception
            'audit_logs.organization_id cannot be changed';
    end if;

    return new;
end;
$$;

-- ============================================================
-- PROTECT SOFT DELETE FROM MEMBERS
-- ============================================================

create or replace function public.prevent_member_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_role text;
begin
    if new.deleted_at is not distinct from old.deleted_at then
        return new;
    end if;

    v_role := public.get_user_role(old.organization_id);

    if v_role = 'member' then
        raise exception
            'Members cannot delete records';
    end if;

    return new;
end;
$$;

-- ============================================================
-- INTERNAL TRIGGER FUNCTIONS
-- ============================================================

revoke execute on function public.prevent_organization_change()
    from public, anon, authenticated;

revoke execute on function public.force_activity_actor()
    from public, anon, authenticated;

revoke execute on function public.prevent_audit_organization_change()
    from public, anon, authenticated;

revoke execute on function public.prevent_member_soft_delete()
    from public, anon, authenticated;