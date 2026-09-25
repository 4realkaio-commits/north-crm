'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type MFAFactor = {
  id: string
  friendly_name?: string | null
  factor_type: string
  status: string
}

type MFAEnrollData = {
  id: string
  type: string
  totp?: {
    qr_code: string
    secret: string
    uri: string
  }
}

export default function MFAForm() {
  const [factor, setFactor] = useState<MFAFactor | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadMFA()
  }, [])

  async function loadMFA() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: listError } =
      await supabase.auth.mfa.listFactors()

    if (listError) {
      setError(listError.message)
      setLoading(false)
      return
    }

    const verifiedFactor =
      data?.totp?.find(
        (item) => item.status === 'verified'
      ) || null

    setFactor(verifiedFactor)
    setLoading(false)
  }

  async function startEnrollment() {
    setProcessing(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    const { data, error: enrollError } =
      await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'NORTH CRM',
      })

    if (enrollError) {
      setError(enrollError.message)
      setProcessing(false)
      return
    }

    const enrollment = data as MFAEnrollData

    setFactorId(enrollment.id)
    setQrCode(enrollment.totp?.qr_code || '')
    setSecret(enrollment.totp?.secret || '')
    setProcessing(false)
  }

  async function verifyEnrollment() {
    if (!factorId) {
      setError('Não foi possível identificar o fator 2FA.')
      return
    }

    if (!code || code.length !== 6) {
      setError('Digite o código de 6 dígitos do aplicativo autenticador.')
      return
    }

    setProcessing(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId,
      })

    if (challengeError) {
      setError(challengeError.message)
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

    setFactor({
      id: factorId,
      factor_type: 'totp',
      status: 'verified',
      friendly_name: 'NORTH CRM',
    })

    setQrCode('')
    setSecret('')
    setCode('')
    setFactorId('')
    setMessage('2FA ativado com sucesso.')
    setProcessing(false)
  }

  async function disableMFA() {
    if (!factor?.id) return

    const confirmed = window.confirm(
      'Tem certeza que deseja desativar a autenticação em dois fatores?'
    )

    if (!confirmed) return

    setProcessing(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    const { error: unenrollError } =
      await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      })

    if (unenrollError) {
      setError(unenrollError.message)
      setProcessing(false)
      return
    }

    setFactor(null)
    setMessage('2FA desativado com sucesso.')
    setProcessing(false)
  }

  if (loading) {
    return (
      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">
            Autenticação em dois fatores
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Carregando configuração de segurança...
          </p>
        </div>

        <div className="p-6">
          <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Autenticação em dois fatores
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Adicione uma camada extra de segurança usando um aplicativo autenticador.
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              factor
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {factor ? 'Ativado' : 'Desativado'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {!factor && !qrCode && (
          <div>
            <p className="max-w-2xl text-sm leading-6 text-gray-600">
              Use Google Authenticator, Authy, 1Password ou outro aplicativo compatível com TOTP.
            </p>

            <button
              type="button"
              onClick={startEnrollment}
              disabled={processing}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? 'Preparando...' : 'Ativar 2FA'}
            </button>
          </div>
        )}

        {!factor && qrCode && (
          <div className="max-w-xl">
            <h3 className="text-sm font-semibold text-gray-900">
              Configure seu aplicativo autenticador
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Escaneie o QR Code abaixo com seu aplicativo autenticador.
            </p>

            <div className="mt-6 flex justify-center rounded-2xl border bg-gray-50 p-6">
              <img
                src={qrCode}
                alt="QR Code para ativação do 2FA"
                className="h-56 w-56 rounded-xl bg-white p-2"
              />
            </div>

            {secret && (
              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Chave manual
                </p>

                <div className="mt-2 break-all rounded-xl border bg-gray-50 px-4 py-3 font-mono text-sm text-gray-700">
                  {secret}
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Use essa chave somente se não conseguir escanear o QR Code.
                </p>
              </div>
            )}

            <div className="mt-6">
              <label
                htmlFor="mfa-code"
                className="text-sm font-medium text-gray-700"
              >
                Código de verificação
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
                disabled={processing}
                className="mt-2 w-full max-w-xs rounded-xl border border-gray-200 px-4 py-3 text-center text-lg tracking-[0.3em] outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={verifyEnrollment}
                disabled={processing || code.length !== 6}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? 'Verificando...' : 'Confirmar 2FA'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setQrCode('')
                  setSecret('')
                  setCode('')
                  setFactorId('')
                  setError('')
                }}
                disabled={processing}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {factor && (
          <div>
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-700">
                A autenticação em dois fatores está ativada nesta conta.
              </p>

              <p className="mt-1 text-xs text-green-600">
                Seu aplicativo autenticador está configurado para gerar os códigos de acesso.
              </p>
            </div>

            <button
              type="button"
              onClick={disableMFA}
              disabled={processing}
              className="mt-5 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? 'Desativando...' : 'Desativar 2FA'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}
      </div>
    </section>
  )
}