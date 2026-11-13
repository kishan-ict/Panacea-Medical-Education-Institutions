import { AlertTriangle, BookOpen, Library } from 'lucide-react'
import type { Book, BorrowRecord } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { activeBorrows, getStudent, overdueBorrows } from '@/store/selectors'
import { formatDate, todayISO } from '@/utils/format'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { DataTable, type Column } from '@/components/common/DataTable'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { MiniStats } from '@/components/dashboard/StatCard'

export interface LibraryModuleProps {
  scope?: 'institution' | 'student'
  /** required when scope='student' */
  studentId?: string
}

/**
 * Library — institution-wide catalogue & loan register, or a student's own
 * borrowing record. The module is read-only: the demonstration build has no
 * checkout action, so nothing here mutates the store.
 */
export function LibraryModule({ scope = 'institution', studentId }: LibraryModuleProps = {}) {
  const { state } = useDemo()

  const books = state.books
  const totalCopies = books.reduce((sum, book) => sum + book.copies, 0)
  const availableNow = books.reduce((sum, book) => sum + book.available, 0)
  const overdue = overdueBorrows(state)
  const active = activeBorrows(state)

  const catalogueColumns: Column<Book>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      sortValue: (row) => row.title,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.title}</p>
          <p className="truncate text-[11px] text-ink3">{row.author}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (row) => row.category,
      render: (row) => <span className="text-ink2">{row.category}</span>,
    },
    { key: 'isbn', header: 'ISBN', render: (row) => <span className="tabular-nums text-ink2">{row.isbn}</span> },
    { key: 'shelf', header: 'Shelf', render: (row) => <Badge tone="outline">{row.shelf}</Badge> },
    {
      key: 'copies',
      header: 'Copies',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.copies,
      render: (row) => <span className="tabular-nums text-ink2">{row.copies}</span>,
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.available,
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <span className="tabular-nums text-ink">{row.available}</span>
          <Badge tone={row.available > 0 ? 'success' : 'danger'}>
            {row.available > 0 ? 'Available' : 'Issued out'}
          </Badge>
        </div>
      ),
    },
  ]

  const loanColumns: Column<BorrowRecord>[] = [
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      sortValue: (row) => getStudent(state, row.studentId)?.name ?? '',
      render: (row) => {
        const student = getStudent(state, row.studentId)
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{student?.name ?? 'Unknown student'}</p>
            <p className="truncate text-[11px] text-ink3">{student?.admissionNo ?? '—'}</p>
          </div>
        )
      },
    },
    {
      key: 'book',
      header: 'Book',
      sortable: true,
      sortValue: (row) => books.find((book) => book.id === row.bookId)?.title ?? '',
      render: (row) => (
        <span className="text-ink2">{books.find((book) => book.id === row.bookId)?.title ?? '—'}</span>
      ),
    },
    {
      key: 'borrowed',
      header: 'Borrowed',
      sortable: true,
      sortValue: (row) => row.borrowedAt,
      render: (row) => <span className="tabular-nums text-ink2">{formatDate(row.borrowedAt)}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      sortable: true,
      sortValue: (row) => row.dueAt,
      render: (row) => <span className="tabular-nums text-ink2">{formatDate(row.dueAt)}</span>,
    },
    {
      key: 'returned',
      header: 'Returned',
      render: (row) => {
        if (row.returnedAt) return <span className="tabular-nums text-ink">{formatDate(row.returnedAt)}</span>
        if (overdue.some((entry) => entry.id === row.id)) return <StatusBadge status="overdue" />
        return <Badge tone="neutral">On loan</Badge>
      },
    },
  ]

  const historyColumns: Column<BorrowRecord>[] = [
    {
      key: 'title',
      header: 'Book',
      sortable: true,
      sortValue: (row) => books.find((book) => book.id === row.bookId)?.title ?? '',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{books.find((book) => book.id === row.bookId)?.title ?? '—'}</p>
          <p className="truncate text-[11px] text-ink3">{books.find((book) => book.id === row.bookId)?.author ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'borrowed',
      header: 'Borrowed',
      sortable: true,
      sortValue: (row) => row.borrowedAt,
      render: (row) => <span className="tabular-nums text-ink2">{formatDate(row.borrowedAt)}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      render: (row) => <span className="tabular-nums text-ink2">{formatDate(row.dueAt)}</span>,
    },
    {
      key: 'returned',
      header: 'Returned',
      sortable: true,
      sortValue: (row) => row.returnedAt ?? '',
      render: (row) => <span className="font-medium tabular-nums text-ink">{formatDate(row.returnedAt ?? '')}</span>,
    },
  ]

  /* ------------------------------ student ---------------------------- */

  if (scope === 'student') {
    if (!studentId) {
      return (
        <EmptyState
          icon={Library}
          title="No student selected"
          description="A student record must be linked before borrowing information can be shown."
        />
      )
    }

    const current = activeBorrows(state, studentId)
    const history = state.borrows
      .filter((row) => row.studentId === studentId && row.returnedAt)
      .sort((a, b) => (b.returnedAt ?? '').localeCompare(a.returnedAt ?? ''))
    const student = getStudent(state, studentId)

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">Library</h2>
              <DemoTag />
            </div>
            <p className="mt-0.5 text-[13px] text-ink2">
              {student ? `${student.name} · ${student.admissionNo}` : 'Borrowing record'} · read-only demonstration view
            </p>
          </div>
          <Badge tone="info" icon={<BookOpen className="h-3 w-3" />}>
            {current.length} on loan
          </Badge>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Currently borrowed</h3>
          {current.length === 0 ? (
            <EmptyState
              compact
              icon={BookOpen}
              title="Nothing on loan"
              description="This student has no open borrowings in the demonstration dataset."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {current.map((row) => {
                const book = books.find((entry) => entry.id === row.bookId)
                const overdueNow = row.dueAt < todayISO()
                const days = Math.round(
                  (new Date(row.dueAt).getTime() - new Date(todayISO()).getTime()) / 86400000,
                )
                return (
                  <div key={row.id} className="rounded-xl border border-line bg-panel p-4 shadow-card">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-5 text-ink">{book?.title ?? 'Book'}</p>
                      <StatusBadge status={overdueNow ? 'overdue' : 'active'} />
                    </div>
                    <p className="mt-1 text-[11px] text-ink3">{book?.author ?? ''}</p>
                    <dl className="mt-3 space-y-1 text-[12px]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink2">Borrowed on</dt>
                        <dd className="tabular-nums text-ink">{formatDate(row.borrowedAt)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink2">Due date</dt>
                        <dd className="tabular-nums text-ink">{formatDate(row.dueAt)}</dd>
                      </div>
                    </dl>
                    <p
                      className={
                        overdueNow
                          ? 'mt-2 text-[11px] font-medium text-danger'
                          : 'mt-2 text-[11px] font-medium text-success'
                      }
                    >
                      {overdueNow
                        ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
                        : `${days} day${days === 1 ? '' : 's'} remaining`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Borrowing history</h3>
          <DataTable
            columns={historyColumns}
            rows={history}
            getRowKey={(row) => row.id}
            searchValue={(row) => books.find((book) => book.id === row.bookId)?.title ?? ''}
            searchPlaceholder="Search returned books…"
            pageSize={6}
            emptyTitle="No returned books yet"
            emptyDescription="Books appear here once they have been returned to the library."
            toolbar={<span className="text-xs text-ink2">{history.length} returned loans</span>}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Catalogue</h3>
          <DataTable
            columns={catalogueColumns}
            rows={books}
            getRowKey={(row) => row.id}
            searchValue={(row) => `${row.title} ${row.author} ${row.isbn}`}
            searchPlaceholder="Search title, author or ISBN…"
            pageSize={6}
            minWidth="680px"
            toolbar={<span className="text-xs text-ink2">Read-only catalogue</span>}
          />
        </section>
      </div>
    )
  }

  /* ---------------------------- institution -------------------------- */

  const sortedLoans = [...state.borrows].sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Library</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">Institutional catalogue and circulating loan register.</p>
        </div>
        <Badge tone={overdue.length > 0 ? 'warn' : 'success'} icon={<AlertTriangle className="h-3 w-3" />}>
          {active.length} active loans
        </Badge>
      </div>

      <MiniStats
        items={[
          { label: 'Titles', value: books.length, hint: 'catalogue records' },
          { label: 'Total copies', value: totalCopies, hint: 'across all shelves' },
          { label: 'Available now', value: availableNow, hint: 'on shelf today' },
          { label: 'Overdue loans', value: overdue.length, hint: 'past the due date' },
        ]}
      />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Catalogue</h3>
        <DataTable
          columns={catalogueColumns}
          rows={books}
          getRowKey={(row) => row.id}
          searchValue={(row) => `${row.title} ${row.author} ${row.isbn}`}
          searchPlaceholder="Search title, author or ISBN…"
          pageSize={8}
          minWidth="860px"
          toolbar={<span className="text-xs text-ink2">{books.length} titles in the demonstration collection</span>}
        />
      </section>

      <Card>
        <CardHeader
          title="Loan register"
          description="Every circulation record in the demonstration dataset."
          compact
          action={
            <Badge tone={overdue.length > 0 ? 'danger' : 'neutral'}>{overdue.length} overdue</Badge>
          }
        />
        <CardBody className="p-0">
          <DataTable
            className="rounded-none border-0 shadow-none"
            columns={loanColumns}
            rows={sortedLoans}
            getRowKey={(row) => row.id}
            searchValue={(row) => {
              const student = getStudent(state, row.studentId)
              const book = books.find((entry) => entry.id === row.bookId)
              return `${student?.name ?? ''} ${student?.admissionNo ?? ''} ${book?.title ?? ''}`
            }}
            searchPlaceholder="Search student, admission number or book…"
            pageSize={8}
            minWidth="860px"
            emptyTitle="No loans recorded"
            emptyDescription="Circulation records will appear here once books are issued."
            toolbar={<span className="text-xs text-ink2">{sortedLoans.length} loan records</span>}
          />
        </CardBody>
      </Card>
    </div>
  )
}

export default LibraryModule
