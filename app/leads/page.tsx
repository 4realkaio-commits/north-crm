import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewLeadForm from './NewLeadForm'
import LeadSelection from './LeadSelection'

type Lead = {
  id: string
  name: string
  company_name: string | null
  instagram: string | null
  city: string | null
  segment: string | null
  phone: string | null
  email: string | null
  status: string
  potential_value: number | null
  created_at: string
  stage_id: string | null
  pipeline_stages:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

export default async function LeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: leads, error } = await supabase
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
      created_at,
      stage_id,
      pipeline_stages (
        name
      )
    `)
    .is('deleted_at', null)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar os leads
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  const safeLeads = (leads ?? []) as Lead[]

  const totalPotential = safeLeads.reduce(
    (total, lead) =>
      total + Number(lead.potential_value ?? 0),
    0
  )

  const negotiationLeads = safeLeads.filter(
    (lead) => {
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
    }
  )

  const negotiationCount =
    negotiationLeads.length

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
              Leads
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Gerencie oportunidades e acompanhe seus contatos comerciais.
            </p>
          </div>

          <NewLeadForm />
        </div>
      </header>

      <section>
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Indicadores
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Total de leads
            </p>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {safeLeads.length}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Leads ativos no CRM
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Em negociação
            </p>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {negotiationCount}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Propostas e negociações
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Valor potencial
            </p>

            <div className="mt-7">
              <p className="text-[32px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {totalPotential.toLocaleString(
                  'pt-BR',
                  {
                    style: 'currency',
                    currency: 'BRL',
                  }
                )}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Potencial total dos leads
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Leads
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="shrink-0 text-xs text-gray-400">
            {safeLeads.length}{' '}
            {safeLeads.length === 1
              ? 'lead'
              : 'leads'}
          </span>
        </div>

        <LeadSelection leads={safeLeads} />
      </section>
    </div>
  )
}