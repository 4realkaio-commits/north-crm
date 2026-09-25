import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IndicatorsChart from './IndicatorsChart'

function getStartOfMonth() {
  const now = new Date()

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0,
      0,
      0,
      0
    )
  ).toISOString()
}

function getLast30Days() {
  const dates: Date[] = []

  for (let index = 29; index >= 0; index--) {
    const date = new Date()

    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - index)

    dates.push(date)
  }

  return dates
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export default async function IndicadoresPage() {
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
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError || !membership) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Organização não encontrada
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Não foi possível identificar a organização do usuário.
        </p>
      </div>
    )
  }

  const organizationId = membership.organization_id
  const startOfMonth = getStartOfMonth()

  const chartStartDate = new Date()

  chartStartDate.setHours(0, 0, 0, 0)
  chartStartDate.setDate(
    chartStartDate.getDate() - 29
  )

  const [
    leadsResult,
    clientsResult,
    appointmentsResult,
    attendedResult,
    chartLeadsResult,
    chartClientsResult,
    financialClientsResult,
    financialLeadsResult,
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte('created_at', startOfMonth),

    supabase
      .from('clients')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte('converted_at', startOfMonth),

    supabase
      .from('appointments')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte('created_at', startOfMonth),

    supabase
      .from('appointments')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('status', 'compareceu')
      .gte('scheduled_at', startOfMonth),

    supabase
      .from('leads')
      .select('created_at')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte(
        'created_at',
        chartStartDate.toISOString()
      ),

    supabase
      .from('clients')
      .select('converted_at')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte(
        'converted_at',
        chartStartDate.toISOString()
      ),

    supabase
      .from('clients')
      .select(
        'converted_value, converted_at'
      )
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .gte('converted_at', startOfMonth),

    supabase
      .from('leads')
      .select(
        'potential_value, status'
      )
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
  ])

  const errors = [
    leadsResult.error,
    clientsResult.error,
    appointmentsResult.error,
    attendedResult.error,
    chartLeadsResult.error,
    chartClientsResult.error,
    financialClientsResult.error,
    financialLeadsResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar indicadores
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(errors, null, 2)}
        </pre>
      </div>
    )
  }

  const newLeads = leadsResult.count ?? 0
  const convertedClients =
    clientsResult.count ?? 0
  const appointments =
    appointmentsResult.count ?? 0
  const attendedAppointments =
    attendedResult.count ?? 0

  const conversionRate =
    newLeads > 0
      ? (convertedClients / newLeads) * 100
      : 0

  const financialClients =
    financialClientsResult.data ?? []

  const financialLeads =
    financialLeadsResult.data ?? []

  const revenueRealized =
    financialClients.reduce(
      (total, client) =>
        total +
        Number(client.converted_value ?? 0),
      0
    )

  const potentialValue =
    financialLeads.reduce(
      (total, lead) =>
        total +
        Number(lead.potential_value ?? 0),
      0
    )

  const negotiationValue =
    financialLeads
      .filter(
        (lead) =>
          lead.status === 'negociacao' ||
          lead.status === 'proposta'
      )
      .reduce(
        (total, lead) =>
          total +
          Number(lead.potential_value ?? 0),
        0
      )

  const averageTicket =
    convertedClients > 0
      ? revenueRealized / convertedClients
      : 0

  const chartLeads =
    chartLeadsResult.data ?? []

  const chartClients =
    chartClientsResult.data ?? []

  const dates = getLast30Days()

  const chartData = dates.map((date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    const leadsCount =
      chartLeads.filter((lead) => {
        const leadDate = new Date(
          lead.created_at
        )

        return (
          leadDate.getFullYear() === year &&
          leadDate.getMonth() === month &&
          leadDate.getDate() === day
        )
      }).length

    const conversionsCount =
      chartClients.filter((client) => {
        const convertedDate = new Date(
          client.converted_at
        )

        return (
          convertedDate.getFullYear() === year &&
          convertedDate.getMonth() === month &&
          convertedDate.getDate() === day
        )
      }).length

    return {
      name: `${String(day).padStart(
        2,
        '0'
      )}/${String(month + 1).padStart(
        2,
        '0'
      )}`,
      leads: leadsCount,
      conversions: conversionsCount,
    }
  })

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
              Indicadores
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Acompanhe o desempenho comercial e financeiro da sua operação.
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Período
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              Mês atual
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Desempenho
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Novos leads
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {newLeads}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Leads criados neste mês
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Clientes convertidos
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {convertedClients}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Conversões neste mês
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Taxa de conversão
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {conversionRate.toFixed(1)}%
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Clientes ÷ novos leads
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Agendamentos
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {appointments}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Agendamentos neste mês
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Financeiro
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Receita realizada
            </p>

            <div className="mt-7">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  revenueRealized
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Conversões realizadas neste mês
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Valor potencial
            </p>

            <div className="mt-7">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  potentialValue
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Valor potencial dos leads ativos
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Em negociação
            </p>

            <div className="mt-7">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  negotiationValue
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Propostas e negociações ativas
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Ticket médio
            </p>

            <div className="mt-7">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  averageTicket
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Receita realizada ÷ conversões
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Evolução
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="hidden shrink-0 text-xs text-gray-400 sm:block">
            Últimos 30 dias
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <IndicatorsChart data={chartData} />
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Acompanhamento
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Agenda
                </p>

                <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                  Comparecimentos
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Agendamentos marcados como compareceu.
                </p>
              </div>

              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-200" />
            </div>

            <div className="mt-10">
              <p className="text-[42px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {attendedAppointments}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Comparecimentos registrados neste mês
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Operação
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
                Resumo do mês
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Dados comerciais registrados desde o início do mês atual.
              </p>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between border-b border-gray-100 py-4">
                <span className="text-sm text-gray-500">
                  Leads
                </span>

                <span className="text-sm font-semibold text-gray-950">
                  {newLeads}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-4">
                <span className="text-sm text-gray-500">
                  Conversões
                </span>

                <span className="text-sm font-semibold text-gray-950">
                  {convertedClients}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-4">
                <span className="text-sm text-gray-500">
                  Agendamentos
                </span>

                <span className="text-sm font-semibold text-gray-950">
                  {appointments}
                </span>
              </div>

              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-gray-500">
                  Comparecimentos
                </span>

                <span className="text-sm font-semibold text-gray-950">
                  {attendedAppointments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}