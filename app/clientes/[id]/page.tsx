import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ClientPageProps = {
  params: Promise<{
    id: string
  }>
}

type Client = {
  id: string
  organization_id: string
  lead_id: string | null
  name: string
  phone: string | null
  email: string | null
  converted_value: number | null
  converted_at: string | null
  deleted_at: string | null
}

type Lead = {
  id: string
  name: string
  company_name: string | null
  instagram: string | null
  city: string | null
  segment: string | null
  phone: string | null
  email: string | null
  potential_value: number | null
  notes: string | null
  created_at: string
  updated_at: string | null
  last_contact_at: string | null
  next_follow_up_at: string | null
}

type StageHistory = {
  id: string
  from_stage_id: string | null
  to_stage_id: string | null
  changed_by: string | null
  changed_at: string
  from_stage: {
    name: string
  } | null
  to_stage: {
    name: string
  } | null
}

type Activity = {
  id: string
  type: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type FollowUp = {
  id: string
  type: string
  scheduled_at: string
  status: string
  note: string | null
}

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value))
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatStatus(status: string) {
  const normalized = status.toLowerCase()

  const labels: Record<string, string> = {
    scheduled: 'Agendado',
    agendado: 'Agendado',
    pending: 'Pendente',
    completed: 'Concluído',
    concluido: 'Concluído',
    compareceu: 'Compareceu',
    no_show: 'Não compareceu',
    canceled: 'Cancelado',
    cancelado: 'Cancelado',
  }

  return labels[normalized] ?? status
}

