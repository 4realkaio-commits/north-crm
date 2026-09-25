import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ScriptPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ScriptPage({
  params,
}: ScriptPageProps) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

  if (membershipError || !membership) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Organização não encontrada
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Não foi possível identificar a organização do usuário.
        </p>
      </div>
    )
  }

  const { data: script, error: scriptError } =
    await supabase
      .from('scripts')
      .select(
        'id, name, content, variables, created_at, updated_at'
      )
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .is('deleted_at', null)
      .maybeSingle()

  if (scriptError) {
    return (
      <div className="border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">
          Erro ao carregar script
        </h1>

        <pre className="mt-4 overflow-auto text-sm text-red-600">
          {JSON.stringify(scriptError, null, 2)}
        </pre>
      </div>
    )
  }

  if (!script) {
    notFound()
  }

  const variables = Array.isArray(script.variables)
    ? script.variables.filter(
        (variable): variable is string =>
          typeof variable === 'string'
      )
    : []

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-10">
        <Link
          href="/scripts"
          className="text-xs font-medium text-gray-400 transition hover:text-black"
        >
          ← Voltar para scripts
        </Link>

        <div className="mt-6 flex items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-black" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                Script comercial
              </span>
            </div>

            <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
              {script.name}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Visualização e gerenciamento do script.
            </p>
          </div>

          <Link
            href={`/scripts/${script.id}/editar`}
            className="shrink-0 bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Editar script
          </Link>
        </div>
      </div>

      <div className="grid gap-px border border-gray-200 bg-gray-200 lg:grid-cols-[1fr_280px]">
        <section className="bg-white p-6 lg:p-8">
          <div className="flex items-end justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Conteúdo
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-gray-950">
                Script
              </h2>
            </div>

            <span className="text-right text-[11px] text-gray-400">
              Atualizado em{' '}
              {new Date(
                script.updated_at
              ).toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="mt-6 whitespace-pre-wrap border border-gray-200 bg-gray-50/50 p-6 text-sm leading-7 text-gray-700">
            {script.content}
          </div>
        </section>

        <aside className="bg-white p-6 lg:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Variáveis
            </p>

            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-gray-950">
              Campos dinâmicos
            </h2>

            <p className="mt-2 text-xs leading-5 text-gray-400">
              Variáveis podem ser substituídas pelos dados do lead
              durante a utilização do script.
            </p>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            {variables.length === 0 ? (
              <div>
                <p className="text-sm text-gray-400">
                  Este script não possui variáveis.
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-400">
                  Use {'{{nome}}'}, {'{{empresa}}'} ou
                  {' {{cidade}}'} no conteúdo.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {variables.map((variable) => (
                  <div
                    key={variable}
                    className="flex items-center justify-between border border-gray-200 px-3 py-2.5"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {`{{${variable}}}`}
                    </span>

                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-300">
                      variável
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Variáveis
              </span>

              <span className="text-sm font-semibold text-gray-950">
                {variables.length}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                Criado em
              </span>

              <span className="text-xs text-gray-500">
                {new Date(
                  script.created_at
                ).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}