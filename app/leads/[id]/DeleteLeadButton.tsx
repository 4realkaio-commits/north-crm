'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLead } from '@/app/leads/delete-action'

type DeleteLeadButtonProps = {
  leadId: string
}

export default function DeleteLeadButton({
  leadId,
}: DeleteLeadButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    console.log('DELETE: botão clicado')
    console.log('DELETE: leadId:', leadId)

    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este lead?'
    )

    console.log('DELETE: confirmação:', confirmed)

    if (!confirmed) {
      return
    }

    setLoading(true)

    try {
      const result = await deleteLead(leadId)

      console.log('DELETE: resultado:', result)

      if (!result.success) {
        window.alert(
          result.error || 'Não foi possível excluir o lead.'
        )
        setLoading(false)
        return
      }

      console.log('DELETE: sucesso')

      router.push('/leads')
    } catch (error) {
      console.error('DELETE: erro:', error)

      window.alert(
        'Ocorreu um erro ao tentar excluir o lead.'
      )

      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}