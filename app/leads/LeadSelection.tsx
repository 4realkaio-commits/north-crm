'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  name: string
  company_name: string | null
  instagram: string | null
  city: string | null
  segment: string | null
  phone: string | null
  email: string | null
  status: string
  potential_value: number | null
  created_at: string
}

type LeadSelectionProps = {
  leads: Lead[]
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'novo':
      return 'Novo'

    case 'em_contato':
      return 'Em contato'

    case 'contato':
      return 'Contato'

    case 'qualificado':
      return 'Qualificado'

    case 'proposta':
      return 'Proposta'

    case 'negociacao':
    case 'negociação':
      return 'Negociação'

    case 'convertido':
      return 'Convertido'

    case 'perdido':
      return 'Perdido'

    default:
      return status
  }
}

function getStatusDot(status: string) {
  switch (status.toLowerCase()) {
    case 'novo':
      return 'bg-gray-400'

    case 'em_contato':
    case 'contato':
      return 'bg-black'

    case 'qualificado':
      return 'bg-gray-600'

    case 'proposta':
      return 'bg-gray-700'

    case 'negociacao':
    case 'negociação':
      return 'bg-black'

    case 'convertido':
      return 'bg-gray-500'

    case 'perdido':
      return 'bg-gray-300'

    default:
      return 'bg-gray-400'
  }
}

