import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, IndianRupee, Receipt as ReceiptIcon, Send, UserRound } from 'lucide-react'
import type { FeeRecord, Receipt } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import { className as classNameOf, classCode, programName, studentFees } from '@/store/selectors'
import { cn } from '@/utils/cn'
import { formatDate, formatMoney, todayISO } from '@/utils/format'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardFooter, CardHeader, KeyValue } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/Badge'
import { Field, Input, Select, Textarea } from '@/components/common/Form'
import { ReceiptPreview } from '@/components/modules/StudentFeesModule'

const FALLBACK_HEADS = ['Admission Fee', 'Tuition Fee', 'Examination Fee', 'Library Fee', 'Hostel Fee']
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as const
type Method = (typeof METHODS)[number]

const dueOf = (fee: FeeRecord): number => Math.max(0, fee.amount - fee.paidAmount)

/** Counter workflow: pick the student, record the payment, issue the receipt. */
export default function NewReceiptPage() {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const [params] = useSearchParams()

  const [studentId, setStudentId] = useState(() => {
    const preset = params.get('student')
    return preset && state.students.some((row) => row.id === preset) ? preset : ''
  })
  const [feeCategory, setFeeCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(todayISO)
  const [method, setMethod] = useState<Method>('Cash')
  const [reference, setReference] = useState('')
  const [remarks, setRemarks] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [issued, setIssued] = useState<Receipt | null>(null)
  const [preview, setPreview] = useState<Receipt | null>(null)

  const student = studentId ? state.students.find((row) => row.id === studentId) : undefined
  const fees = studentId ? studentFees(state, studentId) : []

  const headsFor = (id: string): string[] => {
    const rows = id ? studentFees(state, id) : []
    const unique = Array.from(new Set(rows.map((row) => row.category)))
    return unique.length ? unique : FALLBACK_HEADS
  }

  const headOptions = headsFor(studentId)
  const studentOptions = state.students.map((row) => ({
    value: row.id,
    label: `${row.name} — ${row.admissionNo} (${classCode(state, row.classId)})`,
  }))

  function changeStudent(id: string) {
    setStudentId(id)
    const heads = headsFor(id)
    setFeeCategory((current) => (current && heads.includes(current) ? current : (heads[0] ?? '')))
  }

  function pickFee(fee: FeeRecord) {
    setFeeCategory(fee.category)
    const due = dueOf(fee)
    setAmount(String(due > 0 ? due : fee.amount))
  }

  function resetForm() {
    setStudentId('')
    setFeeCategory('')
    setAmount('')
    setPaidAt(todayISO())
    setMethod('Cash')
    setReference('')
    setRemarks('')
    setAttachmentName('')
    setIssued(null)
    setPreview(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!session) {
      toast.error('No active session', 'Sign in again before issuing a receipt.')
      return
    }
    if (!studentId) {
      toast.error('Select a student', 'Choose the student this counter payment belongs to.')
      return
    }
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount', 'The amount received must be greater than zero.')
      return
    }

    const result = actions.createReceipt({
      studentId,
      feeCategory: feeCategory || headOptions[0],
      amount: value,
      paidAt,
      method,
      reference: reference.trim(),
      remarks: remarks.trim(),
      attachmentName: attachmentName.trim() ? attachmentName.trim() : null,
      createdBy: session.displayName,
    })

    if (!result.ok || !result.receipt) {
      // the store message (e.g. duplicate reference) is surfaced verbatim
      toast.error('Receipt not created', result.message)
      return
    }

    toast.success('Receipt issued', result.message)
    actions.addAudit({
      actor: session.displayName,
      actorRole: session.role,
      action: 'Issued fee receipt',
      target: result.receipt.receiptNo,
      reason: 'Counter payment recorded through the accountant portal',
    })
    setIssued(result.receipt)
    setPreview(result.receipt)
  }

  const issuedStudent = issued
    ? state.students.find((row) => row.id === issued.studentId)
    : undefined

  return (
    <Guard permission="fees.receipt.create">
      <PageHeader
        title="Create Fee Receipt"
        description="Record a counter payment against a student's fee head and generate the printable receipt."
        actions={<DemoTag label={`${state.students.length} students on file`} />}
      />

      <div className="space-y-4">
        {issued && (
          <Card className="border-success/30">
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-soft text-success">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    Receipt {issued.receiptNo} issued
                  </p>
                  <p className="text-xs text-ink2">
                    {formatMoney(issued.amount)} recorded against {issued.feeCategory} for{' '}
                    {issuedStudent?.name ?? 'the selected student'} — the student is notified in their portal.
                  </p>
                </div>
              </div>

              <div className="grid gap-x-6 rounded-xl border border-line bg-muted px-4 py-1 sm:grid-cols-2">
                <KeyValue label="Receipt no." value={issued.receiptNo} />
                <KeyValue label="Paid on" value={formatDate(issued.paidAt)} />
                <KeyValue label="Method" value={issued.method} />
                <KeyValue label="Reference" value={issued.reference} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button icon={<ReceiptIcon className="h-4 w-4" />} onClick={() => setPreview(issued)}>
                  View receipt
                </Button>
                <Button variant="secondary" onClick={resetForm}>
                  Issue another receipt
                </Button>
                <Link to="/accountant/receipts">
                  <Button variant="ghost">Receipt history</Button>
                </Link>
              </div>
            </CardBody>
            <ReceiptPreview receipt={preview} onClose={() => setPreview(null)} />
          </Card>
        )}

        <form onSubmit={submit} className="space-y-4">
          <Card>
            <CardHeader
              title="Student"
              description="Select who the payment is for — the fee heads below drive the form."
              icon={<UserRound className="h-4 w-4" />}
            />
            <CardBody className="space-y-4">
              <Field
                label="Student"
                required
                hint="Open a record from Student Search with ?student= and it arrives pre-selected."
              >
                <Select
                  value={studentId}
                  onChange={(event) => changeStudent(event.target.value)}
                  options={studentOptions}
                  placeholder="Select a student…"
                />
              </Field>

              {student && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="divide-y divide-line rounded-xl border border-line bg-muted px-4 py-1">
                    <KeyValue label="Name" value={student.name} />
                    <KeyValue label="Admission no." value={student.admissionNo} />
                    <KeyValue label="Class" value={classNameOf(state, student.classId)} />
                    <KeyValue label="Programme" value={programName(student.programCode)} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[13px] font-medium text-ink">
                      Fee heads on record — click one to fill the payment
                    </p>
                    {fees.length === 0 ? (
                      <EmptyState
                        compact
                        icon={IndianRupee}
                        title="No fee records yet"
                        description="A new fee head will be created for this student when the payment is recorded."
                      />
                    ) : (
                      fees.map((fee) => (
                        <button
                          key={fee.id}
                          type="button"
                          onClick={() => pickFee(fee)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition',
                            feeCategory === fee.category
                              ? 'border-royal/50 bg-royal-soft'
                              : 'border-line hover:border-line-strong hover:bg-muted',
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium text-ink">
                              {fee.category}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-ink3">
                              Due {formatDate(fee.dueDate)} · outstanding {formatMoney(dueOf(fee))}
                            </span>
                          </span>
                          <StatusBadge status={fee.status} />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Payment details"
              description="Enter exactly what was received at the counter."
              icon={<IndianRupee className="h-4 w-4" />}
            />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Fee head" required>
                <Select
                  value={feeCategory}
                  onChange={(event) => setFeeCategory(event.target.value)}
                  options={headOptions.map((head) => ({ value: head, label: head }))}
                  placeholder="Select fee head"
                  disabled={!student}
                />
              </Field>

              <Field label="Amount paid" required hint="Rupees received, greater than zero.">
                <Input
                  type="number"
                  min={1}
                  step="1"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                />
              </Field>

              <Field label="Payment date" required>
                <Input
                  type="date"
                  value={paidAt}
                  onChange={(event) => setPaidAt(event.target.value)}
                />
              </Field>

              <Field label="Method" required>
                <Select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as Method)}
                  options={METHODS.map((option) => ({ value: option, label: option }))}
                />
              </Field>

              <Field label="Transaction reference" hint="Duplicate references are rejected by the demo store.">
                <Input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="UPI reference / cheque number (optional)"
                />
              </Field>

              <Field
                label="Attachment name"
                hint="Simulated — only the file name is stored on the receipt."
              >
                <Input
                  value={attachmentName}
                  onChange={(event) => setAttachmentName(event.target.value)}
                  placeholder="e.g. upi-screenshot.png"
                />
              </Field>

              <Field label="Remarks" className="sm:col-span-2">
                <Textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Note printed on the receipt, e.g. part payment towards tuition fee…"
                  className="min-h-[80px]"
                />
              </Field>
            </CardBody>
            <CardFooter className="flex-wrap">
              <p className="text-xs text-ink3">
                Simulated receipt — no payment gateway is connected; nothing leaves your browser.
              </p>
              <Button type="submit" icon={<Send className="h-4 w-4" />}>
                Issue receipt
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </Guard>
  )
}
