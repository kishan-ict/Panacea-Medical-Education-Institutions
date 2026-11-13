import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface DropdownItem {
  id: string
  label: ReactNode
  icon?: ReactNode
  onSelect?: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean
}

export function Dropdown({
  trigger,
  items,
  align = 'end',
  width = 'w-56',
  header,
}: {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'start' | 'end'
  width?: string
  header?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (event: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={wrapper}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 overflow-hidden rounded-xl border border-line bg-panel py-1.5 shadow-pop',
            align === 'end' ? 'right-0' : 'left-0',
            width,
          )}
          style={{ animation: 'pmei-menu-in .14s ease-out' }}
        >
          {header && <div className="border-b border-line px-3 py-2 pb-2.5">{header}</div>}
          {items.map((item, index) => (
            <div key={item.id}>
              {item.separator && index > 0 && <div className="my-1.5 h-px bg-line" />}
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  item.tone === 'danger'
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-ink hover:bg-muted',
                )}
              >
                {item.icon && <span className="text-ink3">{item.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes pmei-menu-in { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}
