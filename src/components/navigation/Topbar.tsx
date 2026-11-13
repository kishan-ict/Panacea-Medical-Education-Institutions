import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  ChevronDown,
  GraduationCap,
  LogOut,
  Megaphone,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { PORTAL_LABEL, ROOTS, getNavForRole } from '@/routes/navigation'
import { homeForRole, useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { notificationsForPortal, unreadForPortal } from '@/store/selectors'
import { useTheme, useToast } from '@/store/ui'
import { relativeTime } from '@/utils/format'
import type { Role } from '@/types'
import { Avatar } from '@/components/common/Avatar'
import { Dropdown } from '@/components/common/Dropdown'
import { Modal } from '@/components/common/Modal'
import { DemoSwitcher } from './DemoSwitcher'

interface TopbarProps {
  onOpenMobileNav: () => void
  breadcrumbs: { label: string; to?: string }[]
}

export function Topbar({ onOpenMobileNav, breadcrumbs }: TopbarProps) {
  const { session, signOut } = useAuth()
  const { state } = useDemo()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const toast = useToast()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const role = session?.role ?? 'student'
  const navItems = getNavForRole(role)
  const unread = session ? unreadForPortal(state, session.portal) : 0

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-panel/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-ink2 transition hover:bg-muted hover:text-ink lg:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
        <p className="shrink-0 text-xs text-ink3">{PORTAL_LABEL[session?.portal ?? 'student']}</p>
        <span className="text-ink3">/</span>
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span className="text-ink3">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="truncate text-xs text-ink2 transition hover:text-royal">
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate text-xs font-medium text-ink">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 lg:flex-none">
        <GlobalSearch navItems={navItems.map((item) => ({ label: item.label, to: item.to }))} role={role} />

        <button
          type="button"
          onClick={() => setSwitcherOpen(true)}
          className="hidden items-center gap-1.5 rounded-lg border border-gold/30 bg-gold-soft px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gold transition hover:bg-gold/12 sm:inline-flex"
          title="Switch demonstration account"
        >
          Demo
        </button>

        <NotificationsButton count={unread} />

        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle colour theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink2 transition hover:bg-muted hover:text-ink"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <Dropdown
          width="w-64"
          header={
            session ? (
              <div className="flex items-center gap-2.5">
                <Avatar name={session.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{session.displayName}</p>
                  <p className="truncate text-[11px] text-ink2">{session.title}</p>
                </div>
              </div>
            ) : null
          }
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition hover:bg-muted"
            >
              <Avatar name={session?.displayName ?? 'Guest'} size="sm" />
              <span className="hidden max-w-[140px] flex-col items-start leading-tight sm:flex">
                <span className="truncate text-[12.5px] font-semibold text-ink">{session?.displayName}</span>
                <span className="truncate text-[10.5px] text-ink3">{session?.title}</span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink3" />
            </button>
          }
          items={[
            {
              id: 'switch',
              label: 'Switch demo account',
              icon: <UserRound className="h-4 w-4" />,
              onSelect: () => setSwitcherOpen(true),
            },
            {
              id: 'home',
              label: 'Go to my dashboard',
              icon: <Settings className="h-4 w-4" />,
              onSelect: () => navigate(session ? homeForRole(session.role) : '/'),
            },
            {
              id: 'theme',
              label: theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
              icon: theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
              onSelect: toggle,
            },
            {
              id: 'signout',
              label: 'Sign out',
              icon: <LogOut className="h-4 w-4" />,
              tone: 'danger',
              separator: true,
              onSelect: () => {
                signOut()
                toast.info('Signed out', 'Returned to the shared PMEl Login screen.')
                navigate('/login')
              },
            },
          ]}
        />
      </div>

      <DemoSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </header>
  )
}

/* --------------------------- notifications ------------------------ */

