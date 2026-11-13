import { useState } from 'react'
import { cn } from '@/utils/cn'
import { INSTITUTION } from '@/data/constants/institution'

/**
 * Genuine institutional mark, loaded from the official website.
 * A monogram is used only as a graceful fallback when the asset is
 * unavailable (for example, during an offline presentation).
 */
export function InstitutionLogo({
  size = 40,
  className,
  variant,
}: {
  size?: number
  className?: string
  variant?: 'light' | 'dark'
}) {
  const [failed, setFailed] = useState(false)
  const src = variant === 'dark' ? INSTITUTION.logoDark : INSTITUTION.logoLight

  if (failed) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-xl bg-brand font-display font-extrabold text-white',
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.34 }}
        aria-label={INSTITUTION.name}
      >
        P
      </span>
    )
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={`${INSTITUTION.name} emblem`}
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-xl object-contain', className)}
      style={{ width: size, height: size }}
    />
  )
}
