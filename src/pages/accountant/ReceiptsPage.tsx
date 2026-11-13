import { useState } from 'react'
import type { Receipt } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { formatMoney, todayISO } from '@/utils/format'
import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DemoTag } from '@/components/common/EmptyState'
import { Field, Select } from '@/components/common/Form'
import { MiniStats } from '@/components/dashboard/StatCard'
import { ReceiptPreview, ReceiptTable } from '@/components/modules/StudentFeesModule'

const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as const

/** Full receipt register with fee-head and payment-method filters. */
export default function ReceiptsPage() {
  const { state } = useDemo()
  const [selected, setSelected] = useState<Receipt | null>(null)
  const [head, setHead] = useState('all')
  const [method, setMethod] = useState('all')

  const nameMap = Object.fromEntries(
    state.students.map((student) => [student.id, student.name] as const),
  )
  const headOptions = Array.from(new Set(state.receipts.map((row) => row.feeCategory)))

  const totalCollected = state.receipts.reduce((sum, row) => sum + row.amount, 0)
  const month = todayISO().slice(0, 7)
  const thisMonth = state.receipts.filter((row) => row.paidAt.slice(0, 7) === month).length

  const filtered = state.receipts
    .filter((row) => (head === 'all' ? true : row.feeCategory === head))
    .filter((row) => (method === 'all' ? true : row.method === method))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))

  return (
    <Guard permission="fees.overview">
      <PageHeader
        title="Receipt History"
        description="Every receipt issued by the accounts office — filter the register and open a row to preview or print it."
        actions={<DemoTag label={`${formatMoney(totalCollected)} collected`} />}
      />

      <div className="space-y-4">
        <MiniStats
          items={[
            { label: 'Total receipts', value: state.receipts.length, hint: 'issued in this dataset' },
            { label: 'Total collected', value: formatMoney(totalCollected), hint: 'sum of receipt amounts' },
            { label: 'This month', value: thisMonth, hint: 'receipts recorded' },
          ]}
        />

        <Card>
          <CardHeader
            title="Issued receipts"
            description="Newest first — select a fee head or payment method to narrow the register."
          />
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
              <Field label="Fee head">
                <Select
                  selectSize="sm"
                  value={head}
                  onChange={(event) => setHead(event.target.value)}
                  options={[
                    { value: 'all', label: 'All fee heads' },
                    ...headOptions.map((option) => ({ value: option, label: option })),
                  ]}
                />
              </Field>
              <Field label="Method">
                <Select
                  selectSize="sm"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  options={[
                    { value: 'all', label: 'All methods' },
                    ...METHODS.map((option) => ({ value: option, label: option })),
                  ]}
                />
              </Field>
            </div>

            <ReceiptTable
              receipts={filtered}
              showStudent
              studentNames={nameMap}
              onOpen={setSelected}
            />
          </CardBody>
        </Card>

        <ReceiptPreview receipt={selected} onClose={() => setSelected(null)} />
      </div>
    </Guard>
  )
}
