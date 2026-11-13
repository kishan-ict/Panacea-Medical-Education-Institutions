import { useMemo, useState, type ReactNode } from 'react'
import { CalendarClock, Download, IndianRupee, Printer, Receipt as ReceiptIcon, Wallet } from 'lucide-react'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import { studentFees, studentReceipts } from '@/store/selectors'
import { INSTITUTION } from '@/data/constants/institution'
import { cn } from '@/utils/cn'
import { formatDate, formatDateTime, formatMoney } from '@/utils/format'
import type { Receipt } from '@/types'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Field, Select } from '@/components/common/Form'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal } from '@/components/common/Modal'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'
import { ProgressBar } from '@/components/common/Progress'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'

/* ── shared student fees module ──────────────────────────────────────────── */

interface StudentFeesModuleProps {
  studentId?: string
}

export function StudentFeesModule({ studentId }: StudentFeesModuleProps) {
  const { state } = useDemo()
  const { session } = useAuth()
  const id = studentId ?? session?.linkedId ?? ''
  const student = state.students.find((s) => s.id === id)

  const [preview, setPreview] = useState<Receipt | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fees = useMemo(() => (id ? studentFees(state, id) : []), [state, id])
  const receipts = useMemo(() => (id ? studentReceipts(state, id) : []), [state, id])

  const categories = useMemo(() => Array.from(new Set(fees.map((f) => f.category))), [fees])

  const filteredReceipts = useMemo(
    () =>
      receipts
        .filter((r) => (categoryFilter === 'all' ? true : r.feeCategory === categoryFilter))
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    [receipts, categoryFilter],
  )

  if (!student) {
    return (
      <EmptyState
        icon={Wallet}
        title="No student context"
        description="Fee records are shown against your enrolled student record in the student portal."
      />
    )
  }

  const total = fees.reduce((sum, f) => sum + f.amount, 0)
  const paid = fees.reduce((sum, f) => sum + f.paidAmount, 0)
  const outstanding = Math.max(0, total - paid)
  const paidPct = total ? Math.round((paid / total) * 100) : 0

  return (
    <div className="space-y-4">
      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Total demand" value={formatMoney(total)} icon={<IndianRupee className="h-4 w-4" />} showDemoTag hint={`${fees.length} fee heads · ${INSTITUTION.academicYear}`} />
        <StatCard label="Paid to date" value={formatMoney(paid)} icon={<Wallet className="h-4 w-4" />} tone="success" hint={`${paidPct}% of demand cleared`} />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          icon={<CalendarClock className="h-4 w-4" />}
          tone={outstanding > 0 ? 'warn' : 'success'}
          hint={outstanding > 0 ? 'Payable at the accounts counter' : 'No dues pending'}
        />
        <StatCard label="Receipts issued" value={receipts.length} icon={<ReceiptIcon className="h-4 w-4" />} tone="royal" hint="Every receipt opens with a printable preview" />
      </StatGrid>

      <Card>
        <CardHeader
          title="Fee statement"
          description={`Demand vs collection for ${student.name} · ${student.admissionNo}`}
          action={<ProgressBar className="w-40" value={paidPct} tone="auto" showLabel />}
        />
        <CardBody className="space-y-2">
          {fees.length === 0 ? (
            <EmptyState compact title="No fee records" description="Fee demand lines for this student will appear here." />
          ) : (
            fees.map((fee) => (
              <div key={fee.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{fee.category}</p>
                  <p className="text-[11px] text-ink3">
                    Due {formatDate(fee.dueDate)} · {fee.academicYear}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-[13px] font-semibold tabular-nums text-ink">{formatMoney(fee.paidAmount)}</p>
                    <p className="text-[11px] text-ink3">of {formatMoney(fee.amount)}</p>
                  </div>
                  <StatusBadge status={fee.status} />
                </div>
              </div>
            ))
          )}
        </CardBody>
        <CardFooter>
          <p className="text-xs text-ink2">
            {outstanding > 0 ? (
              <>
                Outstanding dues: <span className="font-semibold text-warn">{formatMoney(outstanding)}</span>
              </>
            ) : (
              <span className="font-medium text-success">All recorded dues are settled</span>
            )}
          </p>
          <DemoTag label="Demo payments" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader title="Receipt history" description="Issued by the accounts office — open any receipt to preview and print." />
        <div className="p-4">
          <div className="mb-3 max-w-xs">
            <Field label="Filter by fee head">
              <Select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                options={[
                  { value: 'all', label: 'All fee heads' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </Field>
          </div>
          <ReceiptTable receipts={filteredReceipts} onOpen={setPreview} />
        </div>
      </Card>

      <ReceiptPreview receipt={preview} studentName={student.name} admissionNo={student.admissionNo} onClose={() => setPreview(null)} />
    </div>
  )
}

/* --------------------------- shared table --------------------------- */

export function ReceiptTable({
  receipts,
  onOpen,
  showStudent = false,
  studentNames = {},
}: {
  receipts: Receipt[]
  onOpen?: (receipt: Receipt) => void
  showStudent?: boolean
  studentNames?: Record<string, string>
}) {
  const columns: Column<Receipt>[] = [
    {
      key: 'receiptNo',
      header: 'Receipt No.',
      sortable: true,
      sortValue: (row) => row.receiptNo,
      render: (row) => (
        <span className="font-medium text-royal">{row.receiptNo}</span>
      ),
    },
    ...(showStudent
      ? [
          {
            key: 'studentId',
            header: 'Student',
            sortable: true,
            sortValue: (row: Receipt) => studentNames[row.studentId] ?? row.studentId,
            render: (row: Receipt) => <span className="text-ink">{studentNames[row.studentId] ?? '—'}</span>,
          },
        ]
      : []),
    { key: 'feeCategory', header: 'Fee head', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as const,
      sortable: true,
      sortValue: (row) => row.amount,
      render: (row) => <span className="font-semibold tabular-nums text-ink">{formatMoney(row.amount)}</span>,
    },
    { key: 'method', header: 'Method', render: (row) => <Badge tone="neutral">{row.method}</Badge> },
    {
      key: 'paidAt',
      header: 'Paid on',
      sortable: true,
      sortValue: (row) => row.paidAt,
      render: (row) => <span className="text-ink2">{formatDate(row.paidAt)}</span>,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => <span className="text-[12px] text-ink3">{row.reference}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={receipts}
      getRowKey={(row) => row.id}
      onRowClick={onOpen}
      pageSize={8}
      dense
      emptyTitle="No receipts issued yet"
      emptyDescription="Receipts appear here as soon as the accounts office records a payment."
    />
  )
}

/* -------------------------- receipt preview -------------------------- */

export function ReceiptPreview({
  receipt,
  studentName,
  admissionNo,
  onClose,
  onPrintExtra,
}: {
  receipt: Receipt | null
  studentName?: string
  admissionNo?: string
  onClose: () => void
  onPrintExtra?: ReactNode
}) {
  const { state } = useDemo()
  const toast = useToast()

  const student = receipt ? state.students.find((s) => s.id === receipt.studentId) : undefined
  const name = studentName ?? student?.name ?? '—'
  const adm = admissionNo ?? student?.admissionNo ?? '—'

  function simulateDownload() {
    toast.info('Download simulated', 'No file is generated in this demonstration — use Print for a PDF copy.')
  }

  function printReceipt() {
    window.print()
  }

  return (
    <Modal
      open={receipt !== null}
      onClose={onClose}
      title="Fee receipt preview"
      description="Formatted as printed by the accounts office."
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <DemoTag label="Simulated receipt" />
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={simulateDownload}>
              Download PDF
            </Button>
            <Button icon={<Printer className="h-4 w-4" />} onClick={printReceipt}>
              Print receipt
            </Button>
          </div>
        </div>
      }
    >
      {receipt && (
        <div className="rounded-xl border border-line bg-panel p-5">
          {/* printed header */}
          <div className="border-b-2 border-ink/80 pb-3 text-center">
            <p className="font-display text-base font-bold tracking-tight text-ink">{INSTITUTION.name}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink2">Fee Receipt — Academic Session {INSTITUTION.academicYear}</p>
            <p className="mt-0.5 text-[11px] text-ink3">
              {INSTITUTION.address} · {INSTITUTION.phone} · {INSTITUTION.email}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-ink3">Received from</p>
              <p className="mt-1 text-[15px] font-semibold text-ink">{name}</p>
              <p className="text-xs text-ink2">Admission No. {adm}</p>
              <p className="text-xs text-ink2">
                {student?.programCode ?? ''} · {state.classes.find((c) => c.id === student?.classId)?.name ?? ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Receipt number</p>
              <p className="mt-1 font-medium text-royal">{receipt.receiptNo}</p>
              <p className="text-xs text-ink2">Issued {formatDateTime(receipt.createdAt)}</p>
              <Badge tone="success" className="mt-1">PAID</Badge>
            </div>
          </div>

          <table className="mt-4 w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-line bg-muted/70 text-[11px] uppercase tracking-wide text-ink3">
                <th className="px-3 py-2">Particulars</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{receipt.feeCategory}</p>
                  <p className="text-[11px] text-ink3">{receipt.remarks || 'Fee payment'}</p>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                  {formatMoney(receipt.amount)}
                </td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-3 py-2 text-ink2">Payment mode</td>
                <td className="px-3 py-2 text-right text-ink">{receipt.method}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="px-3 py-2 text-ink2">Transaction reference</td>
                <td className="px-3 py-2 text-right text-ink">{receipt.reference}</td>
              </tr>
              <tr>
                <td className="px-3 py-3 text-sm font-semibold text-ink">Total received</td>
                <td className="px-3 py-3 text-right font-display text-lg font-bold tabular-nums text-ink">
                  {formatMoney(receipt.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="text-[11px] leading-4 text-ink3">
              <p>Depositary signature</p>
              <p className="mt-6 w-40 border-t border-dashed border-line-strong" />
              <p className="mt-1">Accounts Office</p>
            </div>
            <div className="text-right text-[11px] leading-4 text-ink3">
              <p>Received with thanks</p>
              <p className="mt-6 w-40 border-t border-dashed border-line-strong" />
              <p className="mt-1">For {INSTITUTION.shortName}</p>
            </div>
          </div>

          <p className={cn('mt-4 border-t border-line pt-3 text-center text-[10px] text-ink3')}>
            Computer-generated demo receipt — no monetary transaction has taken place. {INSTITUTION.website}
          </p>
        </div>
      )}
      {onPrintExtra}
    </Modal>
  )
}

export default StudentFeesModule
