-- ============================================================
-- 006_hardening.sql
-- Reforços finais de integridade e segurança
-- ============================================================

-- ------------------------------------------------------------
-- 1. ORGANIZATION MEMBERS: user_id não pode ser alterado
-- ------------------------------------------------------------

create or replace function public.prevent_member_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.user_id is distinct from old.user_id then
        raise exception 'O usuário de um membro não pode ser alterado';
    end if;

    return new;
end;
$$;

drop trigger if exists prevent_member_user_change on public.organization_members;

create trigger prevent_member_user_change
before update on public.organization_members
for each row
execute function public.prevent_member_user_change();


-- ------------------------------------------------------------
-- 2. ORGANIZATION MEMBERS: impedir mudança direta de role
--    para owner/admin fora das operações controladas
-- ------------------------------------------------------------

create or replace function public.prevent_direct_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.role is distinct from old.role
       and current_setting('north_crm.allow_role_change', true) is distinct from 'on' then
        raise exception 'Alteração de cargo deve ser feita pela operação autorizada';
    end if;

    return new;
end;
$$;

revoke execute on function public.prevent_direct_role_change()
from public, anon, authenticated;

drop trigger if exists prevent_direct_role_change on public.organization_members;

create trigger prevent_direct_role_change
before update on public.organization_members
for each row
execute function public.prevent_direct_role_change();


-- ------------------------------------------------------------
-- 3. ORGANIZATION MEMBERS: impedir DELETE direto
-- ------------------------------------------------------------

create or replace function public.prevent_direct_member_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if current_setting('north_crm.allow_member_delete', true) is distinct from 'on' then
        raise exception 'Remoção de membro deve ser feita pela operação autorizada';
    end if;

    return old;
end;
$$;

revoke execute on function public.prevent_direct_member_delete()
from public, anon, authenticated;

drop trigger if exists prevent_direct_member_delete on public.organization_members;

create trigger prevent_direct_member_delete
before delete on public.organization_members
for each row
execute function public.prevent_direct_member_delete();


-- ------------------------------------------------------------
-- 4. RPCs de membro podem alterar role/remover membro
-- ------------------------------------------------------------

