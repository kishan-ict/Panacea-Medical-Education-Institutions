import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Card } from '@/components/common/Card'
import { DemoTag } from '@/components/common/EmptyState'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean }
  tone?: 'default' | 'brand' | 'royal' | 'success' | 'warn' | 'danger' | 'gold'
  showDemoTag?: boolean
  className?: string
}

const TONE_ICON: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-muted text-ink2',
  brand: 'bg-brand-soft text-brand-ink',
  royal: 'bg-royal-soft text-royal',
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  gold: 'bg-gold-soft text-gold',
}

export function StatCard({ label, value, icon, hint, delta, tone = 'default', showDemoTag, className }: StatCardProps) {
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-ink3">{label}</p>
        {icon && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', TONE_ICON[tone])}>{icon}</span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-2">
        <p className="font-display text-[26px] font-bold leading-none tracking-tight text-ink tabular-nums">{value}</p>
        {delta && (
          <span
            className={cn(
              'mb-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold',
              delta.direction === 'flat'
                ? 'text-ink3'
                : delta.good === false
                  ? 'text-danger'
                  : delta.direction === 'up'
                    ? 'text-success'
                    : 'text-danger',
            )}
          >
            {delta.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta.direction === 'down' ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {delta.value}
          </span>
        )}
      </div>
      {(hint || showDemoTag) && (
        <div className="mt-2 flex items-center gap-2">
          {showDemoTag && <DemoTag />}
          {hint && <p className="truncate text-xs text-ink2">{hint}</p>}
        </div>
      )}
    </Card>
  )
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {children}
    </div>
  )
}

/** Row of compact figures used inside wider panels. */
export function MiniStats({ items, className }: { items: { label: string; value: ReactNode; hint?: ReactNode }[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-line bg-muted/60 px-3.5 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink3">{item.label}</p>
          <p className="mt-1 font-display text-lg font-bold text-ink tabular-nums">{item.value}</p>
          {item.hint && <p className="mt-0.5 text-[11px] text-ink2">{item.hint}</p>}
        </div>
      ))}
    </div>
  )
}
