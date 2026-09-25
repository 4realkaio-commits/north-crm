'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DeleteAppointmentButtonProps = {
  appointmentId: string
}

export default function DeleteAppointmentButton({
  appointmentId,
}: DeleteAppointmentButtonProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este compromisso?'
    )

    if (!confirmed) return

    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('appointments')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (deleteError) {
      console.error(
        'Erro ao excluir compromisso:',
        JSON.stringify(deleteError, null, 2)
      )

      setError(
        deleteError.message ||
          'Não foi possível excluir o compromisso.'
      )

      setLoading(false)
      return
    }

    setLoading(false)

    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Excluindo...' : 'Excluir'}
      </button>

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}