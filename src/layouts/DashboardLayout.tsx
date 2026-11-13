import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { ROOTS, PORTAL_LABEL, getNavForRole } from '@/routes/navigation'
import type { Role } from '@/types'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'
import { DeniedPage } from '@/pages/DeniedPage'
import { DISCLAIMER } from '@/data/constants/institution'

const COLLAPSE_KEY = 'pmei.sidebar.collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Route group wrapper: renders a helpful unauthorized state when the signed-in
 * demo account does not belong to this portal, instead of silently redirecting.
 * Prototype permissions only — real authorisation must be server-side.
 */
export function PortalGate({ role, children }: { role: Role; children?: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (session.role !== role) return <DeniedPage role={role} />

  return children ?? <Outlet />
}

export function DashboardLayout({ role }: { role: Role }) {
  const { session } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  if (!session) return <Navigate to="/login" replace />

  const root = ROOTS[session.role]
  const navItems = getNavForRole(session.role)
  const current = navItems.find((item) => location.pathname === `${root}/${item.to}` || location.pathname === `${root}`)
  const crumbs = [
    { label: PORTAL_LABEL[session.portal] },
    { label: current?.label ?? 'Overview', to: `${root}/${navItems[0]?.to ?? 'overview'}` },
    { label: session.displayName },
  ]

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        role={role}
        portal={session.portal}
        linkedId={session.linkedId}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} breadcrumbs={crumbs} />

        <main className="mx-auto w-full max-w-[1560px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-line bg-panel px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-2 text-[11px] text-ink3">
            <span className="inline-flex items-center gap-2">
              <span className="rounded border border-gold/30 bg-gold-soft px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider text-gold">
                {DISCLAIMER.demo}
              </span>
              {DISCLAIMER.body}
            </span>
            <span>PMEI-LOGIN · prototype build 1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
