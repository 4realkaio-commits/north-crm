'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLead } from '@/app/leads/edit-action'

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  potential_value: number | null
  notes: string | null
}

type EditLeadFormProps = {
  lead: Lead
}

export default function EditLeadForm({
  lead,
}: EditLeadFormProps) {
  const router = useRouter()

  const [name, setName] = useState(lead.name)
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [status, setStatus] = useState(lead.status)
  const [potentialValue, setPotentialValue] = useState(
    lead.potential_value !== null
      ? String(lead.potential_value).replace('.', ',')
      : ''
  )
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    console.log('EDIT FORM: submit executado')

    setLoading(true)
    setErrorMessage('')

    try {
      const result = await updateLead({
        id: lead.id,
        name,
        phone,
        email,
        status,
        potentialValue,
        notes,
      })

      console.log('EDIT FORM: resultado', result)

      if (!result.success) {
        setErrorMessage(
          result.error || 'Não foi possível atualizar o lead.'
        )
        setLoading(false)
        return
      }

      router.push(`/leads/${lead.id}`)
      router.refresh()
    } catch (error) {
      console.error('EDIT FORM: erro', error)

      setErrorMessage(
        'Ocorreu um erro ao tentar salvar as alterações.'
      )

      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="space-y-6">

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nome *
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={loading}
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Telefone
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            />
          </div>

        </div>

        <div className="grid gap-6 sm:grid-cols-2">

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            >
              <option value="novo">
                Novo
              </option>

              <option value="em_andamento">
                Em andamento
              </option>

              <option value="convertido">
                Convertido
              </option>

              <option value="perdido">
                Perdido
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="potentialValue"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Valor potencial
            </label>

            <input
              id="potentialValue"
              type="text"
              inputMode="decimal"
              value={potentialValue}
              onChange={(event) =>
                setPotentialValue(event.target.value)
              }
              placeholder="0,00"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            />
          </div>

        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Observações
          </label>

          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
            disabled={loading}
            className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
          />
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t pt-6">

          <button
            type="button"
            onClick={() => router.push(`/leads/${lead.id}`)}
            disabled={loading}
            className="rounded-lg border px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>

        </div>

      </div>
    </form>
  )
}