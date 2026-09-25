'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type IconProps = {
  active?: boolean
}

function DashboardIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function UsersIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ClientIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
      <path d="m17 11 2 2 4-4" />
    </svg>
  )
}

function FunnelIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  )
}

function CalendarIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ClockIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function FinanceIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  )
}

function FileIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  )
}

function ChartIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20V7" />
    </svg>
  )
}

function TeamIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
      <path d="M16 3.5a4 4 0 0 1 0 7" />
      <path d="M21 21v-2a5 5 0 0 0-4-4.9" />
    </svg>
  )
}

function SettingsIcon({ active }: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.55v-.1a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 8.6 15a1.7 1.7 0 0 0-1.56-1.03H7v-2.55h.04A1.7 1.7 0 0 0 8.6 10a1.7 1.7 0 0 0-.34-1.88L8.2 8.06l1.8-1.8.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5h2.55v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.8 1.8-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H21v2.55h-.04A1.7 1.7 0 0 0 19.4 15z" />
    </svg>
  )
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { name: 'Leads', href: '/leads', icon: UsersIcon },
  { name: 'Clientes', href: '/clientes', icon: ClientIcon },
  { name: 'Funil', href: '/funil', icon: FunnelIcon },
  { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
  { name: 'Follow-ups', href: '/follow-ups', icon: ClockIcon },
  { name: 'Financeiro', href: '/financeiro', icon: FinanceIcon },
  { name: 'Scripts', href: '/scripts', icon: FileIcon },
  { name: 'Indicadores', href: '/indicadores', icon: ChartIcon },
  { name: 'Equipe', href: '/equipe', icon: TeamIcon },
  { name: 'Configurações', href: '/configuracoes', icon: SettingsIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState('NORTH')

  useEffect(() => {
    let mounted = true

    async function loadOrganization() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !mounted) {
        return
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!membership || !mounted) {
        return
      }

      const { data: organization } = await supabase
        .from('organizations')
        .select('name, logo_url')
        .eq('id', membership.organization_id)
        .maybeSingle()

      if (!organization || !mounted) {
        return
      }

      setOrganizationName(
        organization.name || 'NORTH'
      )

      if (!organization.logo_url) {
        return
      }

      const { data: signedUrlData, error } =
        await supabase.storage
          .from('organization-assets')
          .createSignedUrl(
            organization.logo_url,
            60 * 60
          )

      if (error) {
        console.error(
          'Erro ao carregar logo da organização:',
          error
        )
        return
      }

      if (mounted && signedUrlData?.signedUrl) {
        setLogoUrl(signedUrlData.signedUrl)
      }
    }

    loadOrganization()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-black text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
        >
          {logoUrl ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black">
              <img
                src={logoUrl}
                alt={organizationName}
                className="h-full w-full object-contain p-1.5"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20">
              <span className="text-sm font-bold tracking-[-0.08em]">
                N
              </span>
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-[18px] font-semibold tracking-[0.18em] text-white">
              {organizationName}
            </p>

            <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.22em] text-white/40">
              CRM
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Menu
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/55 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon active={isActive} />

                <span
                  className={
                    isActive
                      ? 'font-semibold'
                      : 'font-normal'
                  }
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">
          NORTH CRM
        </p>

        <p className="mt-1 text-[10px] text-white/35">
          Gestão que gera direção.
        </p>
      </div>
    </aside>
  )
}