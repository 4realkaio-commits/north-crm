'use client'

import { useState } from 'react'
import { updateProfile } from './profile-action'

type ProfileFormProps = {
  userId: string
  initialFullName: string
  initialEmail: string
}

export default function ProfileForm({
  userId,
  initialFullName,
  initialEmail,
}: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName)
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

    const result = await updateProfile(
      userId,
      fullName
    )

    setLoading(false)

    if (!result.success) {
      setError(
        result.error ||
          'Não foi possível salvar o perfil.'
      )
      return
    }

    setMessage('Perfil atualizado com sucesso.')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white shadow-sm"
    >
      <div className="border-b px-6 py-5">
        <h2 className="text-base font-semibold text-gray-900">
          Meu perfil
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas informações pessoais no NORTH CRM.
        </p>
      </div>

      <div className="grid gap-6 p-6">
        <div>
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-gray-700"
          >
            Nome completo
          </label>

          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Seu nome"
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
            value={initialEmail}
            disabled
            className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none"
          />

          <p className="mt-2 text-xs text-gray-400">
            O e-mail da conta não pode ser alterado por aqui.
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
          {loading ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </div>
    </form>
  )
}