'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import EditAppointmentButton from './EditAppointmentButton'

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

type AppointmentSelectionProps = {
  appointments: Appointment[]
  leadMap: Record<string, Lead>
  leads: Lead[]
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'Agendado'

    case 'confirmado':
      return 'Confirmado'

    case 'completed':
    case 'compareceu':
      return 'Compareceu'

    case 'canceled':
    case 'cancelado':
      return 'Cancelado'

    case 'no_show':
    case 'nao_compareceu':
      return 'Não compareceu'

    default:
      return status
  }
}

function getStatusDot(status: string) {
  switch (status.toLowerCase()) {
    case 'scheduled':
    case 'confirmado':
      return 'bg-black'

    case 'completed':
    case 'compareceu':
      return 'bg-gray-500'

    case 'canceled':
    case 'cancelado':
      return 'bg-gray-300'

    default:
      return 'bg-gray-400'
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)

  return {
    date: date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export default function AppointmentSelection({
  appointments,
  leadMap,
  leads,
}: AppointmentSelectionProps) {
  const router = useRouter()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allSelected =
    appointments.length > 0 &&
    selectedIds.length === appointments.length

  function toggleAppointment(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (selectedId) => selectedId !== id
          )
        : [...current, id]
    )
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([])
      return
    }

    setSelectedIds(
      appointments.map(
        (appointment) => appointment.id
      )
    )
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return

    const confirmed = window.confirm(
      `Excluir ${selectedIds.length} ${
        selectedIds.length === 1
          ? 'compromisso'
          : 'compromissos'
      } selecionado${
        selectedIds.length === 1 ? '' : 's'
      }?`
    )

    if (!confirmed) return

    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: deleteError } =
      await supabase
        .from('appointments')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .in('id', selectedIds)

    if (deleteError) {
      console.error(
        'Erro ao excluir compromissos:',
        JSON.stringify(
          deleteError,
          null,
          2
        )
      )

      setError(
        deleteError.message ||
          'Não foi possível excluir os compromissos.'
      )

      setLoading(false)
      return
    }

    setSelectedIds([])
    setLoading(false)

    router.refresh()
  }

  if (appointments.length === 0) {
    return (
      <div className="border border-gray-200 bg-white">
        <div className="flex min-h-52 items-center justify-center px-10">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center border border-gray-200 text-[10px] font-semibold tracking-[0.16em] text-gray-400">
              N
            </div>

            <p className="text-sm font-medium text-gray-800">
              Nenhum compromisso cadastrado.
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Clique em “Novo compromisso” para criar o primeiro.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="mb-5 flex items-center justify-between border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium text-gray-600">
            {selectedIds.length}{' '}
            {selectedIds.length === 1
              ? 'compromisso selecionado'
              : 'compromissos selecionados'}
          </p>

          <button
            type="button"
            onClick={deleteSelected}
            disabled={loading}
            className="border border-gray-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Excluindo...'
              : 'Excluir selecionados'}
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-600">
            {error}
          </p>
        </div>
      )}

      <div className="border-l border-t border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-14 border-r border-gray-100 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Selecionar todos"
                    className="h-3.5 w-3.5 cursor-pointer accent-black"
                  />
                </th>

                <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Lead
                </th>

                <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Data
                </th>

                <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Status
                </th>

                <th className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Observações
                </th>

                <th className="px-6 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((appointment) => {
                const lead =
                  leadMap[appointment.lead_id]

                const selected =
                  selectedIds.includes(
                    appointment.id
                  )

                const dateTime =
                  formatDateTime(
                    appointment.scheduled_at
                  )

                return (
                  <tr
                    key={appointment.id}
                    className={`border-b border-gray-100 last:border-0 transition ${
                      selected
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="border-r border-gray-100 px-5 py-5 align-top">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleAppointment(
                            appointment.id
                          )
                        }
                        aria-label={`Selecionar compromisso ${
                          lead?.name ||
                          'sem lead'
                        }`}
                        className="h-3.5 w-3.5 cursor-pointer accent-black"
                      />
                    </td>

                    <td className="px-6 py-5 align-top">
                      {lead ? (
                        <div>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-sm font-semibold tracking-[-0.02em] text-gray-900 transition hover:underline"
                          >
                            {lead.name}
                          </Link>

                          <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                            Lead
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Lead não encontrado
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top">
                      <p className="text-sm font-medium text-gray-800">
                        {dateTime.date}
                      </p>

                      <p className="mt-1 text-[11px] text-gray-400">
                        {dateTime.time}
                      </p>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center gap-2 text-[11px] font-medium text-gray-600">
                        <span
                          className={`h-1.5 w-1.5 ${getStatusDot(
                            appointment.status
                          )}`}
                        />

                        {getStatusLabel(
                          appointment.status
                        )}
                      </span>
                    </td>

                    <td className="max-w-[460px] px-6 py-5 align-top">
                      <p className="truncate text-xs leading-5 text-gray-500">
                        {appointment.notes ||
                          'Sem observações'}
                      </p>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center justify-end">
                        <EditAppointmentButton
                          appointmentId={
                            appointment.id
                          }
                          leadId={
                            appointment.lead_id
                          }
                          scheduledAt={
                            appointment.scheduled_at
                          }
                          status={
                            appointment.status
                          }
                          notes={
                            appointment.notes
                          }
                          leads={leads}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}