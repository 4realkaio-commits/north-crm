'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFollowUp } from './action'

type Lead = {
  id: string
  name: string
}

type NewFollowUpFormProps = {
  leads: Lead[]
  onSuccess?: () => void
}

export default function NewFollowUpForm({
  leads,
  onSuccess,
}: NewFollowUpFormProps) {
  const router = useRouter()

  const [leadId, setLeadId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [type, setType] = useState('Ligação')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')
    setLoading(true)

    const result = await createFollowUp({
      leadId,
      scheduledAt,
      type,
      note,
    })

    if (!result.success) {
      setError(
        result.error || 'Não foi possível criar o follow-up.'
      )

      setLoading(false)
      return
    }

    setLeadId('')
    setScheduledAt('')
    setType('Ligação')
    setNote('')
    setLoading(false)

    onSuccess?.()
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Novo follow-up
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Agende o próximo contato com um lead.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">
            {error}
          </p>
        </div>
      )}

      <div className="grid gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Lead
          </label>

          <select
            value={leadId}
            onChange={(event) => setLeadId(event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Data e horário
            </label>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) =>
                setScheduledAt(event.target.value)
              }
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tipo
            </label>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
            >
              <option value="Ligação">
                Ligação
              </option>

              <option value="WhatsApp">
                WhatsApp
              </option>

              <option value="E-mail">
                E-mail
              </option>

              <option value="Reunião">
                Reunião
              </option>

              <option value="Outro">
                Outro
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Observação
          </label>

          <textarea
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            rows={4}
            placeholder="Ex.: Retornar após envio da proposta..."
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Criando...'
            : 'Criar follow-up'}
        </button>
      </div>
    </form>
  )
}