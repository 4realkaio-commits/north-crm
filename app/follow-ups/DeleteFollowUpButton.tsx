'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteFollowUp } from './delete-action'

type DeleteFollowUpButtonProps = {
  followUpId: string
}

export default function DeleteFollowUpButton({
  followUpId,
}: DeleteFollowUpButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este follow-up?'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    const result = await deleteFollowUp(followUpId)

    if (!result.success) {
      alert(
        result.error ||
          'Não foi possível excluir o follow-up.'
      )
      setDeleting(false)
      return
    }

    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}