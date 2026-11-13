import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warn' | 'danger' | 'gold' | 'outline'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-ink2 border-line',
  brand: 'bg-brand-soft text-brand-ink border-brand/15',
  info: 'bg-royal-soft text-royal border-royal/20',
  success: 'bg-success-soft text-success border-success/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  gold: 'bg-gold-soft text-gold border-gold/30',
  outline: 'bg-transparent text-ink2 border-line-strong',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
  icon?: ReactNode
  size?: 'sm' | 'md'
}

export function Badge({ tone = 'neutral', children, className, dot, icon, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {icon}
      {children}
    </span>
  )
}

/** Consistent status → tone mapping used by every portal. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const value = status.toLowerCase()
  let tone: BadgeTone = 'neutral'
  let label = status
  if (value.includes('approve') || value === 'paid' || value === 'active' || value === 'present' || value === 'returned' || value === 'resolved') {
    tone = 'success'
    label = titleCase(status)
  } else if (value.includes('pending') || value.includes('progress') || value === 'partial' || value === 'late' || value === 'draft' || value === 'overdue') {
    tone = value === 'draft' ? 'neutral' : 'warn'
    label = titleCase(status)
  } else if (value.includes('reject') || value.includes('absent') || value === 'overdue' || value === 'inactive') {
    tone = 'danger'
    label = titleCase(status)
  } else if (value === 'open') {
    tone = 'info'
    label = 'Open'
  } else {
    label = titleCase(status)
  }
  if (value === 'overdue') tone = 'danger'
  return (
    <Badge tone={tone} dot className={className}>
      {label}
    </Badge>
  )
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('In Progress', 'In Progress')
}
