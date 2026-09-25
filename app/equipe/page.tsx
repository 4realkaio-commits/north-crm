import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InviteMemberForm from './InviteMemberForm'
import RemoveMemberButton from './RemoveMemberButton'
import ChangeRoleButton from './ChangeRoleButton'

export default async function EquipePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError || !membership) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Organização não encontrada
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Não foi possível identificar a organização do usuário.
        </p>
      </div>
    )
  }

  const { data: members, error: membersError } =
    await supabase
      .from('organization_members')
      .select('user_id, role, created_at')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: true })

  if (membersError) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar equipe
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {membersError.message}
        </p>
      </div>
    )
  }

  const userIds =
    members?.map((member) => member.user_id) ?? []

  let profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }[] = []

  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    profiles = profileData ?? []
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  )

  const roleLabels: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    manager: 'Gerente',
    member: 'Membro',
  }

  const canManageMembers =
    membership.role === 'owner' ||
    membership.role === 'admin'

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-black" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                NORTH CRM
              </span>
            </div>

            <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
              Equipe
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Gerencie os membros e permissões da sua organização.
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Estrutura
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              Gestão de equipe
            </p>
          </div>
        </div>
      </header>

      {canManageMembers && (
        <section>
          <div className="mb-5 flex items-center gap-5">
            <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Novo membro
            </h2>

            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="border border-gray-200 bg-white p-7">
            <div className="mb-7 flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Convite
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
                  Adicionar membro
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Envie um convite para adicionar uma nova pessoa à organização.
                </p>
              </div>

              <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-gray-200" />
            </div>

            <div className="max-w-2xl">
              <InviteMemberForm />
            </div>
          </div>
        </section>
      )}

      <section className={canManageMembers ? 'mt-12' : ''}>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Visão geral
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-0 border-l border-t border-gray-200 md:grid-cols-2">
          <div className="border-b border-r border-gray-200 bg-white px-6 py-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Membros
            </p>

            <div className="mt-8">
              <p className="text-[40px] font-semibold leading-none tracking-[-0.05em] text-gray-950">
                {members?.length ?? 0}
              </p>

              <div className="mt-6 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Pessoas na organização
              </p>
            </div>
          </div>

          <div className="border-b border-r border-gray-200 bg-white px-6 py-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Seu acesso
            </p>

            <div className="mt-8">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-gray-950">
                {roleLabels[membership.role] ||
                  membership.role}
              </p>

              <div className="mt-6 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Seu nível de acesso atual
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Organização
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="shrink-0 text-xs text-gray-400">
            {members?.length ?? 0}{' '}
            {(members?.length ?? 0) === 1
              ? 'membro'
              : 'membros'}
          </span>
        </div>

        <div className="border-l border-t border-gray-200 bg-white">
          {members && members.length > 0 ? (
            <div>
              {members.map((member) => {
                const profile = profileMap.get(
                  member.user_id
                )

                const name =
                  profile?.full_name?.trim() ||
                  'Usuário'

                const role =
                  roleLabels[member.role] ||
                  member.role

                const isCurrentUser =
                  member.user_id === user.id

                const canChangeRole =
                  canManageMembers &&
                  !isCurrentUser &&
                  !(
                    membership.role === 'admin' &&
                    member.role === 'owner'
                  )

                const canRemove =
                  canManageMembers &&
                  !isCurrentUser &&
                  !(
                    membership.role === 'admin' &&
                    member.role === 'owner'
                  )

                return (
                  <div
                    key={member.user_id}
                    className="group flex flex-col gap-5 border-b border-gray-100 px-6 py-6 transition last:border-b-0 hover:bg-gray-50/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {profile?.avatar_url ? (
                        <div className="h-11 w-11 shrink-0 overflow-hidden border border-gray-200 bg-gray-100">
                          <img
                            src={profile.avatar_url}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 transition group-hover:border-black group-hover:bg-black group-hover:text-white">
                          {name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold tracking-[-0.02em] text-gray-950">
                            {name}
                          </p>

                          {isCurrentUser && (
                            <span className="border border-gray-200 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                              Você
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                          Membro da organização
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      {canChangeRole ? (
                        <ChangeRoleButton
                          organizationId={
                            membership.organization_id
                          }
                          userId={member.user_id}
                          currentRole={
                            member.role as
                              | 'member'
                              | 'manager'
                              | 'admin'
                          }
                          memberName={name}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                          <span className="h-1.5 w-1.5 bg-gray-300" />
                          {role}
                        </span>
                      )}

                      {canRemove && (
                        <RemoveMemberButton
                          organizationId={
                            membership.organization_id
                          }
                          userId={member.user_id}
                          memberName={name}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-56 items-center justify-center px-10">
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center border border-gray-200 text-[10px] font-semibold tracking-[0.16em] text-gray-400">
                  N
                </div>

                <p className="text-sm font-medium text-gray-700">
                  Nenhum membro encontrado.
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Adicione membros para começar a estruturar sua equipe.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}