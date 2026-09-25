'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ClientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(
    searchParams.get('busca') || ''
  )

  const [period, setPeriod] = useState(
    searchParams.get('periodo') || 'todos'
  )

  const [value, setValue] = useState(
    searchParams.get('valor') || 'todos'
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString()
      )

      if (search.trim()) {
        params.set('busca', search.trim())
      } else {
        params.delete('busca')
      }

      if (period !== 'todos') {
        params.set('periodo', period)
      } else {
        params.delete('periodo')
      }

      if (value !== 'todos') {
        params.set('valor', value)
      } else {
        params.delete('valor')
      }

      const query = params.toString()

      router.push(
        query
          ? `/clientes?${query}`
          : '/clientes'
      )
    }, 300)

    return () => clearTimeout(timeout)
  }, [
    search,
    period,
    value,
    router,
    searchParams,
  ])

  function clearFilters() {
    setSearch('')
    setPeriod('todos')
    setValue('todos')

    router.push('/clientes')
  }

  const hasFilters =
    search.trim() !== '' ||
    period !== 'todos' ||
    value !== 'todos'

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar cliente, telefone ou e-mail..."
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:shadow-sm"
        />
      </div>

      <select
        value={period}
        onChange={(event) =>
          setPeriod(event.target.value)
        }
        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-gray-400"
      >
        <option value="todos">
          Todo o período
        </option>

        <option value="7">
          Últimos 7 dias
        </option>

        <option value="30">
          Últimos 30 dias
        </option>

        <option value="90">
          Últimos 90 dias
        </option>

        <option value="365">
          Últimos 12 meses
        </option>
      </select>

      <select
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-gray-400"
      >
        <option value="todos">
          Qualquer valor
        </option>

        <option value="0-1000">
          Até R$ 1.000
        </option>

        <option value="1000-3000">
          R$ 1.000 — R$ 3.000
        </option>

        <option value="3000-5000">
          R$ 3.000 — R$ 5.000
        </option>

        <option value="5000+">
          Acima de R$ 5.000
        </option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="h-12 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-500 transition hover:border-gray-300 hover:text-black"
        >
          Limpar
        </button>
      )}
    </div>
  )
}