function NotificationsButton({ count }: { count: number }) {
  const { session } = useAuth()
  const { state, actions } = useDemo()
  const [open, setOpen] = useState(false)
  const items = session ? notificationsForPortal(state, session.portal) : []

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Notifications (${count} unread)`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink2 transition hover:bg-muted hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications"
        description="Simulated alerts generated by the demonstration dataset."
        size="md"
        footer={
          <div className="flex w-full items-center justify-between">
            <p className="text-[11px] text-ink2">{items.filter((item) => !item.read).length} unread</p>
            <button
              type="button"
              className="text-[12.5px] font-medium text-royal hover:underline"
              onClick={() => session && actions.markNotificationsRead(session.portal)}
            >
              Mark all as read
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          {items.length === 0 && <p className="py-6 text-center text-sm text-ink2">No notifications for this portal.</p>}
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'rounded-lg border px-3.5 py-3 transition',
                item.read ? 'border-line bg-panel' : 'border-royal/25 bg-royal-soft/60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                <span className="shrink-0 text-[11px] text-ink3">{relativeTime(item.at)}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-ink2">{item.body}</p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

/* --------------------------- global search ------------------------ */

interface GlobalSearchProps {
  navItems: { label: string; to: string }[]
  role: Role
}

const STAFF_ROLES: Role[] = ['chairman', 'director', 'principal', 'classTeacher', 'subjectTeacher', 'accountant']

function GlobalSearch({ navItems, role }: GlobalSearchProps) {
  const { state } = useDemo()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const noticesPath = navItems.some((item) => item.to === 'notices') ? `${ROOTS[role]}/notices` : null

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 1) return { pages: [], students: [], notices: [] }
    const pages = navItems
      .filter((item) => item.label.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((item) => ({ label: item.label, to: item.to }))
    const students = STAFF_ROLES.includes(role)
      ? state.students
          .filter((s) => s.name.toLowerCase().includes(needle) || s.admissionNo.toLowerCase().includes(needle))
          .slice(0, 4)
          .map((s) => ({ label: s.name, hint: s.admissionNo, id: s.id }))
      : []
    const notices = state.notices
      .filter((n) => n.title.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((n) => ({ label: n.title, id: n.id }))
    return { pages, students, notices }
  }, [query, navItems, state, role])

  const total = results.pages.length + results.students.length + results.notices.length

  const go = (to: string) => {
    navigate(to)
    setOpen(false)
    setQuery('')
  }

  const studentTarget = (id: string) => `${ROOTS[role]}/students?student=${id}`
  const canOpenStudents = navItems.some((item) => item.to === 'students')

  return (
    <div className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
        placeholder="Search students, notices, pages…"
        className="h-9 w-56 rounded-lg border border-line bg-muted/70 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink3 transition focus:w-72 focus:border-royal/60 focus:bg-panel focus:ring-2 focus:ring-royal/15 focus-visible:outline-none"
      />
      {open && query.trim() && (
        <div className="absolute right-0 top-11 w-[19rem] overflow-hidden rounded-xl border border-line bg-panel p-1.5 shadow-pop">
          {total === 0 && <p className="px-3 py-4 text-center text-xs text-ink2">No matches for “{query}”.</p>}

          {results.pages.length > 0 && (
            <Section label="Pages">
              {results.pages.map((page) => (
                <ResultButton key={page.to} onClick={() => go(`${ROOTS[role]}/${page.to}`)} icon={<BookOpen className="h-4 w-4" />}>
                  {page.label}
                </ResultButton>
              ))}
            </Section>
          )}

          {canOpenStudents && results.students.length > 0 && (
            <Section label="Students">
              {results.students.map((student) => (
                <ResultButton
                  key={student.id}
                  onClick={() => go(studentTarget(student.id))}
                  icon={<GraduationCap className="h-4 w-4" />}
                  hint={student.hint}
                >
                  {student.label}
                </ResultButton>
              ))}
            </Section>
          )}

          {noticesPath && results.notices.length > 0 && (
            <Section label="Notices">
              {results.notices.map((notice) => (
                <ResultButton key={notice.id} onClick={() => go(noticesPath)} icon={<Megaphone className="h-4 w-4" />}>
                  {notice.label}
                </ResultButton>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink3">{label}</p>
      {children}
    </div>
  )
}

function ResultButton({
  children,
  hint,
  icon,
  onClick,
}: {
  children: ReactNode
  hint?: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-muted"
    >
      <span className="text-ink3">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{children}</span>
      {hint && <span className="shrink-0 text-[11px] text-ink3">{hint}</span>}
    </button>
  )
}
