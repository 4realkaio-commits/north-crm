'use client'

import { useState } from 'react'
import { changeOrganizationMemberRole } from './change-role-action'

type ChangeRoleButtonProps = {
  organizationId: string
  userId: string
  currentRole: 'member' | 'manager' | 'admin'
  memberName: string
}

export default function ChangeRoleButton({
  organizationId,
  userId,
  currentRole,
  memberName,
}: ChangeRoleButtonProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(
    newRole: 'member' | 'manager' | 'admin'
  ) {
    if (newRole === role) {
      return
    }

    const confirmed = window.confirm(
      `Alterar ${memberName} para ${getRoleLabel(newRole)}?`
    )

    if (!confirmed) {
      return
    }

    setLoading(true)
    setError('')

    const result =
      await changeOrganizationMemberRole(
        organizationId,
        userId,
        newRole
      )

    setLoading(false)

    if (!result.success) {
      setError(
        result.error ||
          'Não foi possível alterar a função.'
      )
      return
    }

    setRole(newRole)
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={role}
        onChange={(event) =>
          handleChange(
            event.target.value as
              | 'member'
              | 'manager'
              | 'admin'
          )
        }
        disabled={loading}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="member">Membro</option>
        <option value="manager">Gerente</option>
        <option value="admin">Administrador</option>
      </select>

      {loading && (
        <span className="text-xs text-gray-500">
          Salvando...
        </span>
      )}

      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}

function getRoleLabel(
  role: 'member' | 'manager' | 'admin'
) {
  const labels = {
    member: 'Membro',
    manager: 'Gerente',
    admin: 'Administrador',
  }

  return labels[role]
}