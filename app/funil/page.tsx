import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FunilKanban from './FunilKanban'

type Stage = {
  id: string
  name: string
  position: number
  color: string | null
  is_final: boolean
}

type Lead = {
  id: string
  name: string
  phone: string | null
  potential_value: number | null
  stage_id: string | null
}

export default async function FunilPage() {
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
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
        <h1 className="text-lg font-semibold text-yellow-700">
          Organização não encontrada
        </h1>

        <p className="mt-2 text-sm text-yellow-600">
          Não foi possível identificar a organização do usuário.
        </p>
      </div>
    )
  }

  const organizationId = membership.organization_id

  const { data: stages, error: stagesError } =
    await supabase
      .from('pipeline_stages')
      .select(`
        id,
        name,
        position,
        color,
        is_final
      `)
      .eq('organization_id', organizationId)
      .order('position', { ascending: true })

  const { data: leads, error: leadsError } =
    await supabase
      .from('leads')
      .select(`
        id,
        name,
        phone,
        potential_value,
        stage_id
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

  if (stagesError || leadsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar o funil
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(
            {
              stagesError,
              leadsError,
            },
            null,
            2
          )}
        </pre>
      </div>
    )
  }

  const safeStages = (stages ?? []) as Stage[]
  const safeLeads = (leads ?? []) as Lead[]

  const totalLeads = safeLeads.length

  const totalPotentialValue = safeLeads.reduce(
    (total, lead) =>
      total + Number(lead.potential_value || 0),
    0
  )

  const convertedStage = safeStages.find(
    (stage) =>
      stage.name.toLowerCase() === 'convertido'
  )

  const convertedLeads = convertedStage
    ? safeLeads.filter(
        (lead) => lead.stage_id === convertedStage.id
      )
    : []

  const convertedValue = convertedLeads.reduce(
    (total, lead) =>
      total + Number(lead.potential_value || 0),
    0
  )

  const conversionRate =
    totalLeads > 0
      ? (convertedLeads.length / totalLeads) * 100
      : 0

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* HEADER */}
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
              Funil
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Acompanhe seus leads ao longo do processo comercial.
            </p>
          </div>

          <Link
            href="/leads"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-[0.98]"
          >
            Ver leads
          </Link>
        </div>
      </header>

      {/* RESUMO */}
      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Resumo
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {/* LEADS */}
          <div className="group border border-gray-200 bg-white px-6 py-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Leads no funil
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {totalLeads}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100 transition-colors duration-300 group-hover:bg-gray-200" />

              <p className="mt-4 text-xs text-gray-400">
                Leads ativos no pipeline
              </p>
            </div>
          </div>

          {/* VALOR */}
          <div className="group border border-gray-200 bg-white px-6 py-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Valor potencial
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                R${' '}
                {totalPotentialValue.toLocaleString(
                  'pt-BR',
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100 transition-colors duration-300 group-hover:bg-gray-200" />

              <p className="mt-4 text-xs text-gray-400">
                Potencial comercial total
              </p>
            </div>
          </div>

          {/* CONVERSÃO */}
          <div className="group border border-gray-200 bg-white px-6 py-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Conversão atual
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-all duration-300 group-hover:scale-125 group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {conversionRate.toLocaleString(
                  'pt-BR',
                  {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }
                )}
                %
              </p>

              <div className="mt-5 h-px w-full bg-gray-100 transition-colors duration-300 group-hover:bg-gray-200" />

              <p className="mt-4 text-xs text-gray-400">
                {convertedLeads.length}{' '}
                {convertedLeads.length === 1
                  ? 'lead convertido'
                  : 'leads convertidos'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Pipeline
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="hidden shrink-0 text-xs text-gray-400 sm:block">
            Arraste para mover
          </span>
        </div>

        {safeStages.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <p className="text-sm text-gray-400">
              Nenhuma etapa cadastrada no funil.
            </p>
          </div>
        ) : (
          <div className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 ease-out hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
            <FunilKanban
              stages={safeStages}
              initialLeads={safeLeads}
            />
          </div>
        )}
      </section>

      {/* VISÃO DO FUNIL */}
      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Visão do funil
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {safeStages.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <p className="text-sm text-gray-400">
              Nenhuma etapa disponível.
            </p>
          </div>
        ) : (
          <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 ease-out hover:border-gray-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <div className="p-7">
              <div className="mx-auto flex max-w-5xl flex-col items-center gap-2">
                {safeStages.map((stage, index) => {
                  const stageLeads = safeLeads.filter(
                    (lead) =>
                      lead.stage_id === stage.id
                  )

                  const stageValue =
                    stageLeads.reduce(
                      (total, lead) =>
                        total +
                        Number(
                          lead.potential_value || 0
                        ),
                      0
                    )

                  const maxWidth = Math.max(
                    100 - index * 8,
                    48
                  )

                  return (
                    <div
                      key={stage.id}
                      className="flex w-full justify-center"
                    >
                      <div
                        className="group relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-100 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
                        style={{
                          width: `${maxWidth}%`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex min-w-0 items-center gap-4">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-125"
                              style={{
                                backgroundColor:
                                  stage.color ||
                                  '#111827',
                              }}
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {stage.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {stageLeads.length}{' '}
                                {stageLeads.length === 1
                                  ? 'lead'
                                  : 'leads'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              R${' '}
                              {stageValue.toLocaleString(
                                'pt-BR',
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </p>

                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                              Potencial
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RESUMO FINAL */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-7 py-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Total de leads
                  </p>

                  <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950">
                    {totalLeads}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Valor convertido
                  </p>

                  <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950">
                    R${' '}
                    {convertedValue.toLocaleString(
                      'pt-BR',
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Taxa de conversão
                  </p>

                  <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950">
                    {conversionRate.toLocaleString(
                      'pt-BR',
                      {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      }
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}