import { useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: ReactNode
  count?: number
  disabled?: boolean
}

export function Tabs({
  items,
  value,
  onChange,
  variant = 'line',
  className,
  size = 'md',
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  variant?: 'line' | 'pill'
  className?: string
  size?: 'sm' | 'md'
}) {
  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-muted p-1', className)}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 font-medium transition',
              size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[13px]',
              value === item.id
                ? 'bg-panel text-ink shadow-[0_1px_2px_rgba(13,27,46,.10)]'
                : 'text-ink2 hover:text-ink disabled:opacity-50',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-semibold',
                  value === item.id ? 'bg-brand-soft text-brand-ink' : 'bg-line text-ink2',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto border-b border-line no-scrollbar', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
          className={cn(
            'relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 font-medium transition',
            size === 'sm' ? 'h-9 text-xs' : 'h-10 text-[13px]',
            value === item.id ? 'text-brand-ink' : 'text-ink2 hover:text-ink disabled:opacity-50',
          )}
        >
          {item.label}
          {typeof item.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 py-px text-[10px] font-semibold',
                value === item.id ? 'bg-brand-soft text-brand-ink' : 'bg-muted text-ink2',
              )}
            >
              {item.count}
            </span>
          )}
          {value === item.id && (
            <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-royal" aria-hidden />
          )}
        </button>
      ))}
    </div>
  )
}

/** Stateful helper for pages that only need simple tab switching. */
export function useTabs(initial: string) {
  const [value, setValue] = useState(initial)
  return { value, setValue, onChange: (id: string) => setValue(id) }
}
