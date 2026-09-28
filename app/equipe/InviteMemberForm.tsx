'use client'

import { useState } from 'react'
import { inviteMember } from './invite-action'

type MemberRole =
  | 'member'
  | 'manager'
  | 'admin'

type InviteMemberFormProps = {
  currentRole:
    | 'owner'
    | 'admin'
    | 'manager'
    | 'member'
}

export default function InviteMemberForm({
  currentRole,
}: InviteMemberFormProps) {
  const availableRoles: MemberRole[] =
    currentRole === 'owner'
      ? ['member', 'manager', 'admin']
      : currentRole === 'admin'
        ? ['member', 'manager']
        : currentRole === 'manager'
          ? ['member']
          : []

  const [email, setEmail] = useState('')

  const [role, setRole] =
    useState<MemberRole>(
      availableRoles[0] || 'member'
    )

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const [inviteUrl, setInviteUrl] =
    useState('')

  const [copied, setCopied] =
    useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage('')
    setError('')
    setInviteUrl('')
    setCopied(false)

    if (!email.trim()) {
      setError('Informe o e-mail.')
      return
    }

    if (availableRoles.length === 0) {
      setError(
        'Você não tem permissão para enviar convites.'
      )
      return
    }

    if (
      !availableRoles.includes(role)
    ) {
      setError(
        'Você não pode convidar um usuário com essa função.'
      )
      return
    }

    setLoading(true)

    const result =
      await inviteMember({
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

    setRole(
      availableRoles[0] ||
        'member'
    )

    setInviteUrl(
      result.inviteUrl || ''
    )

    setMessage(
      'Convite criado com sucesso.'
    )
  }

  async function handleCopy() {
    if (!inviteUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        inviteUrl
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError(
        'Não foi possível copiar o link. Copie manualmente.'
      )
    }
  }

  if (availableRoles.length === 0) {
    return null
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
            setEmail(
              event.target.value
            )
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
              event.target.value as MemberRole
            )
          }
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
        >
          {availableRoles.includes(
            'member'
          ) && (
            <option value="member">
              Membro
            </option>
          )}

          {availableRoles.includes(
            'manager'
          ) && (
            <option value="manager">
              Gerente
            </option>
          )}

          {availableRoles.includes(
            'admin'
          ) && (
            <option value="admin">
              Administrador
            </option>
          )}
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

      {inviteUrl && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            Link do convite
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 outline-none"
            />

            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {copied
                ? 'Copiado'
                : 'Copiar link'}
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-400">
            Envie este link pelo WhatsApp, Discord ou outro canal.
          </p>
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