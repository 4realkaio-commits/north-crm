'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type UpdateFollowUpButtonProps = {
  followUpId: string
}

export default function UpdateFollowUpButton({
  followUpId,
}: UpdateFollowUpButtonProps) {
  const router = useRouter()

  const [loading, setLoading] = useState<
    'completed' | 'canceled' | null
  >(null)

  const [error, setError] = useState('')

  async function updateStatus(
    status: 'completed' | 'canceled'
  ) {
    setError('')
    setLoading(status)

    const supabase = createClient()

    const updateData =
      status === 'completed'
        ? {
            status: 'completed',
            completed_at: new Date().toISOString(),
          }
        : {
            status: 'canceled',
          }

    const { error: updateError } = await supabase
      .from('follow_ups')
      .update(updateData)
      .eq('id', followUpId)

    if (updateError) {
      console.error(
        'Erro ao atualizar follow-up:',
        JSON.stringify(updateError, null, 2)
      )

      setError(
        updateError.message ||
          'Não foi possível atualizar o follow-up.'
      )

      setLoading(null)
      return
    }

    setLoading(null)

    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => updateStatus('completed')}
        disabled={loading !== null}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === 'completed'
          ? 'Concluindo...'
          : 'Concluir'}
      </button>

      <button
        type="button"
        onClick={() => updateStatus('canceled')}
        disabled={loading !== null}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-400 transition hover:border-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === 'canceled'
          ? 'Cancelando...'
          : 'Cancelar'}
      </button>

      {error && (
        <p className="ml-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}