export default function LeadSelection({
  leads,
}: LeadSelectionProps) {
  const router = useRouter()

  const [selectedIds, setSelectedIds] =
    useState<string[]>([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] =
    useState('')

  const [cityFilter, setCityFilter] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('')

  const normalizedSearch =
    search.trim().toLowerCase()

  const segments = useMemo(() => {
    return Array.from(
      new Set(
        leads
          .map((lead) =>
            lead.segment?.trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      String(a).localeCompare(
        String(b),
        'pt-BR'
      )
    )
  }, [leads])

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        leads
          .map((lead) =>
            lead.city?.trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      String(a).localeCompare(
        String(b),
        'pt-BR'
      )
    )
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        lead.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        (lead.company_name ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        (lead.instagram ?? '')
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesSegment =
        !segmentFilter ||
        (lead.segment ?? '') ===
          segmentFilter

      const matchesCity =
        !cityFilter ||
        (lead.city ?? '') ===
          cityFilter

      const normalizedStatus =
        lead.status.toLowerCase()

      const normalizedFilter =
        statusFilter.toLowerCase()

      const matchesStatus =
        !statusFilter ||
        normalizedStatus ===
          normalizedFilter

      return (
        matchesSearch &&
        matchesSegment &&
        matchesCity &&
        matchesStatus
      )
    })
  }, [
    leads,
    normalizedSearch,
    segmentFilter,
    cityFilter,
    statusFilter,
  ])

  const allSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((lead) =>
      selectedIds.includes(lead.id)
    )

  function toggleLead(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (selectedId) =>
              selectedId !== id
          )
        : [...current, id]
    )
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filteredLeads.some(
              (lead) => lead.id === id
            )
        )
      )

      return
    }

    setSelectedIds((current) => {
      const ids = new Set(current)

      filteredLeads.forEach((lead) => {
        ids.add(lead.id)
      })

      return Array.from(ids)
    })
  }

  function clearFilters() {
    setSearch('')
    setSegmentFilter('')
    setCityFilter('')
    setStatusFilter('')
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return

    const confirmed = window.confirm(
      `Excluir ${selectedIds.length} ${
        selectedIds.length === 1
          ? 'lead'
          : 'leads'
      } selecionado${
        selectedIds.length === 1
          ? ''
          : 's'
      }?`
    )

    if (!confirmed) return

    setError('')
    setLoading(true)

    const supabase = createClient()

    const {
      error: deleteError,
    } = await supabase
      .from('leads')
      .update({
        deleted_at:
          new Date().toISOString(),
      })
      .in('id', selectedIds)

    if (deleteError) {
      console.error(
        'Erro ao excluir leads:',
        JSON.stringify(
          deleteError,
          null,
          2
        )
      )

      setError(
        deleteError.message ||
          'Não foi possível excluir os leads.'
      )

      setLoading(false)
      return
    }

    setSelectedIds([])
    setLoading(false)

    router.refresh()
  }

  if (leads.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex min-h-48 items-center justify-center px-10">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
              N
            </div>

            <p className="text-sm font-medium text-gray-700">
              Nenhum lead cadastrado.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Clique em “Novo lead” para criar o primeiro.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    segmentFilter !== '' ||
    cityFilter !== '' ||
    statusFilter !== ''

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <path
                d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar por nome, empresa ou Instagram..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-black focus:bg-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[600px]">
            <select
              value={segmentFilter}
              onChange={(event) =>
                setSegmentFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-black focus:bg-white"
            >
              <option value="">
                Todos os segmentos
              </option>

              {segments.map(
                (segment) => (
                  <option
                    key={segment}
                    value={segment}
                  >
                    {segment}
                  </option>
                )
              )}
            </select>

            <select
              value={cityFilter}
              onChange={(event) =>
                setCityFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-black focus:bg-white"
            >
              <option value="">
                Todas as cidades
              </option>

              {cities.map((city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-black focus:bg-white"
            >
              <option value="">
                Todas as etapas
              </option>

              <option value="novo">
                Novo
              </option>

              <option value="em_contato">
                Em contato
              </option>

              <option value="qualificado">
                Qualificado
              </option>

              <option value="proposta">
                Proposta
              </option>

              <option value="negociacao">
                Negociação
              </option>

              <option value="convertido">
                Convertido
              </option>

              <option value="perdido">
                Perdido
              </option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              {filteredLeads.length}{' '}
              {filteredLeads.length === 1
                ? 'lead encontrado'
                : 'leads encontrados'}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-gray-500 transition hover:text-black"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm font-medium text-gray-700">
            {selectedIds.length}{' '}
            {selectedIds.length === 1
              ? 'lead selecionado'
              : 'leads selecionados'}
          </p>

          <button
            type="button"
            onClick={deleteSelected}
            disabled={loading}
            className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Excluindo...'
              : 'Excluir selecionados'}
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-600">
            {error}
          </p>
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex min-h-48 items-center justify-center px-10">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Nenhum lead encontrado.
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Tente alterar os filtros ou a busca.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-800"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-14 px-6 py-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Selecionar todos os leads"
                      className="h-4 w-4 cursor-pointer accent-black"
                    />
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Lead
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Empresa
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Segmento
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Localização
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Contato
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Valor potencial
                  </th>

                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Criado em
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map(
                  (lead) => {
                    const selected =
                      selectedIds.includes(
                        lead.id
                      )

                    return (
                      <tr
                        key={lead.id}
                        className={`group border-b border-gray-100 last:border-0 transition ${
                          selected
                            ? 'bg-gray-50'
                            : 'hover:bg-gray-50/70'
                        }`}
                      >
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleLead(
                                lead.id
                              )
                            }
                            aria-label={`Selecionar lead ${lead.name}`}
                            className="h-4 w-4 cursor-pointer accent-black"
                          />
                        </td>

                        <td className="px-6 py-5">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="block text-sm font-medium text-gray-900 transition hover:text-black hover:underline"
                          >
                            {lead.name}
                          </Link>

                          {lead.instagram && (
                            <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                              {lead.instagram}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-700">
                            {lead.company_name ||
                              '—'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-700">
                            {lead.segment ||
                              '—'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-700">
                            {lead.city ||
                              '—'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div>
                            {lead.phone ? (
                              <p className="text-sm text-gray-700">
                                {lead.phone}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">
                                Sem telefone
                              </p>
                            )}

                            {lead.email && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-gray-400">
                                {lead.email}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                lead.status
                              )}`}
                            />

                            {getStatusLabel(
                              lead.status
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-gray-800">
                            {lead.potential_value !==
                            null
                              ? Number(
                                  lead.potential_value
                                ).toLocaleString(
                                  'pt-BR',
                                  {
                                    style:
                                      'currency',
                                    currency:
                                      'BRL',
                                  }
                                )
                              : '—'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-500">
                            {new Date(
                              lead.created_at
                            ).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}