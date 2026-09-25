import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewAppointmentForm from './NewAppointmentForm'
import AppointmentSelection from './AppointmentSelection'

type Appointment = {
  id: string
  lead_id: string
  scheduled_at: string
  status: string
  notes: string | null
}

type Lead = {
  id: string
  name: string
}

export default async function AgendaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const {
    data: appointments,
    error: appointmentsError,
  } = await supabase
    .from('appointments')
    .select(`
      id,
      lead_id,
      scheduled_at,
      status,
      notes
    `)
    .is('deleted_at', null)
    .order('scheduled_at', {
      ascending: true,
    })

  if (appointmentsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar a agenda
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(
            appointmentsError,
            null,
            2
          )}
        </pre>
      </div>
    )
  }

  const safeAppointments =
    (appointments ?? []) as Appointment[]

  const {
    data: leadsData,
    error: leadsError,
  } = await supabase
    .from('leads')
    .select('id, name')
    .is('deleted_at', null)
    .order('name', {
      ascending: true,
    })

  if (leadsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar os leads
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(
            leadsError,
            null,
            2
          )}
        </pre>
      </div>
    )
  }

  const allLeads =
    (leadsData ?? []) as Lead[]

  const appointmentLeadIds = [
    ...new Set(
      safeAppointments.map(
        (appointment) =>
          appointment.lead_id
      )
    ),
  ]

  const appointmentLeads =
    allLeads.filter((lead) =>
      appointmentLeadIds.includes(
        lead.id
      )
    )

  const leadMap = new Map(
    appointmentLeads.map((lead) => [
      lead.id,
      lead,
    ])
  )

  const now = new Date()

  const upcomingAppointments =
    safeAppointments.filter(
      (appointment) =>
        new Date(
          appointment.scheduled_at
        ) >= now &&
        ![
          'canceled',
          'cancelado',
          'completed',
          'compareceu',
          'no_show',
          'nao_compareceu',
        ].includes(
          appointment.status.toLowerCase()
        )
    ).length

  const completedAppointments =
    safeAppointments.filter(
      (appointment) =>
        [
          'completed',
          'compareceu',
        ].includes(
          appointment.status.toLowerCase()
        )
    ).length

  const canceledAppointments =
    safeAppointments.filter(
      (appointment) =>
        [
          'canceled',
          'cancelado',
        ].includes(
          appointment.status.toLowerCase()
        )
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
              Agenda
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Organize reuniões, compromissos e contatos comerciais.
            </p>
          </div>

          <NewAppointmentForm
            leads={allLeads}
          />
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
              Próximos
            </p>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {upcomingAppointments}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Compromissos futuros
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Realizados
            </p>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {completedAppointments}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Compromissos realizados
              </p>
            </div>
          </div>

          <div className="group bg-white px-6 py-6 transition-colors hover:bg-gray-50/70">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Cancelados
            </p>

            <div className="mt-7">
              <p className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-gray-950">
                {canceledAppointments}
              </p>

              <div className="mt-5 h-px w-full bg-gray-100" />

              <p className="mt-4 text-xs text-gray-400">
                Compromissos cancelados
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 pb-8">
        <div className="mb-5 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Compromissos
          </h2>

          <span className="h-px flex-1 bg-gray-200" />

          <span className="shrink-0 text-xs text-gray-400">
            {safeAppointments.length}{' '}
            {safeAppointments.length === 1
              ? 'compromisso'
              : 'compromissos'}
          </span>
        </div>

        <AppointmentSelection
          appointments={safeAppointments}
          leadMap={Object.fromEntries(
            leadMap
          )}
          leads={allLeads}
        />
      </section>
    </div>
  )
}