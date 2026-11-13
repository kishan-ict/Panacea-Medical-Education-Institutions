import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-panel border border-dashed border-line-strong bg-muted/50 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-panel text-ink3">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs leading-5 text-ink2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function LoadingBlock({ label = 'Loading demo records' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-royal" />
      <p className="text-xs text-ink2">{label}…</p>
    </div>
  )
}

/** Small inline label that keeps every figure honest during presentations. */
export function DemoTag({ className, label = 'DEMO DATA' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border border-gold/30 bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold',
        className,
      )}
    >
      {label}
    </span>
  )
}
