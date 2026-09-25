import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function UpcomingFollowUps() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white">
        <div className="px-6 py-10">
          <p className="text-sm text-gray-400">
            Usuário não autenticado.
          </p>
        </div>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return (
      <div className="bg-white">
        <div className="px-6 py-10">
          <p className="text-sm text-gray-400">
            Organização não encontrada.
          </p>
        </div>
      </div>
    )
  }

  const { data: followUps, error } = await supabase
    .from('follow_ups')
    .select(`
      id,
      scheduled_at,
      type,
      note,
      status,
      leads (
        id,
        name
      )
    `)
    .eq('organization_id', membership.organization_id)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error(
      'Erro ao carregar próximos follow-ups:',
      error
    )

    return (
      <div className="bg-white">
        <div className="px-6 py-10">
          <p className="text-sm text-gray-400">
            Não foi possível carregar os follow-ups.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="flex items-end justify-between px-6 pb-5 pt-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Agenda
          </p>

          <h3 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
            Próximos follow-ups
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            Próximos contatos da operação comercial.
          </p>
        </div>

        <Link
          href="/follow-ups"
          className="text-xs font-medium text-gray-400 transition hover:text-black"
        >
          Ver todos →
        </Link>
      </div>

      <div className="border-t border-gray-100">
        {!followUps || followUps.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-gray-400">
              Nenhum follow-up pendente.
            </p>

            <Link
              href="/follow-ups"
              className="mt-3 text-xs font-semibold text-gray-700 transition hover:text-black"
            >
              Criar follow-up →
            </Link>
          </div>
        ) : (
          <div>
            {followUps.map((followUp, index) => {
              const lead = Array.isArray(followUp.leads)
                ? followUp.leads[0]
                : followUp.leads

              const scheduledDate = new Date(
                followUp.scheduled_at
              )

              const formattedDate =
                scheduledDate.toLocaleDateString(
                  'pt-BR',
                  {
                    day: '2-digit',
                    month: 'short',
                  }
                )

              const formattedTime =
                scheduledDate.toLocaleTimeString(
                  'pt-BR',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )

              return (
                <div
                  key={followUp.id}
                  className={`group flex items-center justify-between gap-5 px-6 py-4 transition hover:bg-gray-50 ${
                    index !== followUps.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 transition group-hover:bg-black group-hover:text-white">
                      {lead?.name
                        ?.charAt(0)
                        .toUpperCase() || 'L'}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {lead?.name ?? 'Lead'}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-400">
                        {followUp.type || 'Contato'}
                        {followUp.note
                          ? ` · ${followUp.note}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-700">
                      {formattedDate}
                    </p>

                    <p className="mt-1 text-[11px] text-gray-400">
                      {formattedTime}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}