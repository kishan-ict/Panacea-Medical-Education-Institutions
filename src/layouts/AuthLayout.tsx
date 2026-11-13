import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { DISCLAIMER, INSTITUTION } from '@/data/constants/institution'
import { InstitutionLogo } from '@/components/common/InstitutionLogo'
import { Badge } from '@/components/common/Badge'

/**
 * Shared authentication frame for every portal.
 * Desktop: institutional branding (left) + access form (right).
 * Mobile: compact brand header + form.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(460px,44%)]">
      {/* ------------------------------ brand ------------------------------ */}
      <section className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 12%, rgba(255,255,255,.55), transparent 42%), radial-gradient(circle at 82% 78%, rgba(200,149,31,.5), transparent 46%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)', backgroundSize: '46px 46px' }}
          aria-hidden
        />

        <div className="relative z-10 flex items-center gap-3 px-10 pt-10 xl:px-14">
          <InstitutionLogo size={44} variant="dark" />
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold tracking-tight text-white">{INSTITUTION.product}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Institutional ERP</p>
          </div>
        </div>

        <div className="relative z-10 px-10 xl:px-14">
          <h1 className="max-w-xl font-display text-[40px] font-extrabold leading-[1.08] tracking-tight text-white xl:text-[46px]">
            {INSTITUTION.productTagline}
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/72">
            A single operational platform for {INSTITUTION.name} — student records, teaching staff, attendance,
            examinations, fees, notices and campus communication across the Chairman, Director, Staff, Student and
            Accountant portals.
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
            {[
              ['5', 'Portal experiences'],
              ['3', 'Nursing programmes'],
              ['2020', 'Founded & recognised'],
              ['800+', 'Clinical training hours'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/12 bg-white/6 px-4 py-3 backdrop-blur-sm">
                <p className="font-display text-xl font-bold text-white tabular-nums">{value}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-white/55">{label}</p>
              </div>
            ))}
          </div>

          <p className="mt-7 max-w-lg text-xs leading-5 text-white/50">
            {INSTITUTION.name} · {INSTITUTION.address} · Programmes: ANM, GNM and B.Sc. Nursing as published on{' '}
            <a href={INSTITUTION.website} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-white">
              the official website
            </a>
            .
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 px-10 py-5 xl:px-14">
          <Badge tone="gold" size="md">
            {DISCLAIMER.demo}
          </Badge>
          <p className="text-[11px] text-white/45">Frontend demonstration — no backend services connected</p>
        </div>
      </section>

      {/* ------------------------------- form ------------------------------ */}
      <section className="flex min-h-screen flex-col bg-panel">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <InstitutionLogo size={34} />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-extrabold text-ink">{INSTITUTION.product}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink3">Institutional ERP</p>
            </div>
          </div>
          <Badge tone="gold">Demo mode</Badge>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>

        <div className="border-t border-line px-5 py-4 text-center text-[11px] text-ink3">
          © 2026 {INSTITUTION.name} · Prototype evaluation build ·{' '}
          <Link to="/privacy" className="transition hover:text-royal">
            data policy
          </Link>
        </div>
      </section>
    </div>
  )
}

/** Unauthorized route state used by permission guards. */
export function DeniedPanel({
  title = 'You do not have access to this section',
  description = 'This area is restricted for your current demonstration role. Use the demo account switcher to continue the presentation with the appropriate role.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/25 bg-danger-soft text-danger">
        <ShieldAlert className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-2 max-w-md text-[13px] leading-6 text-ink2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
      <p className="mt-6 max-w-md text-[11px] leading-5 text-ink3">
        Prototype permissions are enforced with client-side route guards for demonstration purposes only.
      </p>
    </div>
  )
}
