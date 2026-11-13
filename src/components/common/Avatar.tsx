import { useState } from 'react'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const

const TONES = [
  'bg-brand-soft text-brand-ink',
  'bg-royal-soft text-royal',
  'bg-gold-soft text-gold',
  'bg-success-soft text-success',
  'bg-danger-soft text-danger',
] as const

interface AvatarProps {
  name: string
  src?: string | null
  size?: keyof typeof SIZES
  className?: string
  /** deterministic tone derived from the name */
  tone?: number
}

export function Avatar({ name, src, size = 'md', className, tone }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const index =
    tone ??
    Math.abs(
      name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
    ) %
      TONES.length

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-line', SIZES[size], className)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight ring-1 ring-line',
        SIZES[size],
        TONES[index],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
