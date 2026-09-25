'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (signInError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const {
      data: assuranceData,
      error: assuranceError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (assuranceError) {
      setError(
        'Não foi possível verificar a autenticação em dois fatores.'
      )
      setLoading(false)
      return
    }

    if (
      assuranceData.currentLevel === 'aal1' &&
      assuranceData.nextLevel === 'aal2'
    ) {
      window.location.href = '/login/mfa'
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            NORTH CRM
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Entre na sua conta para continuar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-white p-8 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center">
            <a
              href="/recuperar-senha"
              className="text-sm text-gray-500 hover:text-black"
            >
              Esqueci minha senha
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}