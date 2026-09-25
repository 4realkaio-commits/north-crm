import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewFollowUpForm from './NewFollowUpForm'
import DeleteFollowUpButton from './DeleteFollowUpButton'
import UpdateFollowUpButton from './UpdateFollowUpButton'

type FollowUp = {
  id: string
  lead_id: string
  scheduled_at: string
  status: 'pending' | 'completed' | 'canceled'
  note: string | null
}

type Lead = {
  id: string
  name: string
}

export default async function FollowUpsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: followUps, error } = await supabase
    .from('follow_ups')
    .select(`
      id,
      lead_id,
      scheduled_at,
      status,
      note
    `)
    .order('scheduled_at', { ascending: true })

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar os follow-ups
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  const { data: leadsData, error: leadsError } =
    await supabase
      .from('leads')
      .select('id, name')
      .is('deleted_at', null)
      .order('name', { ascending: true })

  if (leadsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar os leads
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(leadsError, null, 2)}
        </pre>
      </div>
    )
  }

  const leads = (leadsData ?? []) as Lead[]
  const safeFollowUps = (followUps ?? []) as FollowUp[]

  const leadMap = new Map(
    leads.map((lead) => [lead.id, lead])
  )

  const now = new Date()

  const isOverdue = (followUp: FollowUp) => {
    return (
      followUp.status === 'pending' &&
      new Date(followUp.scheduled_at) < now
    )
  }

  const pendingCount = safeFollowUps.filter(
    (followUp) => followUp.status === 'pending'
  ).length

  const overdueCount = safeFollowUps.filter(
    (followUp) => isOverdue(followUp)
  ).length

  const completedCount = safeFollowUps.filter(
    (followUp) => followUp.status === 'completed'
  ).length

  const canceledCount = safeFollowUps.filter(
    (followUp) => followUp.status === 'canceled'
  ).length

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
              Follow-ups
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Acompanhe os próximos contatos e tarefas comerciais.
            </p>
          </div>

          <Link
            href="/leads"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Ver leads
          </Link>
        </div>
      </header>

      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Indicadores
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Pendentes
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {pendingCount}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Contatos aguardando ação
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Atrasados
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {overdueCount}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Contatos que passaram do prazo
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Concluídos
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {completedCount}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Contatos realizados
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Cancelados
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {canceledCount}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Contatos cancelados
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Novo follow-up
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7">
          <NewFollowUpForm leads={leads} />
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Agenda
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="shrink-0 text-xs text-gray-400">
            {safeFollowUps.length}{' '}
            {safeFollowUps.length === 1
              ? 'follow-up'
              : 'follow-ups'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {safeFollowUps.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center px-10">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                  N
                </div>

                <p className="text-sm font-medium text-gray-700">
                  Nenhum follow-up cadastrado.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Crie o primeiro follow-up acima.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Lead
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Data
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Observação
                    </th>

                    <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {safeFollowUps.map((followUp) => {
                    const lead = leadMap.get(
                      followUp.lead_id
                    )

                    const overdue = isOverdue(
                      followUp
                    )

                    return (
                      <tr
                        key={followUp.id}
                        className={`group border-b border-gray-100 last:border-0 transition ${
                          overdue
                            ? 'bg-gray-50'
                            : 'hover:bg-gray-50/70'
                        }`}
                      >
                        <td className="px-6 py-5">
                          {lead ? (
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-sm font-medium text-gray-900 transition hover:text-black hover:underline"
                            >
                              {lead.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Lead não encontrado
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <p
                            className={`text-sm ${
                              overdue
                                ? 'font-medium text-gray-950'
                                : 'text-gray-700'
                            }`}
                          >
                            {new Date(
                              followUp.scheduled_at
                            ).toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(
                              followUp.scheduled_at
                            ).toLocaleTimeString(
                              'pt-BR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          {overdue ? (
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-900">
                              <span className="h-1.5 w-1.5 rounded-full bg-black" />

                              Atrasado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  followUp.status ===
                                  'pending'
                                    ? 'bg-black'
                                    : followUp.status ===
                                        'completed'
                                      ? 'bg-gray-500'
                                      : 'bg-gray-300'
                                }`}
                              />

                              {followUp.status ===
                              'pending'
                                ? 'Pendente'
                                : followUp.status ===
                                    'completed'
                                  ? 'Concluído'
                                  : 'Cancelado'}
                            </span>
                          )}
                        </td>

                        <td className="max-w-[420px] px-6 py-5">
                          <p className="truncate text-sm text-gray-500">
                            {followUp.note || '—'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {followUp.status ===
                              'pending' && (
                              <UpdateFollowUpButton
                                followUpId={
                                  followUp.id
                                }
                              />
                            )}

                            <DeleteFollowUpButton
                              followUpId={
                                followUp.id
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}