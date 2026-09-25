'use client'

import { useState } from 'react'
import { removeOrganizationMember } from './remove-member-action'

type RemoveMemberButtonProps = {
  organizationId: string
  userId: string
  memberName: string
}

export default function RemoveMemberButton({
  organizationId,
  userId,
  memberName,
}: RemoveMemberButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRemove() {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${memberName} da organização?`
    )

    if (!confirmed) {
      return
    }

    setLoading(true)
    setError('')

    const result = await removeOrganizationMember(
      organizationId,
      userId
    )

    setLoading(false)

    if (!result.success) {
      setError(
        result.error ||
          'Não foi possível remover o membro.'
      )
      return
    }

    window.location.reload()
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}

      <button
        type="button"
        onClick={handleRemove}
        disabled={loading}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Removendo...' : 'Remover'}
      </button>
    </div>
  )
}