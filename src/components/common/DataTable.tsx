import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from './Button'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: ReactNode
  render?: (row: T) => ReactNode
  /** value used when `sortable` is enabled */
  sortValue?: (row: T) => string | number
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  /** enables the built-in search box */
  searchValue?: (row: T) => string
  searchPlaceholder?: string
  toolbar?: ReactNode
  pageSize?: number
  dense?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  loading?: boolean
  className?: string
  /** stop the table from being horizontally scrolled on small screens */
  minWidth?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  searchValue,
  searchPlaceholder = 'Search records…',
  toolbar,
  pageSize = 10,
  dense,
  emptyTitle = 'No records found',
  emptyDescription = 'Nothing matches the current filters in the demonstration dataset.',
  loading,
  className,
  minWidth = '720px',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const filtered = useMemo(() => {
    let list = rows
    if (searchValue && query.trim()) {
      const needle = query.trim().toLowerCase()
      list = list.filter((row) => searchValue(row).toLowerCase().includes(needle))
    }
    if (sort) {
      const column = columns.find((c) => c.key === sort.key)
      if (column?.sortValue) {
        const accessor = column.sortValue
        list = [...list].sort((a, b) => {
          const av = accessor(a)
          const bv = accessor(b)
          const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
          return sort.dir === 'asc' ? result : -result
        })
      }
    }
    return list
  }, [rows, query, sort, searchValue, columns])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const showToolbar = Boolean(toolbar || searchValue)

  return (
    <div className={cn('overflow-hidden rounded-panel border border-line bg-panel shadow-card', className)}>
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex flex-1 items-center gap-2">
            {searchValue && (
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(0)
                  }}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-lg border border-line bg-panel pl-9 pr-3 text-[13px] text-ink placeholder:text-ink3 transition focus:border-royal/60 focus:ring-2 focus:ring-royal/15 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
            )}
          </div>
          {toolbar}
        </div>
      )}

      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="p-5">
          <EmptyState compact title={query ? 'No matching records' : emptyTitle} description={query ? `Nothing matches “${query}”. Try a different search term.` : emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ minWidth }}>
            <thead>
              <tr className="border-b border-line bg-muted/70">
                {columns.map((column) => {
                  const active = sort?.key === column.key
                  return (
                    <th
                      key={column.key}
                      style={column.width ? { width: column.width } : undefined}
                      className={cn(
                        'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink3',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        column.className,
                      )}
                    >
                      {column.sortable && column.sortValue ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSort((current) =>
                              current?.key === column.key
                                ? current.dir === 'asc'
                                  ? { key: column.key, dir: 'desc' }
                                  : null
                                : { key: column.key, dir: 'asc' },
                            )
                          }
                          className={cn(
                            'inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-ink',
                            active && 'text-royal',
                            column.align === 'right' && 'ml-auto',
                          )}
                        >
                          {column.header}
                          {active ? (
                            <ChevronDown className={cn('h-3 w-3', sort?.dir === 'asc' && 'rotate-180')} />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/70',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 text-[13px] text-ink',
                        dense ? 'py-2' : 'py-3',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : (row as unknown as Record<string, ReactNode>)[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="text-xs text-ink2">
            {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <IconButton
              tooltip="Previous page"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <span className="px-1 text-xs tabular-nums text-ink2">
              {safePage + 1} / {pageCount}
            </span>
            <IconButton
              tooltip="Next page"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  )
}