create or replace function public.change_member_role(
    p_organization_id uuid,
    p_user_id uuid,
    p_new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor_id uuid := auth.uid();
    v_actor_role text;
    v_target_role text;
begin
    if v_actor_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    if p_new_role not in ('admin', 'manager', 'member') then
        raise exception 'Cargo inválido';
    end if;

    select role
    into v_actor_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = v_actor_id;

    if v_actor_role not in ('owner', 'admin') then
        raise exception 'Sem permissão para alterar cargos';
    end if;

    select role
    into v_target_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id
    for update;

    if v_target_role is null then
        raise exception 'Membro não encontrado';
    end if;

    if v_target_role = 'owner' then
        raise exception 'O cargo do proprietário deve ser alterado pela transferência de propriedade';
    end if;

    if v_actor_role = 'admin'
       and v_target_role = 'admin'
       and p_new_role <> 'admin' then
        raise exception 'Um administrador não pode alterar outro administrador';
    end if;

    perform set_config('north_crm.allow_role_change', 'on', true);

    update public.organization_members
    set role = p_new_role
    where organization_id = p_organization_id
      and user_id = p_user_id;

    perform set_config('north_crm.allow_role_change', 'off', true);
end;
$$;


create or replace function public.remove_organization_member(
    p_organization_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor_id uuid := auth.uid();
    v_actor_role text;
    v_target_role text;
begin
    if v_actor_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    select role
    into v_actor_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = v_actor_id;

    if v_actor_role not in ('owner', 'admin') then
        raise exception 'Sem permissão para remover membros';
    end if;

    select role
    into v_target_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id
    for update;

    if v_target_role is null then
        raise exception 'Membro não encontrado';
    end if;

    if v_target_role = 'owner' then
        raise exception 'O proprietário não pode ser removido';
    end if;

    if v_actor_role = 'admin' and v_target_role = 'admin' then
        raise exception 'Um administrador não pode remover outro administrador';
    end if;

    perform set_config('north_crm.allow_member_delete', 'on', true);

    delete from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id;

    perform set_config('north_crm.allow_member_delete', 'off', true);
end;
$$;


-- ------------------------------------------------------------
-- 5. TRANSFERÊNCIA DE PROPRIEDADE
-- ------------------------------------------------------------

create or replace function public.transfer_organization_ownership(
    p_organization_id uuid,
    p_new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_current_role text;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended(p_organization_id::text, 0)
    );

    select role
    into v_current_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = v_user_id
    for update;

    if v_current_role <> 'owner' then
        raise exception 'Apenas o proprietário pode transferir a propriedade';
    end if;

    if p_new_owner_id = v_user_id then
        raise exception 'O novo proprietário já é o proprietário atual';
    end if;

    if not exists (
        select 1
        from public.organization_members
        where organization_id = p_organization_id
          and user_id = p_new_owner_id
    ) then
        raise exception 'O novo proprietário precisa ser membro da organização';
    end if;

    perform set_config('north_crm.allow_role_change', 'on', true);

    update public.organization_members
    set role = 'admin'
    where organization_id = p_organization_id
      and user_id = v_user_id;

    update public.organization_members
    set role = 'owner'
    where organization_id = p_organization_id
      and user_id = p_new_owner_id;

    perform set_config('north_crm.allow_role_change', 'off', true);
end;
$$;


-- ------------------------------------------------------------
-- 6. MOVER LEAD DE ETAPA — impedir alteração direta
-- ------------------------------------------------------------

create or replace function public.prevent_direct_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.stage_id is distinct from old.stage_id
       and current_setting('north_crm.allow_stage_change', true) is distinct from 'on' then
        raise exception 'Mudança de etapa deve ser feita pela operação autorizada';
    end if;

    return new;
end;
$$;

revoke execute on function public.prevent_direct_stage_change()
from public, anon, authenticated;

drop trigger if exists prevent_direct_stage_change on public.leads;

create trigger prevent_direct_stage_change
before update on public.leads
for each row
execute function public.prevent_direct_stage_change();


create or replace function public.move_lead_stage(
    p_lead_id uuid,
    p_to_stage_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_lead public.leads%rowtype;
    v_to_stage_org uuid;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    select *
    into v_lead
    from public.leads
    where id = p_lead_id
    for update;

    if not found then
        raise exception 'Lead não encontrado';
    end if;

    if not public.can_access_lead(p_lead_id) then
        raise exception 'Sem permissão para acessar este lead';
    end if;

    select organization_id
    into v_to_stage_org
    from public.pipeline_stages
    where id = p_to_stage_id;

    if v_to_stage_org is null
       or v_to_stage_org <> v_lead.organization_id then
        raise exception 'Etapa inválida para esta organização';
    end if;

    if v_lead.stage_id = p_to_stage_id then
        return;
    end if;

    insert into public.lead_stage_history (
        organization_id,
        lead_id,
        from_stage_id,
        to_stage_id,
        changed_by
    )
    values (
        v_lead.organization_id,
        p_lead_id,
        v_lead.stage_id,
        p_to_stage_id,
        v_user_id
    );

    perform set_config('north_crm.allow_stage_change', 'on', true);

    update public.leads
    set stage_id = p_to_stage_id
    where id = p_lead_id;

    perform set_config('north_crm.allow_stage_change', 'off', true);
end;
$$;


-- ------------------------------------------------------------
-- 7. IMPEDIR CONVERSÃO DIRETA DE LEAD
-- ------------------------------------------------------------

create or replace function public.prevent_direct_conversion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.status is distinct from old.status
       and (
            new.status = 'convertido'
            or old.status = 'convertido'
       )
       and current_setting('north_crm.allow_conversion', true) is distinct from 'on' then
        raise exception 'Conversão deve ser feita pela operação autorizada';
    end if;

    return new;
end;
$$;

revoke execute on function public.prevent_direct_conversion()
from public, anon, authenticated;

drop trigger if exists prevent_direct_conversion on public.leads;

create trigger prevent_direct_conversion
before update on public.leads
for each row
execute function public.prevent_direct_conversion();


create or replace function public.convert_lead_to_client(
    p_lead_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_lead public.leads%rowtype;
    v_client_id uuid;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    select *
    into v_lead
    from public.leads
    where id = p_lead_id
    for update;

    if not found then
        raise exception 'Lead não encontrado';
    end if;

    if not public.can_access_lead(p_lead_id) then
        raise exception 'Sem permissão para converter este lead';
    end if;

    if exists (
        select 1
        from public.clients
        where organization_id = v_lead.organization_id
          and lead_id = p_lead_id
          and deleted_at is null
    ) then
        raise exception 'Este lead já foi convertido';
    end if;

    insert into public.clients (
        organization_id,
        lead_id,
        name,
        phone,
        email,
        converted_at
    )
    values (
        v_lead.organization_id,
        v_lead.id,
        v_lead.name,
        v_lead.phone,
        v_lead.email,
        now()
    )
    returning id into v_client_id;

    perform set_config('north_crm.allow_conversion', 'on', true);

    update public.leads
    set status = 'convertido'
    where id = p_lead_id;

    perform set_config('north_crm.allow_conversion', 'off', true);

    return v_client_id;
end;
$$;


-- ------------------------------------------------------------
-- 8. CLIENTES: impedir criação manual ligada a lead
-- ------------------------------------------------------------

create or replace function public.prevent_direct_client_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.lead_id is not null
       and current_setting('north_crm.allow_conversion', true) is distinct from 'on' then
        raise exception 'Clientes ligados a leads devem ser criados pela conversão autorizada';
    end if;

    return new;
end;
$$;

revoke execute on function public.prevent_direct_client_insert()
from public, anon, authenticated;

drop trigger if exists prevent_direct_client_insert on public.clients;

create trigger prevent_direct_client_insert
before insert on public.clients
for each row
execute function public.prevent_direct_client_insert();


-- ------------------------------------------------------------
-- 9. ORGANIZAÇÃO: plan não pode ser alterado diretamente
-- ------------------------------------------------------------

create or replace function public.prevent_direct_plan_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.plan is distinct from old.plan
       and current_setting('north_crm.allow_plan_change', true) is distinct from 'on' then
        raise exception 'O plano da organização não pode ser alterado diretamente';
    end if;

    return new;
end;
$$;

revoke execute on function public.prevent_direct_plan_change()
from public, anon, authenticated;

drop trigger if exists prevent_direct_plan_change on public.organizations;

create trigger prevent_direct_plan_change
before update on public.organizations
for each row
execute function public.prevent_direct_plan_change();


-- ------------------------------------------------------------
-- 10. EXECUTE — REFORÇAR PERMISSÕES
-- ------------------------------------------------------------

revoke execute on function public.prevent_member_user_change()
from public, anon, authenticated;

revoke execute on function public.prevent_direct_role_change()
from public, anon, authenticated;

revoke execute on function public.prevent_direct_member_delete()
from public, anon, authenticated;

revoke execute on function public.prevent_direct_stage_change()
from public, anon, authenticated;

revoke execute on function public.prevent_direct_conversion()
from public, anon, authenticated;

revoke execute on function public.prevent_direct_client_insert()
from public, anon, authenticated;

revoke execute on function public.prevent_direct_plan_change()
from public, anon, authenticated;