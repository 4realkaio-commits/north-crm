'use client'

import { useState } from 'react'
import { changePassword } from './password-action'

export default function PasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const result = await changePassword(newPassword)

    setLoading(false)

    if (!result.success) {
      setError(
        result.error ||
          'Não foi possível alterar a senha.'
      )
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setMessage('Senha alterada com sucesso.')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white shadow-sm"
    >
      <div className="border-b px-6 py-5">
        <h2 className="text-base font-semibold text-gray-900">
          Segurança
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Altere a senha utilizada para acessar sua conta.
        </p>
      </div>

      <div className="grid gap-6 p-6">
        <div>
          <label
            htmlFor="newPassword"
            className="text-sm font-medium text-gray-700"
          >
            Nova senha
          </label>

          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            placeholder="Digite uma nova senha"
            autoComplete="new-password"
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
          />

          <p className="mt-2 text-xs text-gray-400">
            A senha deve ter pelo menos 8 caracteres.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-gray-700"
          >
            Confirmar nova senha
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
          />
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
          disabled={
            loading ||
            !newPassword ||
            !confirmPassword
          }
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Alterando...' : 'Alterar senha'}
        </button>
      </div>
    </form>
  )
}