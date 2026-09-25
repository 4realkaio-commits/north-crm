'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteScript } from './delete-action'

type DeleteScriptButtonProps = {
  scriptId: string
}

export default function DeleteScriptButton({
  scriptId,
}: DeleteScriptButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este script?'
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    const result = await deleteScript(scriptId)

    if (!result.success) {
      alert(
        result.error ||
          'Não foi possível excluir o script.'
      )
      setDeleting(false)
      return
    }

    router.push('/scripts')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? 'Excluindo...' : 'Excluir script'}
    </button>
  )
}
