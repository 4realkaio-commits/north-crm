'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  name: string
}

type NewAppointmentFormProps = {
  leads: Lead[]
}

export default function NewAppointmentForm({
  leads,
}: NewAppointmentFormProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [leadId, setLeadId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setError('')
    setOpen(true)
  }

  function handleClose() {
    if (loading) return

    setOpen(false)
    setError('')
  }

  function resetForm() {
    setLeadId('')
    setDate('')
    setTime('')
    setNotes('')
    setError('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')

    if (!leadId) {
      setError('Selecione um lead.')
      return
    }

    if (!date) {
      setError('Informe a data do compromisso.')
      return
    }

    if (!time) {
      setError('Informe o horário do compromisso.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error(
        'Erro ao buscar usuário:',
        JSON.stringify(userError, null, 2)
      )

      setError(
        userError.message ||
          'Não foi possível identificar o usuário.'
      )

      setLoading(false)
      return
    }

    if (!user) {
      setError('Usuário não autenticado.')
      setLoading(false)
      return
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

    if (membershipError) {
      console.error(
        'Erro ao buscar organização:',
        JSON.stringify(
          membershipError,
          null,
          2
        )
      )

      setError(
        membershipError.message ||
          'Não foi possível identificar a organização.'
      )

      setLoading(false)
      return
    }

    if (!membership?.organization_id) {
      setError(
        'Usuário não está vinculado a uma organização.'
      )

      setLoading(false)
      return
    }

    const scheduledAt = new Date(
      `${date}T${time}:00`
    ).toISOString()

    const { error: insertError } =
      await supabase
        .from('appointments')
        .insert({
          organization_id:
            membership.organization_id,
          lead_id: leadId,
          scheduled_at: scheduledAt,
          status: 'scheduled',
          notes: notes.trim() || null,
        })

    if (insertError) {
      console.error(
        'Erro ao criar compromisso:',
        JSON.stringify(
          insertError,
          null,
          2
        )
      )

      setError(
        insertError.message ||
          'Não foi possível criar o compromisso.'
      )

      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    resetForm()

    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:translate-y-0"
      >
        Novo compromisso
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
                  Novo compromisso
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Agende um compromisso vinculado a um lead.
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

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >
              <div>
                <label
                  htmlFor="appointment-lead"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Lead
                </label>

                <select
                  id="appointment-lead"
                  value={leadId}
                  onChange={(event) =>
                    setLeadId(event.target.value)
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

                {leads.length === 0 && (
                  <p className="mt-2 text-xs text-gray-400">
                    Nenhum lead disponível para agendamento.
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="appointment-date"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                  >
                    Data
                  </label>

                  <input
                    id="appointment-date"
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
                    htmlFor="appointment-time"
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                  >
                    Horário
                  </label>

                  <input
                    id="appointment-time"
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
                  htmlFor="appointment-notes"
                  className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
                >
                  Observações
                </label>

                <textarea
                  id="appointment-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  disabled={loading}
                  rows={4}
                  placeholder="Ex.: Reunião para apresentação da proposta..."
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
                  type="submit"
                  disabled={
                    loading ||
                    leads.length === 0
                  }
                  className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Agendando...'
                    : 'Agendar compromisso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}