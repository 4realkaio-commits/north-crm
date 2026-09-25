'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import DeleteScriptButton from './DeleteScriptButton'

type Script = {
  id: string
  name: string
  content: string
}

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

export default function EditarScriptPage() {
  const router = useRouter()
  const params = useParams()

  const scriptId = params.id as string

  const [script, setScript] = useState<Script | null>(null)
  const [organizationId, setOrganizationId] = useState('')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const variables = extractVariables(content)

  useEffect(() => {
    async function loadScript() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
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
        setLoading(false)
        return
      }

      setOrganizationId(membership.organization_id)

      const { data, error: scriptError } =
        await supabase
          .from('scripts')
          .select('id, name, content')
          .eq('id', scriptId)
          .eq('organization_id', membership.organization_id)
          .is('deleted_at', null)
          .maybeSingle()

      if (scriptError) {
        setError(scriptError.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Script não encontrado.')
        setLoading(false)
        return
      }

      setScript(data)
      setName(data.name)
      setContent(data.content)
      setLoading(false)
    }

    loadScript()
  }, [router, scriptId])

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

    if (!organizationId) {
      setError('Organização do usuário não encontrada.')
      return
    }

    setSaving(true)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('scripts')
      .update({
        name: name.trim(),
        content: content.trim(),
        variables,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scriptId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    if (updateError) {
      setError(
        updateError.message ||
          'Não foi possível atualizar o script.'
      )
      setSaving(false)
      return
    }

    router.push(`/scripts/${scriptId}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-400">
            Carregando script...
          </p>
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700">
            Não foi possível carregar o script
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {error || 'Script não encontrado.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-10">
        <button
          type="button"
          onClick={() =>
            router.push(`/scripts/${scriptId}`)
          }
          className="mb-6 text-xs font-medium text-gray-400 transition hover:text-black"
        >
          ← Voltar para o script
        </button>

        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-7 bg-black" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
            Script comercial
          </span>
        </div>

        <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
          Editar script
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Atualize o nome, conteúdo e variáveis do seu script.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-px border border-gray-200 bg-gray-200 lg:grid-cols-[1fr_280px]"
      >
        <div className="bg-white">
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
              rows={18}
              className="mt-4 w-full resize-y border border-gray-200 bg-gray-50/40 px-4 py-4 text-sm leading-7 text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-gray-400 focus:bg-white"
            />

            {error && (
              <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
              <DeleteScriptButton scriptId={scriptId} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/scripts/${scriptId}`)
                  }
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
                  {saving
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="bg-white p-6 lg:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Variáveis
          </p>

          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-gray-950">
            Campos dinâmicos
          </h2>

          <p className="mt-2 text-xs leading-5 text-gray-400">
            As variáveis são atualizadas automaticamente conforme
            você altera o conteúdo.
          </p>

          <div className="mt-6 border-t border-gray-100 pt-5">
            {variables.length === 0 ? (
              <p className="text-sm leading-6 text-gray-400">
                Nenhuma variável detectada.
              </p>
            ) : (
              <div className="space-y-2">
                {variables.map((variable) => (
                  <div
                    key={variable}
                    className="border border-gray-200 px-3 py-2.5"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {`{{${variable}}}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Como usar
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-400">
              Escreva uma variável entre duas chaves.
              Exemplo: {'{{nome}}'}.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}