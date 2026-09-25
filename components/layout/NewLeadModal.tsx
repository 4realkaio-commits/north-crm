'use client'

import { FormEvent, useState } from 'react'
import { createLead } from '../../app/leads/action'

type NewLeadModalProps = {
  onClose: () => void
}

export default function NewLeadModal({
  onClose,
}: NewLeadModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [potentialValue, setPotentialValue] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!name.trim()) {
      setErrorMessage('Informe o nome do lead.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const result = await createLead({
      name,
      phone,
      email,
      potentialValue,
      notes,
    })

    if (!result.success) {
      setErrorMessage(
        result.error || 'Não foi possível cadastrar o lead.'
      )
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Novo lead
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Cadastre um novo contato comercial.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
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
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Nome do lead"
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            />
          </div>

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
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="(13) 99999-9999"
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
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="email@exemplo.com"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            />
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
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Observações sobre o lead..."
              rows={4}
              disabled={loading}
              className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Cadastrando...' : 'Cadastrar lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}