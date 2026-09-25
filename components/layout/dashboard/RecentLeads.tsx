import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  created_at: string
}

export default async function RecentLeads() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="bg-white">
        <div className="px-6 py-10">
          <p className="text-sm text-gray-400">
            Usuário não autenticado.
          </p>
        </div>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return (
      <div className="bg-white">
        <div className="px-6 py-10">
          <p className="text-sm text-gray-400">
            Organização não encontrada.
          </p>
        </div>
      </div>
    )
  }

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, phone, email, created_at')
    .eq('organization_id', membership.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Erro ao carregar leads recentes:', error)

    return (
      <div className="bg-white">
        <div className="px-6 py-10">
          <p className="text-sm text-gray-400">
            Não foi possível carregar os leads.
          </p>
        </div>
      </div>
    )
  }

  const recentLeads: Lead[] = leads ?? []

  return (
    <div className="bg-white">
      <div className="flex items-end justify-between px-6 pb-5 pt-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Leads
          </p>

          <h3 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-gray-950">
            Leads recentes
          </h3>
        </div>

        <Link
          href="/leads"
          className="text-xs font-medium text-gray-400 transition hover:text-black"
        >
          Ver todos →
        </Link>
      </div>

      <div className="border-t border-gray-100">
        {recentLeads.length === 0 ? (
          <div className="px-6 py-10">
            <p className="text-sm text-gray-400">
              Nenhum lead cadastrado ainda.
            </p>

            <Link
              href="/leads"
              className="mt-3 inline-block text-xs font-semibold text-gray-700 transition hover:text-black"
            >
              Cadastrar primeiro lead →
            </Link>
          </div>
        ) : (
          <div>
            {recentLeads.map((lead, index) => {
              const initials = lead.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) =>
                  part.charAt(0).toUpperCase()
                )
                .join('')

              const date = new Date(lead.created_at)

              const formattedDate = date.toLocaleDateString(
                'pt-BR',
                {
                  day: '2-digit',
                  month: 'short',
                }
              )

              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className={`group flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-gray-50 ${
                    index !== recentLeads.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 transition group-hover:bg-black group-hover:text-white">
                      {initials || 'L'}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {lead.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-400">
                        {lead.email ||
                          lead.phone ||
                          'Sem contato informado'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-400">
                      {formattedDate}
                    </p>

                    <span className="mt-2 ml-auto block h-1.5 w-1.5 rounded-full bg-gray-200 transition group-hover:bg-black" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}