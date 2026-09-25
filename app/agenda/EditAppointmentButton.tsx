'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  name: string
}

type EditAppointmentButtonProps = {
  appointmentId: string
  leadId: string
  scheduledAt: string
  status: string
  notes: string | null
  leads: Lead[]
}

function getInitialDate(scheduledAt: string) {
  const date = new Date(scheduledAt)

  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')
  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getInitialTime(scheduledAt: string) {
  const date = new Date(scheduledAt)

  const hours = String(
    date.getHours()
  ).padStart(2, '0')
  const minutes = String(
    date.getMinutes()
  ).padStart(2, '0')

  return `${hours}:${minutes}`
}

function normalizeStatus(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmado':
      return 'confirmado'

    case 'completed':
    case 'compareceu':
      return 'compareceu'

    case 'canceled':
    case 'cancelado':
      return 'cancelado'

    case 'no_show':
    case 'nao_compareceu':
      return 'nao_compareceu'

    case 'scheduled':
    default:
      return 'scheduled'
  }
}

export default function EditAppointmentButton({
  appointmentId,
  leadId,
  scheduledAt,
  status,
  notes,
  leads,
}: EditAppointmentButtonProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)

  const [selectedLeadId, setSelectedLeadId] =
    useState(leadId)

  const [date, setDate] = useState(
    getInitialDate(scheduledAt)
  )

  const [time, setTime] = useState(
    getInitialTime(scheduledAt)
  )

  const [selectedStatus, setSelectedStatus] =
    useState(
      normalizeStatus(status)
    )

  const [currentNotes, setCurrentNotes] =
    useState(notes ?? '')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  function handleOpen() {
    setSelectedLeadId(leadId)
    setDate(getInitialDate(scheduledAt))
    setTime(getInitialTime(scheduledAt))
    setSelectedStatus(
      normalizeStatus(status)
    )
    setCurrentNotes(notes ?? '')
    setError('')
    setOpen(true)
  }

  function handleClose() {
    if (loading) return

    setOpen(false)
    setError('')
  }

  async function handleSave() {
    setError('')

    if (!selectedLeadId) {
      setError('Selecione um lead.')
      return
    }

    if (!date) {
      setError('Informe a data.')
      return
    }

    if (!time) {
      setError('Informe o horário.')
      return
    }

    setLoading(true)

    const scheduledAtValue = new Date(
      `${date}T${time}:00`
    ).toISOString()

    const supabase = createClient()

    const { error: updateError } =
      await supabase
        .from('appointments')
        .update({
          lead_id: selectedLeadId,
          scheduled_at: scheduledAtValue,
          status: selectedStatus,
          notes:
            currentNotes.trim() || null,
        })
        .eq('id', appointmentId)

    if (updateError) {
      console.error(
        'Erro ao editar compromisso:',
        JSON.stringify(
          updateError,
          null,
          2
        )
      )

      setError(
        updateError.message ||
          'Não foi possível salvar as alterações.'
      )

      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)

    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-black hover:text-black"
      >
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Agenda
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-gray-950">
                  Editar compromisso
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Atualize as informações deste compromisso.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-xl leading-none text-gray-300 transition hover:text-black disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-8">
              <label
                htmlFor={`edit-lead-${appointmentId}`}
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Lead
              </label>

              <select
                id={`edit-lead-${appointmentId}`}
                value={selectedLeadId}
                onChange={(event) =>
                  setSelectedLeadId(
                    event.target.value
                  )
                }
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black disabled:opacity-50"
              >
                <option value="">
                  Selecione um lead
                </option>

                {leads.map((lead) => (
                  <option
                    key={lead.id}
                    value={lead.id}
                  >
                    {lead.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`edit-date-${appointmentId}`}
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Data
                </label>

                <input
                  id={`edit-date-${appointmentId}`}
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(event.target.value)
                  }
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor={`edit-time-${appointmentId}`}
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Horário
                </label>

                <input
                  id={`edit-time-${appointmentId}`}
                  type="time"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  disabled={loading}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black disabled:opacity-50"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor={`edit-status-${appointmentId}`}
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Status
              </label>

              <select
                id={`edit-status-${appointmentId}`}
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value
                  )
                }
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black disabled:opacity-50"
              >
                <option value="scheduled">
                  Agendado
                </option>

                <option value="confirmado">
                  Confirmado
                </option>

                <option value="compareceu">
                  Compareceu
                </option>

                <option value="cancelado">
                  Cancelado
                </option>

                <option value="nao_compareceu">
                  Não compareceu
                </option>
              </select>
            </div>

            <div className="mt-6">
              <label
                htmlFor={`edit-notes-${appointmentId}`}
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Observações
              </label>

              <textarea
                id={`edit-notes-${appointmentId}`}
                value={currentNotes}
                onChange={(event) =>
                  setCurrentNotes(
                    event.target.value
                  )
                }
                disabled={loading}
                rows={4}
                placeholder="Observações sobre o compromisso..."
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-black disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-medium text-red-600">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-black disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Salvando...'
                  : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}