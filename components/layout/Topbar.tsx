'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SearchResult = {
  id: string
  name: string
  type: 'lead' | 'client'
  subtitle: string
  href: string
}

type Notification = {
  id: string
  type: 'follow-up' | 'appointment'
  title: string
  description: string
  href: string
  date: string
}

export default function Topbar() {
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>(
    []
  )
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] =
    useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        setShowResults(false)
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  useEffect(() => {
    const query = search.trim()

    if (!query) {
      setResults([])
      setSearching(false)
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      setShowResults(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setResults([])
        setSearching(false)
        return
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership?.organization_id) {
        setResults([])
        setSearching(false)
        return
      }

      const organizationId = membership.organization_id

      const [
        leadsResponse,
        clientsResponse,
      ] = await Promise.all([
        supabase
          .from('leads')
          .select(
            'id, name, company_name, phone, email'
          )
          .eq(
            'organization_id',
            organizationId
          )
          .is('deleted_at', null)
          .or(
            `name.ilike.%${query}%,company_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
          )
          .limit(5),

        supabase
          .from('clients')
          .select(
            'id, name, phone, email'
          )
          .eq(
            'organization_id',
            organizationId
          )
          .is('deleted_at', null)
          .or(
            `name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`
          )
          .limit(5),
      ])

      const leadResults: SearchResult[] =
        (leadsResponse.data || []).map(
          (lead) => ({
            id: lead.id,
            name: lead.name,
            type: 'lead',
            subtitle:
              lead.company_name ||
              lead.phone ||
              lead.email ||
              'Lead',
            href: `/leads/${lead.id}`,
          })
        )

      const clientResults: SearchResult[] =
        (clientsResponse.data || []).map(
          (client) => ({
            id: client.id,
            name: client.name,
            type: 'client',
            subtitle:
              client.phone ||
              client.email ||
              'Cliente',
            href: `/clientes/${client.id}`,
          })
        )

      setResults([
        ...leadResults,
        ...clientResults,
      ])

      setSearching(false)
    }, 250)

    return () => clearTimeout(timeout)
  }, [search])

  async function loadNotifications() {
    setLoadingNotifications(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setNotifications([])
      setLoadingNotifications(false)
      return
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!membership?.organization_id) {
      setNotifications([])
      setLoadingNotifications(false)
      return
    }

    const organizationId =
      membership.organization_id

    const now = new Date()

    const upcomingLimit = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    )

    const [
      overdueFollowUpsResponse,
      upcomingAppointmentsResponse,
    ] = await Promise.all([
      supabase
        .from('follow_ups')
        .select(`
          id,
          scheduled_at,
          type,
          note,
          lead_id,
          leads (
            name
          )
        `)
        .eq(
          'organization_id',
          organizationId
        )
        .eq('status', 'pending')
        .lt(
          'scheduled_at',
          now.toISOString()
        )
        .order('scheduled_at', {
          ascending: true,
        })
        .limit(10),

      supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          notes,
          lead_id,
          leads (
            name
          )
        `)
        .eq(
          'organization_id',
          organizationId
        )
        .is('deleted_at', null)
        .gte(
          'scheduled_at',
          now.toISOString()
        )
        .lte(
          'scheduled_at',
          upcomingLimit.toISOString()
        )
        .order('scheduled_at', {
          ascending: true,
        })
        .limit(10),
    ])

    const nextNotifications: Notification[] = []

    for (
      const followUp of overdueFollowUpsResponse.data || []
    ) {
      const leadData = Array.isArray(followUp.leads)
        ? followUp.leads[0]
        : followUp.leads

      nextNotifications.push({
        id: `follow-up-${followUp.id}`,
        type: 'follow-up',
        title: 'Follow-up vencido',
        description:
          leadData?.name ||
          'Lead sem nome',
        href: `/leads/${followUp.lead_id}`,
        date: followUp.scheduled_at,
      })
    }

    for (
      const appointment of upcomingAppointmentsResponse.data || []
    ) {
      const leadData = Array.isArray(appointment.leads)
        ? appointment.leads[0]
        : appointment.leads

      nextNotifications.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: 'Agendamento próximo',
        description:
          leadData?.name ||
          'Lead sem nome',
        href: `/leads/${appointment.lead_id}`,
        date: appointment.scheduled_at,
      })
    }

    nextNotifications.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )

    setNotifications(nextNotifications)
    setLoadingNotifications(false)
  }

  useEffect(() => {
    loadNotifications()

    const interval = setInterval(() => {
      loadNotifications()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  function handleSearchFocus() {
    setShowResults(true)
  }

  function handleClearSearch() {
    setSearch('')
    setResults([])
    setShowResults(false)
  }

  function handleNotificationClick() {
    setShowNotifications((current) => !current)

    if (!showNotifications) {
      loadNotifications()
    }
  }

  function formatNotificationDate(
    date: string
  ) {
    const notificationDate = new Date(date)
    const now = new Date()

    const difference =
      notificationDate.getTime() - now.getTime()

    const oneHour = 60 * 60 * 1000

    if (difference < 0) {
      return 'Vencido'
    }

    if (difference < oneHour) {
      const minutes = Math.max(
        1,
        Math.round(difference / 60000)
      )

      return `Em ${minutes} min`
    }

    return notificationDate.toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  return (
    <header className="relative z-50 flex min-h-20 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          NORTH CRM
        </p>

        <p className="mt-1 text-sm font-medium text-gray-900">
          Gestão comercial
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div
          ref={searchRef}
          className="relative w-[380px]"
        >
          <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 transition-all duration-200 focus-within:border-gray-400 focus-within:bg-white focus-within:shadow-sm">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-gray-400"
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
              onFocus={handleSearchFocus}
              placeholder="Buscar leads, clientes..."
              className="ml-3 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mr-2 text-gray-400 transition hover:text-black"
              >
                ×
              </button>
            )}

            {!search && (
              <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-400">
                /
              </span>
            )}
          </div>

          {showResults && search.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
              {searching ? (
                <div className="px-5 py-5">
                  <p className="text-sm text-gray-400">
                    Buscando...
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      onClick={() =>
                        setShowResults(false)
                      }
                      className="flex items-center gap-4 px-5 py-3 transition hover:bg-gray-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold text-gray-700">
                        {result.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {result.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {result.type === 'lead'
                            ? 'Lead'
                            : 'Cliente'}{' '}
                          · {result.subtitle}
                        </p>
                      </div>

                      <span className="text-gray-300">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-6">
                  <p className="text-sm font-medium text-gray-700">
                    Nenhum resultado encontrado
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Tente buscar por nome, empresa,
                    telefone ou e-mail.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={handleNotificationClick}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            aria-label="Notificações"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 15 3 17H21C21 15 18 15 18 8ZM10 21H14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[8px] font-bold text-white">
                {notifications.length > 9
                  ? '9+'
                  : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Notificações
                  </p>

                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Acompanhe o que precisa de atenção.
                  </p>
                </div>

                {notifications.length > 0 && (
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    {notifications.length}{' '}
                    {notifications.length === 1
                      ? 'aviso'
                      : 'avisos'}
                  </span>
                )}
              </div>

              {loadingNotifications ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs text-gray-400">
                    Atualizando notificações...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-gray-400"
                    >
                      <path
                        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 15 3 17H21C21 15 18 15 18 8ZM10 21H14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Tudo em ordem
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Nenhuma notificação no momento.
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.map(
                    (notification) => (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() =>
                          setShowNotifications(false)
                        }
                        className="flex gap-3 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50"
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            notification.type ===
                            'follow-up'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {notification.type ===
                          'follow-up' ? (
                            <span className="text-[10px] font-bold">
                              !
                            </span>
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="17"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              />

                              <path
                                d="M16 2V6M8 2V6M3 10H21"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold text-gray-900">
                              {notification.title}
                            </p>

                            <span className="shrink-0 text-[9px] text-gray-400">
                              {formatNotificationDate(
                                notification.date
                              )}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {notification.description}
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
          N
        </div>
      </div>
    </header>
  )
}