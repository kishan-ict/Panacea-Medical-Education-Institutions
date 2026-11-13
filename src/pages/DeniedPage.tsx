import { Link, useNavigate } from 'react-router-dom'
import { DeniedPanel } from '@/layouts/AuthLayout'
import { useAuth, homeForRole } from '@/store/auth'
import { Button } from '@/components/common/Button'
import { PORTAL_LABEL } from '@/routes/navigation'
import type { Portal, Role } from '@/types'

const ROLE_PORTAL: Record<Role, Portal> = {
  chairman: 'chairman',
  director: 'director',
  principal: 'staff',
  classTeacher: 'staff',
  subjectTeacher: 'staff',
  student: 'student',
  accountant: 'accountant',
}

export function DeniedPage({ role }: { role?: Role }) {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-canvas">
      <DeniedPanel
        title={role ? `${PORTAL_LABEL[ROLE_PORTAL[role]]} is not available for this account` : 'You do not have access to this section'}
        description={
          session
            ? `You are signed in as ${session.displayName} (${session.title}). This demonstration restricts each account to its own portal, so the requested area has been blocked.`
            : 'No demonstration account is currently signed in.'
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            {session && <Button onClick={() => navigate(homeForRole(session.role))}>Go to my dashboard</Button>}
            <Button
              variant="secondary"
              onClick={() => {
                signOut()
                navigate('/login')
              }}
            >
              Switch demo account
            </Button>
            <Link to="/" className="px-2 text-[13px] text-royal hover:underline">
              Return to start
            </Link>
          </div>
        }
      />
    </div>
  )
}

export default DeniedPage
