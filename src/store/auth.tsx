import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { DemoAccount, Portal, Role, Session } from '@/types'
import { DEMO_ACCOUNTS, findAccount, findAccountByCredentials } from '@/data/constants/accounts'

const LS_KEY = 'pmei.demo.session'
const SS_KEY = 'pmei.demo.session.transient'

type Memory = 'local' | 'session'

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(LS_KEY) ?? sessionStorage.getItem(SS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed && parsed.accountId ? parsed : null
  } catch {
    return null
  }
}

function writeStored(session: Session, memory: Memory) {
  try {
    if (memory === 'local') {
      sessionStorage.removeItem(SS_KEY)
      localStorage.setItem(LS_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(LS_KEY)
      sessionStorage.setItem(SS_KEY, JSON.stringify(session))
    }
  } catch {
    /* storage unavailable — session is kept in memory only */
  }
}

function clearStored() {
  try {
    localStorage.removeItem(LS_KEY)
    sessionStorage.removeItem(SS_KEY)
  } catch {
    /* ignore */
  }
}

function sessionFromAccount(account: DemoAccount): Session {
  return {
    accountId: account.id,
    role: account.role,
    portal: account.portal,
    displayName: account.displayName,
    title: account.title,
    linkedId: account.linkedId,
    signedInAt: new Date().toISOString(),
  }
}

interface AuthValue {
  session: Session | null
  accounts: DemoAccount[]
  signIn: (account: DemoAccount, remember: boolean) => void
  signInWithCredentials: (username: string, password: string, remember: boolean) => { ok: boolean; message: string }
  switchAccount: (accountId: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStored)

  useEffect(() => {
    // recover from a cleared storage bucket while the tab is open
    if (session && !readStored()) writeStored(session, 'local')
  }, [session])

  const signIn = useCallback((account: DemoAccount, remember: boolean) => {
    const next = sessionFromAccount(account)
    setSession(next)
    writeStored(next, remember ? 'local' : 'session')
  }, [])

  const signInWithCredentials = useCallback(
    (username: string, password: string, remember: boolean) => {
      const account = findAccountByCredentials(username, password)
      if (!account) {
        return {
          ok: false,
          message: 'Those credentials do not match a demonstration account. Use “Explore Demo” below to sign in.',
        }
      }
      signIn(account, remember)
      return { ok: true, message: `Welcome, ${account.displayName}.` }
    },
    [signIn],
  )

  const switchAccount = useCallback(
    (accountId: string) => {
      const account = findAccount(accountId)
      if (account) signIn(account, true)
    },
    [signIn],
  )

  const signOut = useCallback(() => {
    setSession(null)
    clearStored()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ session, accounts: DEMO_ACCOUNTS, signIn, signInWithCredentials, switchAccount, signOut }),
    [session, signIn, signInWithCredentials, switchAccount, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function portalHome(portal: Portal): string {
  switch (portal) {
    case 'chairman':
      return '/chairman'
    case 'director':
      return '/director'
    case 'staff':
      return '/staff/principal'
    case 'student':
      return '/student'
    case 'accountant':
      return '/accountant'
  }
}

export function homeForRole(role: Role): string {
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
