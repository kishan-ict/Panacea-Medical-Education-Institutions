import { cn } from '@/utils/cn'
import { formatPercent } from '@/utils/format'

type Tone = 'brand' | 'royal' | 'success' | 'warn' | 'danger' | 'gold' | 'auto'

const TONE: Record<Tone, string> = {
  brand: 'bg-brand',
  royal: 'bg-royal',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
  gold: 'bg-gold-solid',
  auto: '',
}

function autoTone(pct: number): string {
  if (pct >= 85) return 'bg-success'
  if (pct >= 70) return 'bg-royal'
  if (pct >= 55) return 'bg-warn'
  return 'bg-danger'
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'royal',
  className,
  showLabel,
}: {
  value: number
  max?: number
  tone?: Tone
  className?: string
  showLabel?: boolean
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', tone === 'auto' ? autoTone(pct) : TONE[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="w-10 text-right text-xs tabular-nums text-ink2">{formatPercent(pct)}</span>}
    </div>
  )
}

/** Horizontal bar list used for ranked comparisons (charts made of markup). */
export function BarList({
  rows,
  className,
  suffix = '%',
}: {
  rows: { label: string; value: number; hint?: string }[]
  className?: string
  suffix?: string
}) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className={cn('space-y-3', className)}>
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[13px] text-ink">{row.label}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink">
              {row.value}
              {suffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-royal transition-[width] duration-500"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          {row.hint && <p className="mt-1 text-[11px] text-ink3">{row.hint}</p>}
        </div>
      ))}
    </div>
  )
}
