import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export default async function FinanceiroPage() {
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
    clientsResult,
    leadsResult,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select(
        'id, name, converted_value, converted_at'
      )
      .eq(
        'organization_id',
        organizationId
      )
      .is('deleted_at', null)
      .not(
        'converted_value',
        'is',
        null
      ),

    supabase
      .from('leads')
      .select(`
        id,
        name,
        potential_value,
        status,
        stage_id,
        pipeline_stages (
          name
        )
      `)
      .eq(
        'organization_id',
        organizationId
      )
      .is('deleted_at', null),
  ])

  const errors = [
    clientsResult.error,
    leadsResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar financeiro
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(
            errors,
            null,
            2
          )}
        </pre>
      </div>
    )
  }

  const clients =
    clientsResult.data ?? []

  const leads =
    leadsResult.data ?? []

  const receitaRealizada =
    clients.reduce(
      (total, client) =>
        total +
        Number(
          client.converted_value ?? 0
        ),
      0
    )

  /*
   * Receita prevista:
   * somente leads que ainda não foram
   * convertidos ou perdidos.
   *
   * Isso representa o potencial que
   * ainda pode entrar no caixa.
   */
  const leadsAtivos = leads.filter(
    (lead) => {
      const status = String(
        lead.status ?? ''
      )
        .trim()
        .toLowerCase()

      return (
        status !== 'convertido' &&
        status !== 'perdido'
      )
    }
  )

  const receitaPrevista =
    leadsAtivos.reduce(
      (total, lead) =>
        total +
        Number(
          lead.potential_value ?? 0
        ),
      0
    )

  /*
   * Em negociação:
   * somente etapas Proposta e Negociação.
   */
  const leadsEmNegociacao =
    leads.filter((lead) => {
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

      return (
        stageName === 'proposta' ||
        stageName === 'negociação' ||
        stageName === 'negociacao'
      )
    })

  const valorEmNegociacao =
    leadsEmNegociacao.reduce(
      (total, lead) =>
        total +
        Number(
          lead.potential_value ?? 0
        ),
      0
    )

  const ticketMedio =
    clients.length > 0
      ? receitaRealizada /
        clients.length
      : 0

  const ultimasMovimentacoes =
    [...clients]
      .sort(
        (a, b) =>
          new Date(
            b.converted_at
          ).getTime() -
          new Date(
            a.converted_at
          ).getTime()
      )
      .slice(0, 5)

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
              Financeiro
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Acompanhe os valores gerados e o potencial comercial da operação.
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Visão
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              Operação atual
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Indicadores financeiros
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Receita realizada
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  receitaRealizada
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Total convertido
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Receita prevista
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  receitaPrevista
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Potencial dos leads ativos
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Em negociação
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  valorEmNegociacao
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Propostas e negociações
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Ticket médio
              </p>

              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-200 transition-colors group-hover:bg-black" />
            </div>

            <div className="mt-7">
              <p className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {formatCurrency(
                  ticketMedio
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Média por cliente
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Evolução financeira
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Receita
            </p>

            <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
              Movimentações financeiras
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Acompanhe os clientes convertidos e os valores registrados.
            </p>
          </div>

          <div className="mt-8 overflow-hidden border border-gray-100">
            {ultimasMovimentacoes.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-gray-400">
                  Nenhuma conversão registrada.
                </p>
              </div>
            ) : (
              <div>
                {ultimasMovimentacoes.map(
                  (client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between gap-6 border-b border-gray-100 px-6 py-5 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-950">
                          {client.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Cliente convertido
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-gray-950">
                        {formatCurrency(
                          Number(
                            client.converted_value ??
                              0
                          )
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Resumo
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Clientes
            </p>

            <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
              Conversões registradas
            </h2>

            <div className="mt-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-[42px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                  {clients.length}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  Clientes com valor de conversão
                </p>
              </div>

              <p className="text-lg font-semibold text-gray-950">
                {formatCurrency(
                  receitaRealizada
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Pipeline
            </p>

            <h2 className="mt-2 text-lg font-semibold tracking-tight text-gray-950">
              Potencial comercial
            </h2>

            <div className="mt-8">
              <div className="flex items-center justify-between border-b border-gray-100 py-4">
                <span className="text-sm text-gray-500">
                  Receita prevista
                </span>

                <span className="text-sm font-semibold text-gray-950">
                  {formatCurrency(
                    receitaPrevista
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-gray-500">
                  Em negociação
                </span>

                <span className="text-sm font-semibold text-gray-950">
                  {formatCurrency(
                    valorEmNegociacao
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}