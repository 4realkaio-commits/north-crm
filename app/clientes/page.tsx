import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CancelSaleButton from './CancelSaleButton'

type Client = {
  id: string
  name: string
  phone: string | null
  email: string | null
  converted_value: number | null
  converted_at: string | null
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(value))
}

export default async function ClientesPage() {
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
    redirect('/dashboard')
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select(
      `
        id,
        name,
        phone,
        email,
        converted_value,
        converted_at
      `
    )
    .eq('organization_id', membership.organization_id)
    .is('deleted_at', null)
    .not('converted_value', 'is', null)
    .order('converted_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar clientes:', error)
  }

  const safeClients = (clients ?? []) as Client[]

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* CABEÇALHO */}

      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Gestão
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-gray-950">
            Clientes
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Clientes convertidos e histórico de vendas.
          </p>
        </div>

        <div className="border border-gray-200 bg-white px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Total de clientes
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-gray-950">
            {safeClients.length}
          </p>
        </div>
      </div>

      {/* CLIENTES */}

      {safeClients.length === 0 ? (
        <div className="border border-gray-200 bg-white px-6 py-20 text-center">
          <p className="text-sm font-medium text-gray-900">
            Nenhum cliente encontrado.
          </p>

          <p className="mt-2 text-xs text-gray-400">
            Quando um lead for convertido, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 border-l border-t border-gray-200 bg-white sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {safeClients.map((client) => (
            <div
              key={client.id}
              className="flex min-h-[290px] flex-col border-b border-r border-gray-200 p-6"
            >
              {/* TOPO */}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Cliente
                  </p>

                  <h2 className="mt-3 truncate text-lg font-semibold tracking-[-0.03em] text-gray-950">
                    {client.name}
                  </h2>
                </div>

                <span className="shrink-0 border border-gray-200 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Ativo
                </span>
              </div>

              {/* VALOR */}

              <div className="mt-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Venda realizada
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-gray-950">
                  {formatCurrency(client.converted_value)}
                </p>
              </div>

              {/* INFORMAÇÕES */}

              <div className="mt-auto grid grid-cols-2 border-t border-gray-200 pt-5">
                <div className="border-r border-gray-200 pr-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Conversão
                  </p>

                  <p className="mt-2 text-xs text-gray-700">
                    {formatDate(client.converted_at)}
                  </p>
                </div>

                <div className="pl-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Contato
                  </p>

                  <p className="mt-2 truncate text-xs text-gray-700">
                    {client.phone || client.email || 'Sem contato'}
                  </p>
                </div>
              </div>

              {/* AÇÕES */}

              <div className="mt-5 grid grid-cols-[1fr_auto] border-t border-gray-200 pt-5">
                <Link
                  href={`/clientes/${client.id}`}
                  className="flex items-center justify-center border border-gray-200 px-4 py-3 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Ver perfil →
                </Link>

                <div className="ml-2">
                  <CancelSaleButton clientId={client.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}