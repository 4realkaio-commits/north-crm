'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function extractVariables(content: string) {
  const matches = content.match(/{{\s*([^{}]+?)\s*}}/g) ?? []

  const variables = matches
    .map((match) =>
      match
        .replace(/{{|}}/g, '')
        .trim()
    )
    .filter(Boolean)

  return [...new Set(variables)]
}

export default function NovoScriptPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const variables = extractVariables(content)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')

    if (!name.trim()) {
      setError('Informe o nome do script.')
      return
    }

    if (!content.trim()) {
      setError('Informe o conteúdo do script.')
      return
    }

    setSaving(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado.')
      setSaving(false)
      return
    }

    const { data: membership, error: membershipError } =
      await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (membershipError || !membership) {
      setError('Organização do usuário não encontrada.')
      setSaving(false)
      return
    }

    const { data: script, error: scriptError } =
      await supabase
        .from('scripts')
        .insert({
          organization_id: membership.organization_id,
          name: name.trim(),
          content: content.trim(),
          variables,
        })
        .select('id')
        .single()

    if (scriptError || !script) {
      setError(
        scriptError?.message ||
          'Não foi possível criar o script.'
      )
      setSaving(false)
      return
    }

    router.push(`/scripts/${script.id}`)
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 text-xs font-medium text-gray-400 transition hover:text-black"
        >
          ← Voltar
        </button>

        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-7 bg-black" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
            NORTH CRM
          </span>
        </div>

        <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
          Novo script
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Crie um script para sua operação comercial.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 px-6 py-6">
          <label
            htmlFor="name"
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400"
          >
            Nome do script
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ex.: Primeiro contato"
            className="mt-3 w-full border-b border-gray-200 bg-transparent px-0 py-3 text-base font-medium text-gray-950 outline-none transition placeholder:text-gray-300 focus:border-black"
          />
        </div>

        <div className="px-6 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <label
                htmlFor="content"
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400"
              >
                Conteúdo
              </label>

              <p className="mt-2 text-xs text-gray-400">
                Use {'{{variavel}}'} para criar campos dinâmicos.
              </p>
            </div>

            {variables.length > 0 && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                {variables.length}{' '}
                {variables.length === 1
                  ? 'variável'
                  : 'variáveis'}
              </span>
            )}
          </div>

          <textarea
            id="content"
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
            placeholder={`Ex.:

Olá, {{nome}}. Tudo bem?

Aqui é da {{empresa}}. Vi que você demonstrou interesse e gostaria de entender melhor o que você procura.`}
            rows={16}
            className="mt-4 w-full resize-y border border-gray-200 bg-gray-50/40 px-4 py-4 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-400 focus:bg-white"
          />

          {variables.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Variáveis detectadas
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <span
                    key={variable}
                    className="border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
                  >
                    {'{{'}
                    {variable}
                    {'}}'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-5">
          <p className="text-xs text-gray-400">
            {variables.length > 0
              ? 'As variáveis serão salvas automaticamente.'
              : 'Nenhuma variável detectada.'}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Criando...' : 'Criar script'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}