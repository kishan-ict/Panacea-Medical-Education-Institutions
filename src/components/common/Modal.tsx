import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** hides the × button — used by flow-controlled dialogs */
  hideClose?: boolean
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const

export function Modal({ open, onClose, title, description, children, footer, size = 'md', hideClose }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <div
        className="fixed inset-0 bg-[#0b1424]/45 backdrop-blur-[2px]"
        style={{ animation: 'pmei-fade .16s ease-out' }}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 my-auto w-full overflow-hidden rounded-2xl border border-line bg-panel shadow-pop',
          SIZES[size],
        )}
        style={{ animation: 'pmei-modal-in .2s cubic-bezier(.16,.84,.44,1)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-ink2">{description}</p>}
          </div>
          {!hideClose && (
            <IconButton onClick={onClose} tooltip="Close dialog">
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line bg-muted/60 px-5 py-3.5">{footer}</div>}
      </div>
      <style>{`
        @keyframes pmei-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pmei-modal-in {
          from { opacity: 0; transform: translateY(8px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  )
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const DRAWER_SIZES = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const

export function Drawer({ open, onClose, title, description, children, footer, size = 'md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[#0b1424]/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden style={{ animation: 'pmei-fade .16s ease-out' }} />
      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-panel shadow-drawer',
          DRAWER_SIZES[size],
        )}
        style={{ animation: 'pmei-drawer-in .24s cubic-bezier(.16,.84,.44,1)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-ink2">{description}</p>}
          </div>
          <IconButton onClick={onClose} tooltip="Close panel">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line bg-muted/60 px-5 py-3.5">{footer}</div>}
      </aside>
      <style>{`
        @keyframes pmei-drawer-in { from { transform: translateX(24px); opacity: .4 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </div>,
    document.body,
  )
}
