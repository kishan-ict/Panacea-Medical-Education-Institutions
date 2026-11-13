import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'royal' | 'gold' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
  block?: boolean
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand/90 active:bg-brand shadow-[0_1px_2px_rgba(13,27,46,.16)]',
  royal: 'bg-royal text-white hover:bg-royal/90 active:bg-royal/95',
  secondary: 'bg-panel text-ink border border-line hover:bg-muted hover:border-line-strong',
  ghost: 'text-ink2 hover:text-ink hover:bg-muted',
  outline: 'border border-line-strong text-ink bg-transparent hover:bg-muted',
  danger: 'bg-danger text-white hover:bg-danger/90',
  gold: 'bg-gold-soft text-gold border border-gold/35 hover:bg-gold/12',
  link: 'text-royal hover:underline underline-offset-4 px-0 bg-transparent',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className={size === 'sm' ? 'h-3.5 w-3.5 animate-spin' : 'h-4 w-4 animate-spin'} />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  )
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string
  tone?: 'default' | 'danger'
}

export function IconButton({ className, tooltip, tone = 'default', children, ...rest }: IconButtonProps) {
  return (
    <button
      type={rest.type ?? 'button'}
      title={tooltip}
      aria-label={tooltip}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink2 transition',
        'hover:bg-muted hover:text-ink disabled:pointer-events-none disabled:opacity-50',
        tone === 'danger' && 'hover:bg-danger-soft hover:text-danger',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
