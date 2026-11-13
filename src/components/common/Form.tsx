import {
  createContext,
  useContext,
  useId,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

/* ------------------------------ Field ----------------------------- */

interface FieldContextValue {
  id: string
}

const FieldContext = createContext<FieldContextValue | null>(null)

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  action,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
  action?: ReactNode
}) {
  const id = useId()
  return (
    <FieldContext.Provider value={{ id }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        {(label || action) && (
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={id} className="text-[13px] font-medium text-ink">
              {label}
              {required && <span className="ml-0.5 text-danger">*</span>}
            </label>
            {action}
          </div>
        )}
        {children}
        {error ? (
          <p className="text-xs font-medium text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink3">{hint}</p>
        ) : null}
      </div>
    </FieldContext.Provider>
  )
}

function useFieldId(explicit?: string): string {
  const ctx = useContext(FieldContext)
  const generated = useId()
  return explicit ?? ctx?.id ?? generated
}

/* ------------------------------ Input ----------------------------- */

const CONTROL =
  'w-full rounded-lg border bg-panel text-sm text-ink transition placeholder:text-ink3 ' +
  'focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70'

const controlTone = (error?: boolean) =>
  error
    ? 'border-danger/50 focus:border-danger focus:ring-2 focus:ring-danger/15'
    : 'border-line focus:border-royal/60 focus:ring-2 focus:ring-royal/15 hover:border-line-strong'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  inputSize?: 'sm' | 'md'
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, inputSize = 'md', leading, trailing, id, ...rest },
  ref,
) {
  const fieldId = useFieldId(id)
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3">{leading}</span>
      )}
      <input
        ref={ref}
        id={fieldId}
        className={cn(
          CONTROL,
          controlTone(error),
          inputSize === 'md' ? 'h-10 px-3' : 'h-9 px-2.5 text-[13px]',
          leading ? 'pl-9' : undefined,
          trailing ? 'pr-9' : undefined,
          className,
        )}
        {...rest}
      />
      {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  )
})

/* ---------------------------- Textarea ---------------------------- */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, id, ...rest },
  ref,
) {
  const fieldId = useFieldId(id)
  return (
    <textarea
      ref={ref}
      id={fieldId}
      className={cn(
        CONTROL,
        controlTone(error),
        'min-h-[96px] resize-y px-3 py-2 leading-relaxed',
        className,
      )}
      {...rest}
    />
  )
})

/* ----------------------------- Select ----------------------------- */

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  error?: boolean
  placeholder?: string
  selectSize?: 'sm' | 'md'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, error, placeholder, className, selectSize = 'md', id, ...rest },
  ref,
) {
  const fieldId = useFieldId(id)
  return (
    <div className="relative">
      <select
        ref={ref}
        id={fieldId}
        className={cn(
          CONTROL,
          controlTone(error),
          'cursor-pointer appearance-none pr-9',
          selectSize === 'md' ? 'h-10 pl-3' : 'h-9 pl-2.5 text-[13px]',
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
    </div>
  )
})

/* ---------------------------- Checkbox ---------------------------- */

export function Checkbox({
  label,
  description,
  className,
  checked,
  onChange,
  disabled,
  id,
}: {
  label?: ReactNode
  description?: ReactNode
  className?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
}) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <label
      htmlFor={fieldId}
      className={cn('group flex cursor-pointer items-start gap-2.5 select-none', disabled && 'opacity-60', className)}
    >
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line-strong accent-[var(--c-royal)]"
      />
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13px] font-medium text-ink">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-ink2">{description}</span>}
        </span>
      )}
    </label>
  )
}

/* ----------------------------- Switch ----------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-[13px] font-medium text-ink">{label}</p>}
          {description && <p className="mt-0.5 text-xs text-ink2">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-60',
          checked ? 'bg-royal' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

/* --------------------------- Radio group -------------------------- */

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  name,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: ReactNode; description?: ReactNode }[]
  name?: string
  className?: string
}) {
  const groupName = useId()
  return (
    <div className={cn('grid gap-2', className)} role="radiogroup">
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition',
            value === option.value ? 'border-royal/50 bg-royal-soft' : 'border-line hover:bg-muted',
          )}
        >
          <input
            type="radio"
            name={name ?? groupName}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-0.5 h-4 w-4 accent-[var(--c-royal)]"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-ink">{option.label}</span>
            {option.description && <span className="mt-0.5 block text-xs text-ink2">{option.description}</span>}
          </span>
        </label>
      ))}
    </div>
  )
}

/* --------------------------- Search input ------------------------- */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          CONTROL,
          controlTone(false),
          'h-9 pl-9 pr-8 text-[13px]',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink3 transition hover:bg-muted hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
