import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react'
import { homeForRole, useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import { DEMO_ACCOUNTS } from '@/data/constants/accounts'
import { Button } from '@/components/common/Button'
import { Field, Input } from '@/components/common/Form'
import { Modal } from '@/components/common/Modal'
import { InstitutionLogo } from '@/components/common/InstitutionLogo'
import { cn } from '@/utils/cn'

const SLIDES = [
  'https://pmeinursingcollege.com/assets/img/slider/slider-1.jpg',
  'https://pmeinursingcollege.com/assets/img/slider/slider-2.jpg',
]

function GooglePlayBadge() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label="Get it on Google Play"
      className="inline-flex h-10 min-w-[136px] items-center gap-2 rounded-md border border-black/80 bg-black px-2.5 text-white transition hover:bg-black/90"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
        <path fill="#34A853" d="M3.6 2.7c-.2.3-.3.7-.3 1.1v16.4c0 .4.1.8.3 1.1l.1.1 9.2-9.2v-.2L3.7 2.6l-.1.1z" />
        <path fill="#FBBC05" d="M16 15.1 12.9 12v-.2L16 8.7l.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.7 2.1-.1-.1z" />
        <path fill="#EA4335" d="M16.1 15 13 12 3.6 21.4c.3.4.9.4 1.6 0L16.1 15z" />
        <path fill="#4285F4" d="M16.1 8.8 5.2 2.6c-.7-.4-1.3-.4-1.6 0L13 12l3.1-3.2z" />
      </svg>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[8px] font-medium uppercase tracking-wide text-white/90">Get it on</span>
        <span className="mt-0.5 text-[14px] font-semibold tracking-tight">Google Play</span>
      </span>
    </a>
  )
}

function AppStoreBadge() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label="Download on the App Store"
      className="inline-flex h-10 min-w-[136px] items-center gap-2 rounded-md border border-black/80 bg-black px-2.5 text-white transition hover:bg-black/90"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden>
        <path d="M16.37 12.2c-.02-2.16 1.76-3.2 1.84-3.25-1-1.47-2.56-1.67-3.11-1.69-1.32-.14-2.6.79-3.27.79-.68 0-1.72-.77-2.83-.75-1.44.02-2.79.85-3.53 2.15-1.52 2.64-.39 6.53 1.08 8.67.73 1.05 1.59 2.22 2.72 2.18 1.1-.05 1.51-.7 2.84-.7 1.32 0 1.7.7 2.85.68 1.18-.02 1.92-1.06 2.63-2.12.84-1.21 1.18-2.39 1.2-2.45-.03-.01-2.29-.88-2.42-3.51zM14.2 5.86c.59-.73.99-1.73.88-2.74-.85.04-1.9.58-2.51 1.3-.54.63-1.02 1.66-.9 2.63.95.07 1.93-.48 2.53-1.19z" />
      </svg>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[8px] font-medium uppercase tracking-wide text-white/90">Download on the</span>
        <span className="mt-0.5 text-[14px] font-semibold tracking-tight">App Store</span>
      </span>
    </a>
  )
}

export function LoginPage() {
  const { signInWithCredentials } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((i) => (i + 1) % SLIDES.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password to continue.')
      return
    }
    setBusy(true)
    window.setTimeout(() => {
      const result = signInWithCredentials(username, password, false)
      setBusy(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      const account = DEMO_ACCOUNTS.find((a) => a.username === username.trim().toLowerCase())
      toast.success('Signed in', account?.title ?? 'Welcome.')
      navigate(account ? homeForRole(account.role) : '/chairman')
    }, 550)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#e8eaed]">
      {/* Full-screen background carousel */}
      <div className="absolute inset-0" aria-hidden>
        {SLIDES.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1800ms] ease-in-out',
              index === activeSlide ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>

      {/* Floating angled login panel */}
      <main
        className="relative z-10 flex min-h-screen w-full flex-col bg-white shadow-[18px_0_48px_rgba(15,23,42,0.14)] sm:w-[420px] md:w-[380px] lg:fixed lg:inset-y-0 lg:left-0 lg:w-[34vw] lg:min-w-[360px] lg:max-w-[460px] lg:overflow-y-auto"
        style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}
      >
        <div className="flex flex-1 flex-col px-8 py-8 sm:px-10 sm:py-10 lg:px-10 lg:py-10 lg:pr-14 xl:px-12 xl:pr-16">
          <div className="mb-6">
            <InstitutionLogo size={56} variant="light" className="rounded-lg" />
            <p className="mt-4 font-display text-[15px] font-semibold leading-snug tracking-tight text-ink sm:text-[16px]">
              Panacea Medical Education Institutions
            </p>
          </div>

          <h1 className="font-display text-[32px] font-bold tracking-tight text-ink">Login</h1>
          <p className="mt-2 text-[14px] leading-6 text-ink2">Please login with your Username &amp; Password</p>

          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <Field label="Username / Student ID / Employee ID">
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username / Student ID / Employee ID"
                autoComplete="username"
                leading={<User className="h-4 w-4" />}
                inputSize="md"
              />
            </Field>

            <Field label="Password">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                leading={<Lock className="h-4 w-4" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="rounded-md p-1.5 text-ink3 transition hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>

            {error && (
              <div className="rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-2.5" role="alert">
                <p className="text-[13px] font-medium text-danger">{error}</p>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="text-[13px] font-medium text-royal transition hover:text-royal/80 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 rounded"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              loading={busy}
              className="h-11 bg-brand text-white shadow-sm transition-colors hover:bg-brand/92"
            >
              {busy ? 'Signing in…' : 'Login'}
            </Button>
          </form>

          <div className="mt-7 flex flex-wrap items-center gap-3 pb-2">
            <GooglePlayBadge />
            <AppStoreBadge />
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 1023.98px) {
          main[style] { clip-path: none !important; }
        }
      `}</style>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Forgot password"
        description="This is a frontend-only demonstration."
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Close
            </Button>
            <Button
              icon={<KeyRound className="h-4 w-4" />}
              onClick={() => {
                setResetOpen(false)
                toast.info('Password recovery', 'Password recovery is not available in this demo.')
              }}
            >
              Continue
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-6 text-ink2">
          Please contact your institution administrator for assistance with your account credentials.
        </p>
      </Modal>
    </div>
  )
}

export default LoginPage
