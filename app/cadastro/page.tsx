'use client'

import {
  FormEvent,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'

function createSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CadastroPage() {
  const [fullName, setFullName] =
    useState('')

  const [organizationName, setOrganizationName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    if (
      password !==
      confirmPassword
    ) {
      setError(
        'As senhas não coincidem.'
      )
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(
        'A senha precisa ter pelo menos 6 caracteres.'
      )
      setLoading(false)
      return
    }

    const supabase =
      createClient()

    const slug =
      createSlug(
        organizationName
      )

    if (!slug) {
      setError(
        'Informe um nome válido para a organização.'
      )
      setLoading(false)
      return
    }

    const {
      data,
      error: signUpError,
    } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name:
              fullName,
            organization_name:
              organizationName,
          },
        },
      })

    if (signUpError) {
      setError(
        signUpError.message
      )
      setLoading(false)
      return
    }

    if (!data.user) {
      setError(
        'Não foi possível criar sua conta.'
      )
      setLoading(false)
      return
    }

    /*
     * Confirmação de e-mail está
     * desativada no ambiente de teste.
     *
     * Portanto, esperamos receber
     * uma sessão imediatamente.
     */
    if (!data.session) {
      setError(
        'A conta foi criada, mas o Supabase não retornou uma sessão. Verifique se a confirmação de e-mail está realmente desativada.'
      )
      setLoading(false)
      return
    }

    const {
      error: organizationError,
    } =
      await supabase.rpc(
        'create_organization',
        {
          p_name:
            organizationName,
          p_slug:
            slug,
          p_timezone:
            'America/Sao_Paulo',
        }
      )

    if (organizationError) {
      setError(
        organizationError.message
      )
      setLoading(false)
      return
    }

    setSuccess(
      'Conta e organização criadas com sucesso. Entrando no NORTH CRM...'
    )

    window.location.href =
      '/dashboard'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            NORTH CRM
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Crie sua conta e comece sua operação.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-white p-8 shadow-sm"
        >
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium"
            >
              Seu nome
            </label>

            <input
              id="fullName"
              type="text"
              placeholder="Seu nome completo"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="organizationName"
              className="mb-2 block text-sm font-medium"
            >
              Nome da organização
            </label>

            <input
              id="organizationName"
              type="text"
              placeholder="Nome da sua empresa"
              value={
                organizationName
              }
              onChange={(event) =>
                setOrganizationName(
                  event.target.value
                )
              }
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
            />
          </div>

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
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
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
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
              disabled={loading}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-black disabled:bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirmar senha
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
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

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Criando conta...'
              : 'Criar conta'}
          </button>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-gray-500 hover:text-black"
            >
              Já tenho uma conta
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}