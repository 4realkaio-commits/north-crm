'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type CancelSaleButtonProps = {
  clientId: string
}

export default function CancelSaleButton({
  clientId,
}: CancelSaleButtonProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function cancelSale() {
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: rpcError } = await supabase.rpc(
      'cancel_client_conversion',
      {
        p_client_id: clientId,
      }
    )

    if (rpcError) {
      console.error(
        'Erro ao cancelar venda:',
        JSON.stringify(rpcError, null, 2)
      )

      setError(
        rpcError.message ||
          'Não foi possível cancelar a venda.'
      )

      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)

    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError('')
          setOpen(true)
        }}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        Cancelar venda
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Cancelar venda
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">
                Cancelar esta venda?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                A venda será removida dos indicadores financeiros
                e o lead voltará para a etapa anterior do funil.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-600">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={cancelSale}
                disabled={loading}
                className="rounded-lg bg-black px-4 py-2.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Cancelando...'
                  : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}