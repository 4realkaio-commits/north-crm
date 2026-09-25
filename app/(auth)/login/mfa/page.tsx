'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MFALoginPage() {
  const router = useRouter()

  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFactor()
  }, [])

  async function loadFactor() {
    const supabase = createClient()

    const { data, error: factorsError } =
      await supabase.auth.mfa.listFactors()

    if (factorsError) {
      setError(
        'Não foi possível carregar a autenticação em dois fatores.'
      )
      setLoading(false)
      return
    }

    const verifiedFactor =
      data?.totp?.find(
        (factor) => factor.status === 'verified'
      ) || null

    if (!verifiedFactor) {
      router.replace('/login')
      return
    }

    setFactorId(verifiedFactor.id)
    setLoading(false)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!factorId) {
      setError('Fator de autenticação não encontrado.')
      return
    }

    if (code.length !== 6) {
      setError('Digite o código de 6 dígitos.')
      return
    }

    setProcessing(true)
    setError('')

    const supabase = createClient()

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId,
      })

    if (challengeError) {
      setError(
        'Não foi possível iniciar a verificação do código.'
      )
      setProcessing(false)
      return
    }

    const { error: verifyError } =
      await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      })

    if (verifyError) {
      setError('Código inválido. Confira o código no aplicativo autenticador.')
      setProcessing(false)
      return
    }

    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-sm text-gray-500">
          Carregando...
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            NORTH CRM
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Confirme sua autenticação em dois fatores
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-white p-8 shadow-sm"
        >
          <div>
            <label
              htmlFor="mfa-code"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Código de autenticação
            </label>

            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              required
              autoFocus
              disabled={processing}
              className="w-full rounded-lg border px-4 py-4 text-center text-2xl tracking-[0.4em] outline-none transition focus:border-black disabled:bg-gray-50"
            />

            <p className="mt-3 text-center text-xs text-gray-400">
              Abra seu aplicativo autenticador e digite o código de 6 dígitos.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={processing || code.length !== 6}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Verificando...' : 'Confirmar código'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.replace('/login')}
              disabled={processing}
              className="text-sm text-gray-500 hover:text-black"
            >
              Voltar para o login
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}