export default async function ClientProfilePage({
  params,
}: ClientPageProps) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    redirect('/dashboard')
  }

  const organizationId = membership.organization_id

  // CLIENTE

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select(`
      id,
      organization_id,
      lead_id,
      name,
      phone,
      email,
      converted_value,
      converted_at,
      deleted_at
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (clientError) {
    console.error('Erro ao carregar cliente:', clientError)
  }

  if (!clientData) {
    notFound()
  }

  const client = clientData as Client

  // LEAD

  let lead: Lead | null = null

  if (client.lead_id) {
    const { data: leadData, error: leadError } = await supabase
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
        potential_value,
        notes,
        created_at,
        updated_at,
        last_contact_at,
        next_follow_up_at
      `)
      .eq('id', client.lead_id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (leadError) {
      console.error('Erro ao carregar lead:', leadError)
    }

    lead = leadData as Lead | null
  }

  // HISTÓRICO DO FUNIL

  let stageHistory: StageHistory[] = []

  if (client.lead_id) {
    const { data: historyData, error: historyError } =
      await supabase
        .from('lead_stage_history')
        .select(`
          id,
          from_stage_id,
          to_stage_id,
          changed_by,
          changed_at,
          from_stage:pipeline_stages!lead_stage_history_from_stage_id_fkey(
            name
          ),
          to_stage:pipeline_stages!lead_stage_history_to_stage_id_fkey(
            name
          )
        `)
        .eq('lead_id', client.lead_id)
        .eq('organization_id', organizationId)
        .order('changed_at', { ascending: false })

    if (historyError) {
      console.error('Erro ao carregar histórico do funil:', historyError)
    }

    stageHistory = (historyData ?? []) as unknown as StageHistory[]
  }

  // ATIVIDADES

  let activities: Activity[] = []

  if (client.lead_id) {
    const { data: activitiesData, error: activitiesError } =
      await supabase
        .from('activities')
        .select(`
          id,
          type,
          description,
          metadata,
          created_at
        `)
        .eq('lead_id', client.lead_id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(30)

    if (activitiesError) {
      console.error('Erro ao carregar atividades:', activitiesError)
    }

    activities = (activitiesData ?? []) as Activity[]
  }

  // FOLLOW-UPS

  let followUps: FollowUp[] = []

  if (client.lead_id) {
    const { data: followUpsData, error: followUpsError } =
      await supabase
        .from('follow_ups')
        .select(`
          id,
          type,
          scheduled_at,
          status,
          note
        `)
        .eq('lead_id', client.lead_id)
        .eq('organization_id', organizationId)
        .order('scheduled_at', { ascending: false })
        .limit(20)

    if (followUpsError) {
      console.error('Erro ao carregar follow-ups:', followUpsError)
    }

    followUps = (followUpsData ?? []) as FollowUp[]
  }

  // AGENDAMENTOS

  let appointments: Appointment[] = []

  if (client.lead_id) {
    const { data: appointmentsData, error: appointmentsError } =
      await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          notes
        `)
        .eq('lead_id', client.lead_id)
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: false })
        .limit(20)

    if (appointmentsError) {
      console.error('Erro ao carregar agendamentos:', appointmentsError)
    }

    appointments = (appointmentsData ?? []) as Appointment[]
  }

  return (
    <div className="mx-auto w-full max-w-[1600px]">

      {/* VOLTAR */}

      <div className="mb-8">
        <Link
          href="/clientes"
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 transition hover:text-gray-900"
        >
          ← Voltar para clientes
        </Link>
      </div>

      {/* CABEÇALHO */}

      <div className="border border-gray-200 bg-white">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto]">

          <div className="p-8 lg:p-10">

            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Perfil do cliente
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4">

              <h1 className="text-3xl font-semibold tracking-[-0.045em] text-gray-950">
                {client.name}
              </h1>

              <span className="border border-gray-200 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Cliente
              </span>

            </div>

            <p className="mt-3 text-sm text-gray-500">
              Histórico comercial, relacionamento e informações do cliente.
            </p>

          </div>

          <div className="grid grid-cols-2 border-t border-gray-200 lg:border-l lg:border-t-0">

            <div className="border-r border-gray-200 px-8 py-8">

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Venda realizada
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-gray-950">
                {formatCurrency(client.converted_value)}
              </p>

            </div>

            <div className="px-8 py-8">

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Conversão
              </p>

              <p className="mt-3 text-sm font-medium text-gray-800">
                {formatDate(client.converted_at)}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* CONTEÚDO */}

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">

        <div className="space-y-8">

          {/* INFORMAÇÕES */}

          <section className="border border-gray-200 bg-white">

            <div className="border-b border-gray-200 px-6 py-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Informações
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                Dados do cliente
              </h2>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

              <div className="border-b border-r border-gray-200 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Nome
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {client.name}
                </p>
              </div>

              <div className="border-b border-r border-gray-200 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Telefone
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {client.phone || '—'}
                </p>
              </div>

              <div className="border-b border-gray-200 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  E-mail
                </p>

                <p className="mt-2 break-all text-sm text-gray-800">
                  {client.email || '—'}
                </p>
              </div>

              <div className="border-r border-gray-200 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Empresa
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {lead?.company_name || '—'}
                </p>
              </div>

              <div className="border-r border-gray-200 p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Cidade
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {lead?.city || '—'}
                </p>
              </div>

              <div className="p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Segmento
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {lead?.segment || '—'}
                </p>
              </div>

            </div>

          </section>

          {/* OBSERVAÇÕES */}

          <section className="border border-gray-200 bg-white">

            <div className="border-b border-gray-200 px-6 py-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Observações
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                Anotações comerciais
              </h2>

            </div>

            <div className="p-6">

              {lead?.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {lead.notes}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Nenhuma observação registrada.
                </p>
              )}

            </div>

          </section>

          {/* HISTÓRICO DO FUNIL */}

          <section className="border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Histórico
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                  Histórico do funil
                </h2>
              </div>

              <span className="text-xs text-gray-400">
                {stageHistory.length}
              </span>

            </div>

            {stageHistory.length === 0 ? (
              <div className="p-8">
                <p className="text-sm text-gray-400">
                  Nenhuma movimentação registrada.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 border-l border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3">

                {stageHistory.map((item) => (

                  <div
                    key={item.id}
                    className="border-b border-r border-gray-200 p-6"
                  >

                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {formatDateTime(item.changed_at)}
                    </p>

                    <div className="mt-5">

                      <p className="text-sm font-medium text-gray-900">
                        {item.from_stage?.name || 'Início'}
                      </p>

                      <p className="my-2 text-xs text-gray-400">
                        ↓
                      </p>

                      <p className="text-sm font-medium text-gray-900">
                        {item.to_stage?.name || '—'}
                      </p>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </section>

          {/* ATIVIDADES */}

          <section className="border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Relacionamento
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                  Atividades
                </h2>
              </div>

              <span className="text-xs text-gray-400">
                {activities.length}
              </span>

            </div>

            {activities.length === 0 ? (
              <div className="p-8">
                <p className="text-sm text-gray-400">
                  Nenhuma atividade registrada.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 border-l border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3">

                {activities.map((activity) => (

                  <div
                    key={activity.id}
                    className="border-b border-r border-gray-200 p-6"
                  >

                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      {formatDateTime(activity.created_at)}
                    </p>

                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {activity.type}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      {activity.description || 'Sem descrição.'}
                    </p>

                  </div>

                ))}

              </div>
            )}

          </section>

          {/* FOLLOW-UPS */}

          <section className="border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Relacionamento
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                  Follow-ups
                </h2>
              </div>

              <span className="text-xs text-gray-400">
                {followUps.length}
              </span>

            </div>

            {followUps.length === 0 ? (
              <div className="p-8">
                <p className="text-sm text-gray-400">
                  Nenhum follow-up registrado.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 border-l border-t border-gray-200 sm:grid-cols-2">

                {followUps.map((followUp) => (

                  <div
                    key={followUp.id}
                    className="border-b border-r border-gray-200 p-6"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <p className="text-sm font-medium text-gray-900">
                        {followUp.type}
                      </p>

                      <span className="shrink-0 border border-gray-200 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                        {formatStatus(followUp.status)}
                      </span>

                    </div>

                    <p className="mt-4 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                      {formatDateTime(followUp.scheduled_at)}
                    </p>

                    {followUp.note && (
                      <p className="mt-4 text-sm leading-6 text-gray-600">
                        {followUp.note}
                      </p>
                    )}

                  </div>

                ))}

              </div>
            )}

          </section>

          {/* AGENDAMENTOS */}

          <section className="border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Agenda
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                  Agendamentos
                </h2>
              </div>

              <span className="text-xs text-gray-400">
                {appointments.length}
              </span>

            </div>

            {appointments.length === 0 ? (
              <div className="p-8">

                <p className="text-sm text-gray-400">
                  Nenhum agendamento registrado.
                </p>

              </div>
            ) : (
              <div className="grid grid-cols-1 border-l border-t border-gray-200 sm:grid-cols-2">

                {appointments.map((appointment) => (

                  <div
                    key={appointment.id}
                    className="border-b border-r border-gray-200 p-6"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Data e horário
                        </p>

                        <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-gray-950">
                          {formatDateTime(appointment.scheduled_at)}
                        </p>

                      </div>

                      <span className="shrink-0 border border-gray-200 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                        {formatStatus(appointment.status)}
                      </span>

                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-5">

                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Observações
                      </p>

                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {appointment.notes || 'Sem observações.'}
                      </p>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </section>

        </div>

        {/* SIDEBAR */}

        <aside className="space-y-8">

          {/* RESUMO */}

          <section className="border border-gray-200 bg-white">

            <div className="border-b border-gray-200 px-6 py-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Resumo
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                Visão geral
              </h2>

            </div>

            <div className="divide-y divide-gray-200">

              <div className="px-6 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Receita
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-950">
                  {formatCurrency(client.converted_value)}
                </p>
              </div>

              <div className="px-6 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Conversão
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {formatDate(client.converted_at)}
                </p>
              </div>

              <div className="px-6 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Histórico
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {stageHistory.length} movimentações
                </p>
              </div>

              <div className="px-6 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Atividades
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {activities.length} registros
                </p>
              </div>

              <div className="px-6 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Follow-ups
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {followUps.length} registros
                </p>
              </div>

              <div className="px-6 py-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Agendamentos
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  {appointments.length} registros
                </p>
              </div>

            </div>

          </section>

          {/* ORIGEM */}

          <section className="border border-gray-200 bg-white">

            <div className="border-b border-gray-200 px-6 py-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Origem
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-gray-950">
                Lead relacionado
              </h2>

            </div>

            <div className="space-y-5 p-6">

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Lead
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {lead?.name || client.name}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Instagram
                </p>

                <p className="mt-2 break-all text-sm text-gray-800">
                  {lead?.instagram || '—'}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Valor potencial
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {formatCurrency(lead?.potential_value ?? null)}
                </p>
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Lead criado em
                </p>

                <p className="mt-2 text-sm text-gray-800">
                  {formatDate(lead?.created_at ?? null)}
                </p>
              </div>

            </div>

          </section>

        </aside>

      </div>

    </div>
  )
}