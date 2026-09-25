'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import NewLeadModal from './NewLeadModal'

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: string
  potential_value: number | null
  created_at: string
}

type LeadsPageClientProps = {
  leads: Lead[]
}

export default function LeadsPageClient({
  leads,
}: LeadsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase()

    return leads.filter((lead) => {
      const matchesSearch =
        !term ||
        lead.name.toLowerCase().includes(term) ||
        lead.phone?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term)

      const matchesStatus =
        statusFilter === 'todos' ||
        lead.status.toLowerCase() === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [leads, search, statusFilter])

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* Cabeçalho */}
      <header className="mb-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-7 bg-black" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                NORTH CRM
              </span>
            </div>

            <h1 className="text-[34px] font-semibold tracking-[-0.035em] text-gray-950">
              Leads
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Gerencie e acompanhe todos os seus leads.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Novo lead
          </button>
        </div>
      </header>

      {/* Busca e filtros */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-5">
          <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            Pesquisa
          </h2>

          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail..."
              className="w-full border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-w-[190px] border-b border-gray-300 bg-transparent px-1 py-3 text-sm text-gray-700 outline-none transition focus:border-black"
          >
            <option value="todos">Todos os status</option>
            <option value="novo">Novo</option>
            <option value="em_andamento">Em andamento</option>
            <option value="convertido">Convertido</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
      </section>

      {/* Lista */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <h2 className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Lista de leads
            </h2>

            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <span className="shrink-0 text-xs text-gray-400">
            {filteredLeads.length}{' '}
            {filteredLeads.length === 1 ? 'lead' : 'leads'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white">
          {filteredLeads.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center border border-gray-200 px-10">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                  N
                </div>

                <p className="text-sm font-medium text-gray-700">
                  {search || statusFilter !== 'todos'
                    ? 'Nenhum lead encontrado'
                    : 'Nenhum lead cadastrado ainda.'}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {search || statusFilter !== 'todos'
                    ? 'Tente alterar os filtros da pesquisa.'
                    : 'Os novos leads aparecerão aqui.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Nome
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Telefone
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      E-mail
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Status
                    </th>

                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Valor
                    </th>

                    <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Data
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="group border-b border-gray-100 last:border-0 transition hover:bg-gray-50/70"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-sm font-medium text-gray-900 transition group-hover:text-black hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500">
                        {lead.phone || '—'}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500">
                        {lead.email || '—'}
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition group-hover:bg-black" />
                          {lead.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {lead.potential_value !== null
                          ? `R$ ${Number(
                              lead.potential_value
                            ).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}`
                          : '—'}
                      </td>

                      <td className="px-6 py-5 text-right text-xs text-gray-400">
                        {new Date(
                          lead.created_at
                        ).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {isModalOpen && (
        <NewLeadModal
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}