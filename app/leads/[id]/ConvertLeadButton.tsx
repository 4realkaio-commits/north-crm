'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ConvertLeadButtonProps = {
  leadId: string
  potentialValue: number | null
}

export default function ConvertLeadButton({
  leadId,
  potentialValue,
}: ConvertLeadButtonProps) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(
    potentialValue !== null
      ? String(potentialValue)
      : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setError('')

    if (!value && potentialValue !== null) {
      setValue(String(potentialValue))
    }

    setOpen(true)
  }

  function handleClose() {
    if (loading) return

    setOpen(false)
    setError('')
  }

  async function handleConvert() {
    setError('')

    const numericValue = Number(
      value.replace(',', '.')
    )

    if (!value.trim()) {
      setError('Informe o valor da venda.')
      return
    }

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError('Informe um valor válido.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error: rpcError } = await supabase.rpc(
      'convert_lead_to_client',
      {
        p_lead_id: leadId,
        p_converted_value: numericValue,
      }
    )

    if (rpcError) {
      console.error(
        'Erro ao converter lead:',
        JSON.stringify(rpcError, null, 2)
      )

      setError(
        rpcError.message ||
          'Não foi possível converter o lead.'
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
        onClick={handleOpen}
        className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Converter em cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Conversão
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-gray-950">
                  Converter lead
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Informe o valor final pelo qual a venda foi fechada.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-xl leading-none text-gray-300 transition hover:text-black disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-8">
              <label
                htmlFor="converted-value"
                className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400"
              >
                Valor da venda
              </label>

              <div className="mt-2 flex items-center border-b border-gray-300 transition-colors focus-within:border-black">
                <span className="text-sm font-medium text-gray-500">
                  R$
                </span>

                <input
                  id="converted-value"
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) =>
                    setValue(event.target.value)
                  }
                  placeholder="0,00"
                  disabled={loading}
                  className="w-full bg-transparent px-2 py-3 text-lg font-medium text-gray-900 outline-none placeholder:text-gray-300 disabled:opacity-50"
                />
              </div>

              {potentialValue !== null && (
                <p className="mt-3 text-xs text-gray-400">
                  Valor potencial do lead:{' '}
                  <span className="font-medium text-gray-600">
                    R${' '}
                    {Number(
                      potentialValue
                    ).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
              )}

              {error && (
                <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-medium text-red-600">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-black disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConvert}
                disabled={loading}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Convertendo...'
                  : 'Confirmar conversão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}