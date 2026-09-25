import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrganizationForm from './OrganizationForm'
import LogoForm from './LogoForm'
import ProfileForm from './ProfileForm'
import AvatarForm from './AvatarForm'
import PasswordForm from './PasswordForm'
import MFAForm from './MFAForm'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
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

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar perfil
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {profileError.message}
        </p>
      </div>
    )
  }

  const {
    data: organization,
    error: organizationError,
  } = await supabase
    .from('organizations')
    .select(
      'id, name, slug, timezone, logo_url, phone, email, plan'
    )
    .eq('id', membership.organization_id)
    .single()

  if (organizationError || !organization) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar organização
        </h1>

        <p className="mt-2 text-sm text-red-600">
          {organizationError?.message ||
            'Não foi possível carregar os dados da organização.'}
        </p>
      </div>
    )
  }

  const canEditOrganization =
    membership.role === 'owner' ||
    membership.role === 'admin'

  let logoUrl: string | null = null

  if (organization.logo_url) {
    const { data: signedUrlData } =
      await supabase.storage
        .from('organization-assets')
        .createSignedUrl(
          organization.logo_url,
          60 * 60
        )

    logoUrl =
      signedUrlData?.signedUrl || null
  }

  const roleLabel =
    membership.role === 'owner'
      ? 'Proprietário'
      : membership.role === 'admin'
        ? 'Administrador'
        : membership.role === 'manager'
          ? 'Gerente'
          : 'Membro'

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
              Configurações
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Gerencie sua conta, organização e segurança.
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Sistema
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              Preferências e acesso
            </p>
          </div>
        </div>
      </header>

      {/* PERFIL */}
      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Perfil
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-5">
          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-7 py-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Identidade
                  </p>

                  <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
                    Meu avatar
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Escolha a imagem que será usada no seu perfil.
                  </p>
                </div>

                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-gray-200" />
              </div>
            </div>

            <div className="flex flex-col gap-7 p-7 sm:flex-row sm:items-center">
              <div className="shrink-0">
                {profile?.avatar_url ? (
                  <AvatarPreview
                    supabase={supabase}
                    avatarPath={profile.avatar_url}
                    fullName={profile.full_name || ''}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center border border-gray-200 bg-gray-50 text-3xl font-semibold text-gray-500">
                    {(profile?.full_name ||
                      user.email ||
                      '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <AvatarForm
                  userId={user.id}
                  currentAvatarPath={
                    profile?.avatar_url || ''
                  }
                />
              </div>
            </div>
          </section>

          <ProfileForm
            userId={user.id}
            initialFullName={
              profile?.full_name || ''
            }
            initialEmail={user.email || ''}
          />
        </div>
      </section>

      {/* SEGURANÇA */}
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Segurança
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-5">
          <PasswordForm />

          <MFAForm />
        </div>
      </section>

      {/* ORGANIZAÇÃO */}
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Organização
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-5">
          {canEditOrganization && (
            <section className="border border-gray-200 bg-white p-7">
              <div className="mb-7 flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Dados principais
                  </p>

                  <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
                    Informações da organização
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Atualize os dados principais utilizados pelo CRM.
                  </p>
                </div>

                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-gray-200" />
              </div>

              <OrganizationForm
                organizationId={organization.id}
                initialName={organization.name}
                initialEmail={
                  organization.email || ''
                }
                initialPhone={
                  organization.phone || ''
                }
                initialTimezone={
                  organization.timezone
                }
              />
            </section>
          )}

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-7 py-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Identidade visual
                  </p>

                  <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
                    Logo da organização
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Essa logo poderá ser utilizada na identidade do CRM.
                  </p>
                </div>

                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-gray-200" />
              </div>
            </div>

            <div className="flex flex-col gap-7 p-7 sm:flex-row sm:items-center">
              <div className="shrink-0">
                {logoUrl ? (
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={logoUrl}
                      alt={`Logo da ${organization.name}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center border border-gray-200 bg-gray-50 text-3xl font-semibold text-gray-500">
                    {organization.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              {canEditOrganization && (
                <div className="min-w-0">
                  <LogoForm
                    organizationId={
                      organization.id
                    }
                    currentLogoPath={
                      organization.logo_url || ''
                    }
                  />
                </div>
              )}
            </div>
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-7 py-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Dados
                  </p>

                  <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
                    Visão da organização
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Informações atuais da sua organização.
                  </p>
                </div>

                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-gray-200" />
              </div>
            </div>

            <div className="grid border-l border-t border-gray-100 sm:grid-cols-2">
              <div className="border-b border-r border-gray-100 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Nome
                </p>

                <p className="mt-3 text-sm font-medium text-gray-900">
                  {organization.name}
                </p>
              </div>

              <div className="border-b border-r border-gray-100 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Identificador
                </p>

                <p className="mt-3 break-all font-mono text-sm text-gray-700">
                  {organization.slug}
                </p>
              </div>

              <div className="border-b border-r border-gray-100 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  E-mail
                </p>

                <p className="mt-3 break-all text-sm font-medium text-gray-900">
                  {organization.email ||
                    'Não informado'}
                </p>
              </div>

              <div className="border-b border-r border-gray-100 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Telefone
                </p>

                <p className="mt-3 text-sm font-medium text-gray-900">
                  {organization.phone ||
                    'Não informado'}
                </p>
              </div>

              <div className="border-b border-r border-gray-100 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Fuso horário
                </p>

                <p className="mt-3 text-sm font-medium text-gray-900">
                  {organization.timezone}
                </p>
              </div>

              <div className="border-b border-r border-gray-100 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Plano
                </p>

                <p className="mt-3 text-sm font-medium capitalize text-gray-900">
                  {organization.plan}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* ACESSO */}
      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Acesso
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <section className="border border-gray-200 bg-white p-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Permissões
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
                Seu acesso
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Função do usuário dentro da organização.
              </p>
            </div>

            <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-gray-200" />
          </div>

          <div className="mt-8 grid border-l border-t border-gray-100 sm:grid-cols-2">
            <div className="border-b border-r border-gray-100 p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Nível atual
              </p>

              <p className="mt-3 text-sm font-medium text-gray-900">
                {roleLabel}
              </p>
            </div>

            <div className="border-b border-r border-gray-100 p-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Status
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                <span className="h-1.5 w-1.5 bg-black" />
                Ativo
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}

async function AvatarPreview({
  supabase,
  avatarPath,
  fullName,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  avatarPath: string
  fullName: string
}) {
  const { data } = await supabase.storage
    .from('user-avatars')
    .createSignedUrl(
      avatarPath,
      60 * 60
    )

  if (!data?.signedUrl) {
    return (
      <div className="flex h-24 w-24 items-center justify-center border border-gray-200 bg-gray-50 text-3xl font-semibold text-gray-500">
        {(fullName || '?')
          .charAt(0)
          .toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={data.signedUrl}
      alt={`Avatar de ${fullName || 'usuário'}`}
      className="h-24 w-24 border border-gray-200 object-cover"
    />
  )
}