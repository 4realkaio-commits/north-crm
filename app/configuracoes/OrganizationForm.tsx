'use client'

import { useState } from 'react'
import { updateOrganization } from './action'

type OrganizationFormProps = {
  organizationId: string
  initialName: string
  initialEmail: string
  initialPhone: string
  initialTimezone: string
}

const timezones = [
  'America/Sao_Paulo',
  'America/Recife',
  'America/Fortaleza',
  'America/Belem',
  'America/Manaus',
  'America/Rio_Branco',
  'America/Noronha',
]

export default function OrganizationForm({
  organizationId,
  initialName,
  initialEmail,
  initialPhone,
  initialTimezone,
}: OrganizationFormProps) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(initialPhone)
  const [timezone, setTimezone] = useState(initialTimezone)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    const result = await updateOrganization(
      organizationId,
      {
        name,
        email,
        phone,
        timezone,
      }
    )

    setLoading(false)

    if (!result.success) {
      setError(
        result.error ||
          'Não foi possível salvar as alterações.'
      )
      return
    }

    setMessage('Configurações salvas com sucesso.')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white shadow-sm"
    >
      <div className="border-b px-6 py-5">
        <h2 className="text-base font-semibold text-gray-900">
          Editar organização
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Atualize as informações principais da sua empresa.
        </p>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="text-sm font-medium text-gray-700"
          >
            Nome da organização
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700"
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
            placeholder="empresa@email.com"
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="text-sm font-medium text-gray-700"
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
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="timezone"
            className="text-sm font-medium text-gray-700"
          >
            Fuso horário
          </label>

          <select
            id="timezone"
            value={timezone}
            onChange={(event) =>
              setTimezone(event.target.value)
            }
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
          >
            {timezones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-gray-400">
            Os horários do CRM serão exibidos de acordo com
            este fuso.
          </p>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mx-6 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="flex justify-end border-t px-6 py-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}