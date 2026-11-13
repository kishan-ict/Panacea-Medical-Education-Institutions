import { NavLink, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { INSTITUTION } from '@/data/constants/institution'
import { PORTAL_LABEL, groupNavItems, getNavForRole, type NavItem } from '@/routes/navigation'
import type { Portal, Role } from '@/types'
import { InstitutionLogo } from '@/components/common/InstitutionLogo'
import { useNavBadges } from './badges'

interface SidebarProps {
  role: Role
  portal: Portal
  linkedId: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  role,
  portal,
  linkedId,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation()
  const items = getNavForRole(role)
  const groups = groupNavItems(items, role)
  const badges = useNavBadges(role, linkedId)

  const renderItems = (isMobile: boolean) =>
    groups.map((group) => (
      <div key={group.group} className="mb-4">
        {(!collapsed || isMobile) && (
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink3">{group.group}</p>
        )}
        <ul className="space-y-0.5">
          {group.items.map((item) => (
            <SidebarLink
              key={item.key}
              item={item}
              basePath={getBasePath(role)}
              collapsed={collapsed && !isMobile}
              count={item.badge ? badges[item.badge] : undefined}
              active={location.pathname === getBasePath(role) + '/' + item.to || location.pathname.endsWith('/' + item.to)}
              mobile={isMobile}
              onNavigate={isMobile ? onCloseMobile : undefined}
            />
          ))}
        </ul>
      </div>
    ))

  return (
    <>
      {/* desktop rail */}
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        <div className={cn('flex h-16 items-center gap-2.5 border-b border-line', collapsed ? 'justify-center px-3' : 'px-4')}>
          <InstitutionLogo size={34} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-[15px] font-extrabold tracking-tight text-ink">{INSTITUTION.product}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.14em] text-ink3">{PORTAL_LABEL[portal]}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4">{renderItems(false)}</nav>

        <div className="border-t border-line p-2.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-ink2 transition hover:bg-muted hover:text-ink',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      {/* mobile drawer */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', mobileOpen ? '' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-[#0b1424]/50 transition-opacity duration-200', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onCloseMobile}
          aria-hidden
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-[282px] max-w-[85vw] flex-col border-r border-line bg-panel transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <InstitutionLogo size={32} />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-display text-[15px] font-extrabold text-ink">{INSTITUTION.product}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.14em] text-ink3">{PORTAL_LABEL[portal]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="rounded-lg p-2 text-ink2 hover:bg-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-2.5 py-4">{renderItems(true)}</nav>
        </aside>
      </div>
    </>
  )
}

function SidebarLink({
  item,
  basePath,
  collapsed,
  count,
  active,
  mobile,
  onNavigate,
}: {
  item: NavItem
  basePath: string
  collapsed: boolean
  count?: number
  active: boolean
  mobile?: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <li>
      <NavLink
        to={`${basePath}/${item.to}`}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
          collapsed && !mobile && 'justify-center px-0 py-2.5',
          active
            ? 'bg-brand-soft text-brand-ink'
            : 'text-ink2 hover:bg-muted hover:text-ink',
        )}
      >
        {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-royal" />}
        <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-royal' : 'text-ink3 group-hover:text-ink2')} strokeWidth={1.8} />
        {(!collapsed || mobile) && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
        {count !== undefined && count > 0 && (!collapsed || mobile) && (
          <span className="ml-auto rounded-full bg-gold-soft px-1.5 py-px text-[10px] font-bold text-gold tabular-nums">
            {count}
          </span>
        )}
        {count !== undefined && count > 0 && collapsed && !mobile && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-solid" />
        )}
      </NavLink>
    </li>
  )
}

function getBasePath(role: Role): string {
  switch (role) {
    case 'chairman':
      return '/chairman'
    case 'director':
      return '/director'
    case 'principal':
      return '/staff/principal'
    case 'classTeacher':
      return '/staff/class-teacher'
    case 'subjectTeacher':
      return '/staff/subject-teacher'
    case 'student':
      return '/student'
    case 'accountant':
      return '/accountant'
  }
}
