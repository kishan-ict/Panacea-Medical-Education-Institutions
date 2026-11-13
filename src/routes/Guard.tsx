import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { DeniedPanel } from '@/layouts/AuthLayout'
import { homeForRole, useAuth } from '@/store/auth'
import { can, type Permission } from '@/routes/permissions'
import type { Role } from '@/types'

/**
 * Permission guard used at page level.
 * Never rely on this alone in production — server-side authorisation is required.
 */
export function Guard({
  permission,
  roles,
  children,
  fallback,
}: {
  permission?: Permission
  roles?: Role[]
  children: ReactNode
  fallback?: ReactNode
}) {
  const { session } = useAuth()

  if (!session) return <Navigate to="/login" replace />

  const allowed = roles ? roles.includes(session.role) : permission ? can(session.role, permission) : true

  if (!allowed) return <>{fallback ?? <DeniedPanel />}</>

  return <>{children}</>
}

/** Route-level guard for the shared login screen. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  if (session) return <Navigate to={homeForRole(session.role)} replace />
  return <>{children}</>
}
