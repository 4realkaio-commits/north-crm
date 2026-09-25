'use client'

import { useState } from 'react'
import { inviteMember } from './invite-action'

export default function InviteMemberForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<
    'member' | 'manager' | 'admin'
  >('member')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage('')
    setError('')

    if (!email.trim()) {
      setError('Informe o e-mail.')
      return
    }

    setLoading(true)

    const result = await inviteMember({
      email,
      role,
    })

    setLoading(false)

    if (!result.success) {
      setError(
        result.error ||
          'Não foi possível criar o convite.'
      )
      return
    }

    setEmail('')
    setRole('member')
    setMessage('Convite criado com sucesso.')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Convidar membro
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Adicione uma pessoa à sua equipe.
        </p>
      </div>

      <div className="mt-6">
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
          placeholder="exemplo@email.com"
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="role"
          className="text-sm font-medium text-gray-700"
        >
          Função
        </label>

        <select
          id="role"
          value={role}
          onChange={(event) =>
            setRole(
              event.target.value as
                | 'member'
                | 'manager'
                | 'admin'
            )
          }
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
        >
          <option value="member">
            Membro
          </option>

          <option value="manager">
            Gerente
          </option>

          <option value="admin">
            Administrador
          </option>
        </select>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'Criando convite...'
            : 'Enviar convite'}
        </button>
      </div>
    </form>
  )
}