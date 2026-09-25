-- ============================================================
-- 005_rpc.sql
-- RPCs protegidas para operações críticas do NORTH CRM
-- ============================================================

-- ------------------------------------------------------------
-- 1. CRIAR ORGANIZAÇÃO
-- ------------------------------------------------------------

create or replace function public.create_organization(
    p_name text,
    p_slug text,
    p_timezone text default 'America/Sao_Paulo'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_org_id uuid;
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    if p_name is null or length(trim(p_name)) = 0 then
        raise exception 'Nome da organização é obrigatório';
    end if;

    if p_slug is null or length(trim(p_slug)) = 0 then
        raise exception 'Slug da organização é obrigatório';
    end if;

    insert into public.organizations (
        name,
        slug,
        timezone
    )
    values (
        trim(p_name),
        lower(trim(p_slug)),
        coalesce(p_timezone, 'America/Sao_Paulo')
    )
    returning id into v_org_id;

    insert into public.organization_members (
        organization_id,
        user_id,
        role
    )
    values (
        v_org_id,
        v_user_id,
        'owner'
    );

    return v_org_id;
end;
$$;


-- ------------------------------------------------------------
-- 2. TRANSFERIR PROPRIEDADE DA ORGANIZAÇÃO
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

    -- trava a organização para evitar duas transferências simultâneas
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

    if not exists (
        select 1
        from public.organization_members
        where organization_id = p_organization_id
          and user_id = p_new_owner_id
    ) then
        raise exception 'O novo proprietário precisa ser membro da organização';
    end if;

    if p_new_owner_id = v_user_id then
        raise exception 'O novo proprietário já é o proprietário atual';
    end if;

    update public.organization_members
    set role = 'admin'
    where organization_id = p_organization_id
      and user_id = v_user_id;

    update public.organization_members
    set role = 'owner'
    where organization_id = p_organization_id
      and user_id = p_new_owner_id;
end;
$$;


-- ------------------------------------------------------------
-- 3. ADICIONAR MEMBRO À ORGANIZAÇÃO
-- ------------------------------------------------------------

create or replace function public.add_organization_member(
    p_organization_id uuid,
    p_user_id uuid,
    p_role text default 'member'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_member_id uuid;
    v_actor_id uuid := auth.uid();
    v_actor_role text;
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
        raise exception 'Sem permissão para adicionar membros';
    end if;

    if p_role not in ('admin', 'manager', 'member') then
        raise exception 'Cargo inválido';
    end if;

    if not exists (
        select 1
        from public.profiles
        where id = p_user_id
    ) then
        raise exception 'Usuário não encontrado';
    end if;

    insert into public.organization_members (
        organization_id,
        user_id,
        role
    )
    values (
        p_organization_id,
        p_user_id,
        p_role
    )
    returning id into v_member_id;

    return v_member_id;
end;
$$;


-- ------------------------------------------------------------
-- 4. REMOVER MEMBRO DA ORGANIZAÇÃO
-- ------------------------------------------------------------

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
      and user_id = p_user_id;

    if v_target_role is null then
        raise exception 'Membro não encontrado';
    end if;

    if v_target_role = 'owner' then
        raise exception 'O proprietário não pode ser removido';
    end if;

    if v_actor_role = 'admin' and v_target_role = 'admin' then
        raise exception 'Um administrador não pode remover outro administrador';
    end if;

    delete from public.organization_members
    where organization_id = p_organization_id
      and user_id = p_user_id;
end;
$$;


-- ------------------------------------------------------------
-- 5. ALTERAR CARGO DE MEMBRO
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

    update public.organization_members
    set role = p_new_role
    where organization_id = p_organization_id
      and user_id = p_user_id;
end;
$$;


-- ------------------------------------------------------------
-- 6. CRIAR CONVITE
-- ------------------------------------------------------------

create or replace function public.create_invitation(
    p_organization_id uuid,
    p_email text,
    p_role text,
    p_token text,
    p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_invitation_id uuid;
    v_actor_id uuid := auth.uid();
    v_actor_role text;
    v_email text;
    v_token_hash text;
begin
    if v_actor_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    v_email := lower(trim(p_email));

    if p_role not in ('admin', 'manager', 'member') then
        raise exception 'Cargo de convite inválido';
    end if;

    if p_expires_at <= now() then
        raise exception 'Data de expiração inválida';
    end if;

    if p_token is null or length(p_token) < 32 then
        raise exception 'Token inválido';
    end if;

    select role
    into v_actor_role
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = v_actor_id;

    if v_actor_role not in ('owner', 'admin') then
        raise exception 'Sem permissão para convidar membros';
    end if;

    v_token_hash :=
        encode(
            extensions.digest(
                convert_to(p_token, 'UTF8'),
                'sha256'
            ),
            'hex'
        );

    insert into public.invitations (
        organization_id,
        email,
        role,
        invited_by,
        token_hash,
        expires_at
    )
    values (
        p_organization_id,
        v_email,
        p_role,
        v_actor_id,
        v_token_hash,
        p_expires_at
    )
    returning id into v_invitation_id;

    return v_invitation_id;
end;
$$;


-- ------------------------------------------------------------
-- 7. ACEITAR CONVITE
-- ------------------------------------------------------------

create or replace function public.accept_invitation(
    p_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_token_hash text;
    v_invitation public.invitations%rowtype;
    v_member_id uuid;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    if p_token is null or length(p_token) < 32 then
        raise exception 'Token inválido';
    end if;

    v_token_hash :=
        encode(
            extensions.digest(
                convert_to(p_token, 'UTF8'),
                'sha256'
            ),
            'hex'
        );

    select *
    into v_invitation
    from public.invitations
    where token_hash = v_token_hash
      and accepted_at is null
      and expires_at > now()
    for update;

    if not found then
        raise exception 'Convite inválido, expirado ou já utilizado';
    end if;

    if lower(v_invitation.email) <> lower(
        coalesce(
            (
                select email
                from auth.users
                where id = v_user_id
            ),
            ''
        )
    ) then
        raise exception 'O email do usuário não corresponde ao convite';
    end if;

    insert into public.organization_members (
        organization_id,
        user_id,
        role
    )
    values (
        v_invitation.organization_id,
        v_user_id,
        v_invitation.role
    )
    returning id into v_member_id;

    update public.invitations
    set accepted_at = now()
    where id = v_invitation.id;

    return v_member_id;
end;
$$;


-- ------------------------------------------------------------
-- 8. MOVER LEAD DE ETAPA
-- ------------------------------------------------------------

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

    if v_to_stage_org is null or v_to_stage_org <> v_lead.organization_id then
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

    update public.leads
    set stage_id = p_to_stage_id
    where id = p_lead_id;
end;
$$;


-- ------------------------------------------------------------
-- 9. CONVERTER LEAD EM CLIENTE
-- ------------------------------------------------------------

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

    update public.leads
    set status = 'convertido'
    where id = p_lead_id;

    return v_client_id;
end;
$$;


-- ------------------------------------------------------------
-- 10. COMPLETAR FOLLOW-UP
-- ------------------------------------------------------------

create or replace function public.complete_follow_up(
    p_follow_up_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_follow_up public.follow_ups%rowtype;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    select *
    into v_follow_up
    from public.follow_ups
    where id = p_follow_up_id
    for update;

    if not found then
        raise exception 'Follow-up não encontrado';
    end if;

    if not public.can_access_lead(v_follow_up.lead_id) then
        raise exception 'Sem permissão para acessar este follow-up';
    end if;

    if v_follow_up.status <> 'pending' then
        raise exception 'Este follow-up não está pendente';
    end if;

    update public.follow_ups
    set
        status = 'completed',
        completed_at = now()
    where id = p_follow_up_id;
end;
$$;


-- ------------------------------------------------------------
-- 11. CANCELAR FOLLOW-UP
-- ------------------------------------------------------------

create or replace function public.cancel_follow_up(
    p_follow_up_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_follow_up public.follow_ups%rowtype;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    select *
    into v_follow_up
    from public.follow_ups
    where id = p_follow_up_id
    for update;

    if not found then
        raise exception 'Follow-up não encontrado';
    end if;

    if not public.can_access_lead(v_follow_up.lead_id) then
        raise exception 'Sem permissão para acessar este follow-up';
    end if;

    if v_follow_up.status <> 'pending' then
        raise exception 'Este follow-up não está pendente';
    end if;

    update public.follow_ups
    set
        status = 'canceled',
        completed_at = null
    where id = p_follow_up_id;
end;
$$;


-- ------------------------------------------------------------
-- 12. REAGENDAR FOLLOW-UP
-- ------------------------------------------------------------

create or replace function public.reschedule_follow_up(
    p_follow_up_id uuid,
    p_scheduled_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_follow_up public.follow_ups%rowtype;
begin
    if v_user_id is null then
        raise exception 'Usuário não autenticado';
    end if;

    if p_scheduled_at is null then
        raise exception 'Nova data é obrigatória';
    end if;

    select *
    into v_follow_up
    from public.follow_ups
    where id = p_follow_up_id
    for update;

    if not found then
        raise exception 'Follow-up não encontrado';
    end if;

    if not public.can_access_lead(v_follow_up.lead_id) then
        raise exception 'Sem permissão para acessar este follow-up';
    end if;

    if v_follow_up.status <> 'pending' then
        raise exception 'Apenas follow-ups pendentes podem ser reagendados';
    end if;

    update public.follow_ups
    set scheduled_at = p_scheduled_at
    where id = p_follow_up_id;
end;
$$;


-- ------------------------------------------------------------
-- 13. EXECUTE — BLOQUEAR ACESSO PÚBLICO
-- ------------------------------------------------------------

revoke execute on function public.create_organization(text, text, text)
from public, anon, authenticated;

revoke execute on function public.transfer_organization_ownership(uuid, uuid)
from public, anon, authenticated;

revoke execute on function public.add_organization_member(uuid, uuid, text)
from public, anon, authenticated;

revoke execute on function public.remove_organization_member(uuid, uuid)
from public, anon, authenticated;

revoke execute on function public.change_member_role(uuid, uuid, text)
from public, anon, authenticated;

revoke execute on function public.create_invitation(uuid, text, text, text, timestamptz)
from public, anon, authenticated;

revoke execute on function public.accept_invitation(text)
from public, anon, authenticated;

revoke execute on function public.move_lead_stage(uuid, uuid)
from public, anon, authenticated;

revoke execute on function public.convert_lead_to_client(uuid)
from public, anon, authenticated;

revoke execute on function public.complete_follow_up(uuid)
from public, anon, authenticated;

revoke execute on function public.cancel_follow_up(uuid)
from public, anon, authenticated;

revoke execute on function public.reschedule_follow_up(uuid, timestamptz)
from public, anon, authenticated;


-- ------------------------------------------------------------
-- 14. EXECUTE — USUÁRIO AUTENTICADO
-- ------------------------------------------------------------

grant execute on function public.create_organization(text, text, text)
to authenticated;

grant execute on function public.transfer_organization_ownership(uuid, uuid)
to authenticated;

grant execute on function public.add_organization_member(uuid, uuid, text)
to authenticated;

grant execute on function public.remove_organization_member(uuid, uuid)
to authenticated;

grant execute on function public.change_member_role(uuid, uuid, text)
to authenticated;

grant execute on function public.create_invitation(uuid, text, text, text, timestamptz)
to authenticated;

grant execute on function public.accept_invitation(text)
to authenticated;

grant execute on function public.move_lead_stage(uuid, uuid)
to authenticated;

grant execute on function public.convert_lead_to_client(uuid)
to authenticated;

grant execute on function public.complete_follow_up(uuid)
to authenticated;

grant execute on function public.cancel_follow_up(uuid)
to authenticated;

grant execute on function public.reschedule_follow_up(uuid, timestamptz)
to authenticated;