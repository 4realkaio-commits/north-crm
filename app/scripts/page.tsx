import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DuplicateScriptButton from './DuplicateScriptButton'

type Script = {
  id: string
  name: string
  content: string
  variables: unknown
  created_at: string
  updated_at: string
}

export default async function ScriptsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return (
      <div className="py-10">
        <p className="text-sm text-gray-500">
          Organização não encontrada.
        </p>
      </div>
    )
  }

  const organizationId = membership.organization_id

  const { data: scripts, error } = await supabase
    .from('scripts')
    .select(
      'id, name, content, variables, created_at, updated_at'
    )
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar scripts:', error)

    return (
      <div className="py-10">
        <p className="text-sm text-red-500">
          Não foi possível carregar os scripts.
        </p>
      </div>
    )
  }

  const scriptList: Script[] = scripts ?? []

  const totalScripts = scriptList.length

  const totalVariables = scriptList.reduce((total, script) => {
    if (!Array.isArray(script.variables)) {
      return total
    }

    return total + script.variables.length
  }, 0)

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 border-b border-gray-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
            Operação comercial
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950">
            Scripts
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
            Biblioteca de roteiros comerciais para padronizar
            abordagens, contatos e processos da equipe.
          </p>
        </div>

        <Link
          href="/scripts/novo"
          className="inline-flex items-center justify-center border border-black bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Novo script
        </Link>
      </section>

      <section className="grid grid-cols-1 border border-gray-200 bg-white md:grid-cols-2">
        <div className="border-b border-gray-200 p-6 md:border-b-0 md:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Biblioteca
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950">
            {totalScripts}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Scripts ativos
          </p>
        </div>

        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Variáveis
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950">
            {totalVariables}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Campos dinâmicos detectados
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              Biblioteca
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-gray-950">
              Seus scripts
            </h2>
          </div>

          <p className="text-xs text-gray-400">
            {totalScripts}{' '}
            {totalScripts === 1 ? 'script' : 'scripts'}
          </p>
        </div>

        {scriptList.length === 0 ? (
          <div className="border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-gray-700">
              Nenhum script cadastrado.
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Crie seu primeiro roteiro comercial.
            </p>

            <Link
              href="/scripts/novo"
              className="mt-5 inline-flex border border-black bg-black px-5 py-3 text-xs font-semibold text-white transition hover:bg-gray-800"
            >
              Criar primeiro script
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px border border-gray-200 bg-gray-200 md:grid-cols-2 xl:grid-cols-3">
            {scriptList.map((script) => {
              const variables = Array.isArray(script.variables)
                ? script.variables.filter(
                    (variable): variable is string =>
                      typeof variable === 'string'
                  )
                : []

              const preview =
                script.content.length > 140
                  ? `${script.content.slice(0, 140)}...`
                  : script.content

              const updatedAt = new Date(script.updated_at)

              const formattedDate =
                updatedAt.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })

              return (
                <div
                  key={script.id}
                  className="group flex min-h-[270px] flex-col bg-white transition hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Script
                      </p>

                      <h3 className="mt-2 truncate text-lg font-semibold tracking-[-0.025em] text-gray-950">
                        {script.name}
                      </h3>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <DuplicateScriptButton
                        scriptId={script.id}
                      />

                      <Link
                        href={`/scripts/${script.id}`}
                        className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-400 transition hover:border-black hover:bg-black hover:text-white"
                        title="Abrir script"
                      >
                        →
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-gray-500">
                      {preview || 'Script sem conteúdo.'}
                    </p>

                    <div className="mt-auto pt-6">
                      <div className="flex flex-wrap gap-2">
                        {variables.length > 0 ? (
                          variables.slice(0, 4).map((variable) => (
                            <span
                              key={variable}
                              className="border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Sem variáveis
                          </span>
                        )}

                        {variables.length > 4 && (
                          <span className="px-2 py-1 text-[10px] text-gray-400">
                            +{variables.length - 4}
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                          Atualizado
                        </span>

                        <span className="text-xs text-gray-500">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}