import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MetricCard from '../../components/layout/dashboard/MetricCard'
import LeadsChart from '../../components/layout/charts/LeadsChart'
import RecentLeads from '../../components/layout/dashboard/RecentLeads'
import UpcomingFollowUps from '../../components/layout/dashboard/UpcomingFollowUps'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatChartDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export default async function DashboardPage() {
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

  const [
    leadsResult,
    clientsResult,
    followUpsResult,
    appointmentsResult,
    clientsFinancialResult,
    leadsFinancialResult,
    leadsEvolutionResult,
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .is('deleted_at', null),

    supabase
      .from('clients')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .is('deleted_at', null),

    supabase
      .from('follow_ups')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .eq('status', 'pending'),

    supabase
      .from('appointments')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('organization_id', organizationId)
      .eq('status', 'scheduled')
      .is('deleted_at', null),

    supabase
      .from('clients')
      .select('converted_value')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .not('converted_value', 'is', null),

    supabase
      .from('leads')
      .select(`
        potential_value,
        stage_id,
        pipeline_stages (
          name
        )
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .not('potential_value', 'is', null),

    supabase
      .from('leads')
      .select('created_at')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', {
        ascending: true,
      }),
  ])

  const errors = [
    leadsResult.error,
    clientsResult.error,
    followUpsResult.error,
    appointmentsResult.error,
    clientsFinancialResult.error,
    leadsFinancialResult.error,
    leadsEvolutionResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar dashboard
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(errors, null, 2)}
        </pre>
      </div>
    )
  }

  const leadsCount = leadsResult.count ?? 0

  const clientsCount = clientsResult.count ?? 0

  const followUpsCount = followUpsResult.count ?? 0

  const appointmentsCount = appointmentsResult.count ?? 0

  const revenueRealized =
    clientsFinancialResult.data?.reduce(
      (total, client) =>
        total +
        Number(client.converted_value ?? 0),
      0
    ) ?? 0

  const negotiationValue =
    leadsFinancialResult.data?.reduce(
      (total, lead) => {
        const stage = Array.isArray(
          lead.pipeline_stages
        )
          ? lead.pipeline_stages[0]
          : lead.pipeline_stages

        const stageName = String(
          stage?.name ?? ''
        )
          .trim()
          .toLowerCase()

        if (
          stageName === 'proposta' ||
          stageName === 'negociação' ||
          stageName === 'negociacao'
        ) {
          return (
            total +
            Number(
              lead.potential_value ?? 0
            )
          )
        }

        return total
      },
      0
    ) ?? 0

  const averageTicket =
    clientsCount > 0
      ? revenueRealized / clientsCount
      : 0

  const today = new Date()

  const startDate = new Date(today)

  startDate.setDate(
    today.getDate() - 29
  )

  startDate.setHours(0, 0, 0, 0)

  const leadsByDay = new Map<
    string,
    number
  >()

  for (
    const lead of leadsEvolutionResult.data ??
    []
  ) {
    const createdAt = new Date(
      lead.created_at
    )

    if (createdAt < startDate) {
      continue
    }

    const year = createdAt.getFullYear()

    const month = String(
      createdAt.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      createdAt.getDate()
    ).padStart(2, '0')

    const key = `${year}-${month}-${day}`

    leadsByDay.set(
      key,
      (leadsByDay.get(key) ?? 0) + 1
    )
  }

  const chartData = Array.from(
    { length: 30 },
    (_, index) => {
      const date = new Date(startDate)

      date.setDate(
        startDate.getDate() + index
      )

      const year = date.getFullYear()

      const month = String(
        date.getMonth() + 1
      ).padStart(2, '0')

      const day = String(
        date.getDate()
      ).padStart(2, '0')

      const key = `${year}-${month}-${day}`

      return {
        date: formatChartDate(date),
        leads: leadsByDay.get(key) ?? 0,
      }
    }
  )

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-black" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                NORTH CRM
              </span>
            </div>

            <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
              Visão geral
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Acompanhe os principais números da sua operação comercial.
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Operação
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              Painel comercial
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Indicadores
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Leads"
            value={leadsCount}
            description="Leads cadastrados"
          />

          <MetricCard
            title="Clientes"
            value={clientsCount}
            description="Clientes ativos"
          />

          <MetricCard
            title="Receita realizada"
            value={formatCurrency(
              revenueRealized
            )}
            description="Valor convertido"
          />

          <MetricCard
            title="Ticket médio"
            value={formatCurrency(
              averageTicket
            )}
            description="Média por cliente"
          />

          <MetricCard
            title="Em negociação"
            value={formatCurrency(
              negotiationValue
            )}
            description="Propostas e negociações"
          />

          <MetricCard
            title="Follow-ups"
            value={followUpsCount}
            description="Follow-ups pendentes"
          />

          <MetricCard
            title="Agendamentos"
            value={appointmentsCount}
            description="Agendamentos ativos"
          />
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Evolução
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="shrink-0 text-xs text-gray-400">
            Últimos 30 dias
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="px-6 pt-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Novos leads
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Quantidade de leads cadastrados por dia.
            </p>
          </div>

          <LeadsChart data={chartData} />
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Atividade
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <RecentLeads />
          </div>

          <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <UpcomingFollowUps />
          </div>
        </div>
      </section>
    </div>
  )
}