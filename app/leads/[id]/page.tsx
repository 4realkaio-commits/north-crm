import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeleteLeadButton from './DeleteLeadButton'
import ConvertLeadButton from './ConvertLeadButton'

type LeadPageProps = {
  params: Promise<{
    id: string
  }>
}

type StageHistory = {
  id: string
  from_stage_id: string | null
  to_stage_id: string | null
  changed_at: string
  pipeline_stages:
    | {
        name: string
      }[]
    | null
}

type FollowUp = {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
  completed_at: string | null
}

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
}

function formatCurrency(value: number | null) {
  if (value === null) return 'Não informado'

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  )
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    novo: 'Novo',
    em_contato: 'Em contato',
    contato: 'Contato',
    qualificado: 'Qualificado',
    proposta: 'Proposta',
    negociacao: 'Negociação',
    negociação: 'Negociação',
    convertido: 'Convertido',
    perdido: 'Perdido',
    pending: 'Pendente',
    completed: 'Concluído',
    canceled: 'Cancelado',
    scheduled: 'Agendado',
    confirmado: 'Confirmado',
    compareceu: 'Compareceu',
    cancelado: 'Cancelado',
    nao_compareceu: 'Não compareceu',
  }

  return labels[status] ?? status
}

export default async function LeadPage({
  params,
}: LeadPageProps) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const {
    data: lead,
    error: leadError,
  } = await supabase
    .from('leads')
    .select(`
      id,
      name,
      company_name,
      instagram,
      city,
      segment,
      phone,
      email,
      status,
      potential_value,
      notes,
      created_at,
      updated_at,
      last_contact_at,
      next_follow_up_at
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (leadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar o lead
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(
            leadError,
            null,
            2
          )}
        </pre>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
        <h1 className="text-lg font-semibold text-yellow-700">
          Lead não encontrado
        </h1>

        <p className="mt-3 break-all font-mono text-sm text-yellow-700">
          {id}
        </p>
      </div>
    )
  }

  const [
    stageHistoryResult,
    followUpsResult,
    appointmentsResult,
  ] = await Promise.all([
    supabase
      .from('lead_stage_history')
      .select(`
        id,
        from_stage_id,
        to_stage_id,
        changed_at,
        pipeline_stages!lead_stage_history_to_stage_id_fkey (
          name
        )
      `)
      .eq('lead_id', lead.id)
      .order('changed_at', {
        ascending: false,
      }),

    supabase
      .from('follow_ups')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        completed_at
      `)
      .eq('lead_id', lead.id)
      .order('scheduled_at', {
        ascending: false,
      }),

    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        notes
      `)
      .eq('lead_id', lead.id)
      .is('deleted_at', null)
      .order('scheduled_at', {
        ascending: false,
      }),
  ])

  const stageHistory =
    (stageHistoryResult.data ?? []) as StageHistory[]

  const followUps =
    (followUpsResult.data ?? []) as FollowUp[]

  const appointments =
    (appointmentsResult.data ?? []) as Appointment[]

  const timeline = [
    {
      id: `created-${lead.id}`,
      date: lead.created_at,
      type: 'created',
      title: 'Lead criado',
      description:
        'O lead foi cadastrado no NORTH CRM.',
    },

    ...stageHistory.map(
      (history) => ({
        id: `stage-${history.id}`,
        date: history.changed_at,
        type: 'stage',
        title: `Etapa: ${
          history.pipeline_stages?.[0]?.name ??
          'Atualizada'
        }`,
        description:
          'O lead mudou de etapa no funil.',
      })
    ),

    ...followUps.map(
      (followUp) => ({
        id: `followup-${followUp.id}`,
        date: followUp.scheduled_at,
        type: 'followup',
        title: `Follow-up ${statusLabel(
          followUp.status
        )}`,
        description:
          followUp.notes ||
          'Follow-up registrado para este lead.',
      })
    ),

    ...appointments.map(
      (appointment) => ({
        id: `appointment-${appointment.id}`,
        date: appointment.scheduled_at,
        type: 'appointment',
        title: `Agendamento ${statusLabel(
          appointment.status
        )}`,
        description:
          appointment.notes ||
          'Agendamento registrado para este lead.',
      })
    ),

    ...(lead.status === 'convertido'
      ? [
          {
            id: `converted-${lead.id}`,
            date: lead.updated_at,
            type: 'converted',
            title: 'Lead convertido',
            description:
              'Este lead foi convertido em cliente.',
          },
        ]
      : []),
  ].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  )

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/leads"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 transition hover:text-black"
          >
            Leads
          </Link>

          <span className="text-xs text-gray-300">
            /
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Detalhes
          </span>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-black" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                LEAD
              </span>
            </div>

            <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
              {lead.name}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Detalhes, histórico e informações do lead.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lead.status !== 'convertido' && (
              <ConvertLeadButton
                leadId={lead.id}
                potentialValue={
                  lead.potential_value
                }
              />
            )}

            <Link
              href={`/leads/${lead.id}/editar`}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:text-black hover:shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
            >
              Editar
            </Link>

            <DeleteLeadButton
              leadId={lead.id}
            />

            <span className="inline-flex items-center gap-2 px-2 text-xs font-medium text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />

              {statusLabel(lead.status)}
            </span>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Informações
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="group rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Cadastro
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                  Informações do lead
                </h2>
              </div>

              <span className="h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
            </div>

            <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Nome
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {lead.name}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Empresa
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {lead.company_name ||
                    'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Instagram
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {lead.instagram ||
                    'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Segmento
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {lead.segment ||
                    'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Cidade
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {lead.city ||
                    'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Telefone
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {lead.phone ||
                    'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  E-mail
                </p>

                <p className="mt-2 break-all text-sm text-gray-700">
                  {lead.email ||
                    'Não informado'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Valor potencial
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {formatCurrency(
                    lead.potential_value
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Histórico
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                  Datas
                </h2>
              </div>

              <span className="h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Criado em
                </p>

                <p className="mt-2 text-sm text-gray-900">
                  {formatDate(
                    lead.created_at
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Última atualização
                </p>

                <p className="mt-2 text-sm text-gray-900">
                  {formatDate(
                    lead.updated_at
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Último contato
                </p>

                <p className="mt-2 text-sm text-gray-900">
                  {formatDate(
                    lead.last_contact_at
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Próximo follow-up
                </p>

                <p className="mt-2 text-sm text-gray-900">
                  {formatDate(
                    lead.next_follow_up_at
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Linha do tempo
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7">
          {timeline.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">
                Nenhum histórico registrado.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute bottom-3 left-[7px] top-3 w-px bg-gray-200" />

              <div className="space-y-7">
                {timeline.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="relative flex gap-5"
                    >
                      <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-4 border-white bg-black shadow-[0_0_0_1px_#e5e7eb]" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <p className="text-sm font-semibold text-gray-950">
                            {item.title}
                          </p>

                          <p className="shrink-0 text-[10px] text-gray-400">
                            {formatDateTime(
                              item.date
                            )}
                          </p>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 pb-8">
        <div className="mb-4 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Contexto
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="group rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Anotações
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                Observações
              </h2>
            </div>

            <span className="h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
          </div>

          <p className="mt-7 whitespace-pre-wrap text-sm leading-7 text-gray-600">
            {lead.notes ||
              'Nenhuma observação cadastrada.'}
          </p>
        </div>
      </section>
    </div>
  )
}