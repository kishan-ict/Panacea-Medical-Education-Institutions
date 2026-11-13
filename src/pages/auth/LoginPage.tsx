import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Lock, LogIn, Mail, User } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { homeForRole, useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import { DEMO_HINT, DEMO_ACCOUNTS, findAccount } from '@/data/constants/accounts'
import { INSTITUTION } from '@/data/constants/institution'
import { Button } from '@/components/common/Button'
import { Checkbox, Field, Input } from '@/components/common/Form'
import { Modal } from '@/components/common/Modal'
import { DemoAccountPicker } from '@/components/navigation/DemoSwitcher'
import { Badge } from '@/components/common/Badge'

export function LoginPage() {
  const { signIn, signInWithCredentials } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password to continue.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      const result = signInWithCredentials(username, password, remember)
      setBusy(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      const account = DEMO_ACCOUNTS.find((a) => a.username === username.trim().toLowerCase())
      toast.success('Signed in', account?.title ?? 'Welcome to PMEl Login.')
      navigate(account ? homeForRole(account.role) : '/chairman')
    }, 550)
  }

  const explore = (id: string) => {
    const account = findAccount(id)
    if (!account) return
    signIn(account, true)
    toast.info(`Exploring as ${account.displayName}`, account.title)
    navigate(homeForRole(account.role))
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-royal">Secure sign in</p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-ink">Access your portal</h1>
          <p className="mt-1.5 text-[13px] leading-6 text-ink2">
            One shared sign-in for the Chairman, Director, Staff, Student and Accountant portals of{' '}
            {INSTITUTION.name}.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Username / Student ID / Employee ID" required>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. chairman, student, PMEI/T/002"
              autoComplete="username"
              leading={<User className="h-4 w-4" />}
              inputSize="md"
            />
          </Field>

          <Field label="Password" required>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              leading={<Lock className="h-4 w-4" />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-md p-1.5 text-ink3 transition hover:bg-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </Field>

          {error && (
            <div className="rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-2.5">
              <p className="text-[13px] font-medium text-danger">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="text-[13px] font-medium text-royal transition hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" block loading={busy} icon={<LogIn className="h-4 w-4" />}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center text-[11px] leading-5 text-ink3">
            {DEMO_HINT}
          </p>
        </form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink3">Explore demo</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">Sign in as any portal</p>
              <p className="mt-0.5 text-[12px] text-ink2">
                Jump straight into a role — no credentials required for the presentation.
              </p>
            </div>
            <Badge tone="gold">Demo only</Badge>
          </div>
          <DemoAccountPicker onSelect={(account) => explore(account.id)} />
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Password recovery"
        description="Demonstration behaviour only — no e-mail or SMS service is connected."
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              icon={<KeyRound className="h-4 w-4" />}
              onClick={() => {
                setResetOpen(false)
                toast.info(
                  'Recovery simulated',
                  `In production, instructions would be sent to ${resetEmail || 'your registered address'}. This prototype has no mail service.`,
                )
                setResetEmail('')
              }}
            >
              Send instructions
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Registered e-mail address" hint={`Institutional contact: ${INSTITUTION.email}`}>
            <Input
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              placeholder="you@example.com"
              leading={<Mail className="h-4 w-4" />}
            />
          </Field>
          <p className="rounded-lg border border-line bg-muted px-3.5 py-3 text-xs leading-5 text-ink2">
            PMEl Login is a frontend demonstration. Account recovery, notifications and confirmations are simulated
            locally so the flow can be presented end-to-end without any backend service.
          </p>
        </div>
      </Modal>
    </AuthLayout>
  )
}

export default LoginPage
