import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Eye, FileText, Fingerprint, CalendarHeart } from 'lucide-react'
import type { Role, Student } from '@/types'
import { cn } from '@/utils/cn'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import {
  className as classNameOf,
  classTeacher,
  gradeFor,
  monthlyAttendance,
  programName,
  studentAttendance,
  studentFees,
  studentReceipts,
  studentResults,
  subjectName,
} from '@/store/selectors'
import { formatDate, formatDateTime, formatMoney, formatPercent, todayISO } from '@/utils/format'
import { Card, CardBody, CardHeader, KeyValue } from '@/components/common/Card'
import { Avatar } from '@/components/common/Avatar'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Drawer, Modal } from '@/components/common/Modal'
import { Field, Select, Textarea } from '@/components/common/Form'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'
import { ProgressBar } from '@/components/common/Progress'
import { TrendChart } from '@/components/charts/Charts'
import { Tabs } from '@/components/common/Tabs'

const INSIGHT_ROLES: Role[] = ['chairman', 'director']

export interface StudentDirectoryProps {
  /** institution = all students, class = provided class ids, assigned = teacher's classes */
  scope?: 'institution' | 'class'
  classIds?: string[]
  title?: string
  description?: ReactNode
  actions?: ReactNode
  showClassFilter?: boolean
  /** opens with a student pre-selected (deep link from global search) */
  initialStudentId?: string | null
  emptyTitle?: string
  emptyDescription?: string
}

/**
 * Reusable student directory.
 *
 * When an institutional officer (Chairman / Director) opens an identifiable
 * record, a reason for access is captured and written to the simulated audit
 * log — there is no silent, unrestricted access path in the prototype.
 */
export function StudentDirectory({
  scope = 'institution',
  classIds,
  title = 'Student records',
  description = 'Demonstration roster with attendance, examination and fee context.',
  actions,
  showClassFilter = true,
  initialStudentId = null,
  emptyTitle = 'No students in view',
  emptyDescription = 'Adjust the filters to see other demonstration records.',
}: StudentDirectoryProps) {
  const { state, actions: store } = useDemo()
  const { session } = useAuth()
  const toast = useToast()

  const [program, setProgram] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Student | null>(null)
  const [reason, setReason] = useState('')
  const [reasonOpen, setReasonOpen] = useState(false)
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null)
  const [audited, setAudited] = useState<string | null>(null)

  const needsReason = Boolean(session && INSIGHT_ROLES.includes(session.role))
  const canFinance = session?.role === 'chairman' || session?.role === 'director' || session?.role === 'accountant' || session?.role === 'principal'

  const roster = useMemo(() => {
    let rows = state.students
    if (scope === 'class' && classIds?.length) rows = rows.filter((s) => classIds.includes(s.classId))
    return rows
  }, [state.students, scope, classIds])

  const filtered = useMemo(() => {
    return roster.filter((student) => {
      if (program !== 'all' && student.programCode !== program) return false
      if (classFilter !== 'all' && student.classId !== classFilter) return false
      if (statusFilter !== 'all' && student.status !== statusFilter) return false
      return true
    })
  }, [roster, program, classFilter, statusFilter])

  const requestOpen = (student: Student) => {
    if (needsReason && audited !== student.id) {
      setPendingStudent(student)
      setReason('')
      setReasonOpen(true)
      return
    }
    setSelected(student)
  }

  // deep link from the global search: /chairman/students?student=stu-01
  useEffect(() => {
    if (!initialStudentId) return
    const target = state.students.find((row) => row.id === initialStudentId)
    if (target) requestOpen(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStudentId])

  const grantAccess = () => {
    if (reason.trim().length < 8) return
    if (pendingStudent && session) {
      store.addAudit({
        actor: session.displayName,
        actorRole: session.role,
        action: 'Viewed individual student record',
        target: `${pendingStudent.admissionNo} — ${pendingStudent.name}`,
        reason: reason.trim(),
      })
      setSelected(pendingStudent)
      setAudited(pendingStudent.id)
      toast.info('Access recorded', 'This individual record view has been added to the audit activity.')
    }
    setReasonOpen(false)
    setPendingStudent(null)
    setReason('')
  }

  const columns: Column<Student>[] = [
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.name}</p>
            <p className="truncate text-[11px] text-ink3">{row.admissionNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      sortable: true,
      sortValue: (row) => classNameOf(state, row.classId),
      render: (row) => (
        <div>
          <p className="text-[13px] text-ink">{classNameOf(state, row.classId)}</p>
          <p className="text-[11px] text-ink3">{programName(row.programCode)}</p>
        </div>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      align: 'right',
      sortable: true,
      sortValue: (row) => studentAttendance(state, row.id).pct,
      render: (row) => {
        const tally = studentAttendance(state, row.id)
        return (
          <span
            className={cn(
              'text-[13px] font-semibold tabular-nums',
              tally.pct >= 75 ? 'text-success' : tally.pct >= 60 ? 'text-warn' : 'text-danger',
            )}
          >
            {formatPercent(tally.pct)}
          </span>
        )
      },
    },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (row) => (
        <div>
          <p className="text-[13px] text-ink">{row.guardianName}</p>
          <p className="text-[11px] text-ink3">{row.guardianPhone}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="secondary" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => requestOpen(row)}>
          Open
        </Button>
      ),
    },
  ]

  const classOptions = state.classes
    .filter((cls) => !classIds?.length || classIds.includes(cls.id))
    .map((cls) => ({ value: cls.id, label: cls.code }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            <DemoTag />
            {needsReason && (
              <Badge tone="brand" icon={<Fingerprint className="h-3 w-3" />}>
                Audited access
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">{description}</p>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
        <Field label="Programme">
          <Select
            selectSize="sm"
            value={program}
            onChange={(event) => setProgram(event.target.value)}
            options={[
              { value: 'all', label: 'All programmes' },
              { value: 'GNM', label: 'GNM' },
              { value: 'BSC', label: 'B.Sc. Nursing' },
              { value: 'ANM', label: 'ANM' },
            ]}
          />
        </Field>
        {showClassFilter && (
          <Field label="Class">
            <Select
              selectSize="sm"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              options={[{ value: 'all', label: 'All classes' }, ...classOptions]}
            />
          </Field>
        )}
        <Field label="Record status">
          <Select
            selectSize="sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </Field>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(row) => row.id}
        searchValue={(row) => `${row.name} ${row.admissionNo} ${row.guardianPhone}`}
        searchPlaceholder="Search name, admission number or guardian phone…"
        pageSize={8}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        toolbar={
          <span className="text-xs text-ink2">
            {filtered.length} of {roster.length} demonstration records
          </span>
        }
      />

      <Modal
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title="Reason for access"
        description="Identifiable student records may only be opened for an authorised institutional purpose. This reason is recorded in the audit activity."
        size="sm"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-[11px] text-ink3">Minimum 8 characters</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setReasonOpen(false)}>
                Cancel
              </Button>
              <Button
                icon={<Fingerprint className="h-4 w-4" />}
                disabled={reason.trim().length < 8}
                onClick={grantAccess}
              >
                Confirm & open
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {pendingStudent && (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-muted px-3 py-2.5">
              <Avatar name={pendingStudent.name} size="sm" />
              <div>
                <p className="text-[13px] font-semibold text-ink">{pendingStudent.name}</p>
                <p className="text-[11px] text-ink3">{pendingStudent.admissionNo}</p>
              </div>
            </div>
          )}
          <Field label="Purpose of access" required hint="Examples: fee concession review, parent escalation, scholarship verification.">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="State why this individual record is required…"
              className="min-h-[88px]"
            />
          </Field>
        </div>
      </Modal>

      <StudentProfileDrawer student={selected} onClose={() => setSelected(null)} canFinance={canFinance} />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Profile drawer                                                       *
 * ------------------------------------------------------------------ */

function StudentProfileDrawer({
  student,
  onClose,
  canFinance,
}: {
  student: Student | null
  onClose: () => void
  canFinance: boolean
}) {
  const { state } = useDemo()
  const [tab, setTab] = useState('academic')

  if (!student) return null

  const cls = state.classes.find((c) => c.id === student.classId)
  const teacher = cls ? classTeacher(state, cls.id) : undefined
  const tally = studentAttendance(state, student.id)
  const results = studentResults(state, student.id, true)
  const fees = studentFees(state, student.id)
  const receipts = studentReceipts(state, student.id)
  const events = state.events.filter((e) => e.createdById === student.id)
  const monthly = monthlyAttendance(state, student.id)
  const due = fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0)

  const tabs = [
    { id: 'academic', label: 'Academic' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'exams', label: 'Examinations', count: results.length },
    ...(canFinance ? [{ id: 'fees', label: 'Fees', count: fees.length }] : []),
    { id: 'events', label: 'Events', count: events.length },
    { id: 'history', label: 'History' },
  ]

  return (
    <Drawer
      open={Boolean(student)}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-3">
          <Avatar name={student.name} size="sm" />
          <span>
            <span className="block">{student.name}</span>
            <span className="mt-0.5 block text-[11px] font-normal text-ink2">
              {student.admissionNo} · {classNameOf(state, student.classId)}
            </span>
          </span>
        </span>
      }
      description={`Demonstration record — ${programName(student.programCode)} · Academic session 2026-27`}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <StatusBadge status={student.status} />
          <Button variant="secondary" onClick={onClose}>
            Close record
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <Tabs items={tabs} value={tab} onChange={setTab} size="sm" />
      </div>

      {tab === 'academic' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Enrolment" compact />
            <CardBody className="divide-y divide-line py-1">
              <KeyValue label="Programme" value={`${programName(student.programCode)} — ${cls?.name ?? '—'}`} />
              <KeyValue label="Academic session" value={student.academicYear} />
              <KeyValue label="Class teacher" value={teacher?.name ?? 'Not yet assigned'} />
              <KeyValue label="Date of birth" value={formatDate(student.dob)} />
              <KeyValue label="Admitted on" value={formatDate(student.admissionDate)} />
              <KeyValue label="Blood group" value={student.bloodGroup} />
              <KeyValue label="Contact" value={student.phone} />
              <KeyValue label="E-mail" value={student.email} />
              <KeyValue label="Address" value={student.address} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Guardian details" compact />
            <CardBody className="divide-y divide-line py-1">
              <KeyValue label="Guardian" value={student.guardianName} />
              <KeyValue label="Relation" value={student.guardianRelation} />
              <KeyValue label="Phone" value={student.guardianPhone} />
              <KeyValue label="E-mail" value={student.guardianEmail} />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-muted px-4 py-3.5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-ink3">Overall attendance</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">{formatPercent(tally.pct)}</p>
              </div>
              <div className="text-right text-xs text-ink2">
                <p>
                  {tally.present} present · {tally.late} late · {tally.absent} absent
                </p>
                <p className="mt-0.5 text-ink3">{tally.total} recorded sessions</p>
              </div>
            </div>
            <ProgressBar className="mt-3" value={tally.pct} tone="auto" />
          </div>

          <Card>
            <CardHeader title="Attendance trend" description="Weekly attendance percentage" compact />
            <CardBody>
              <TrendChart
                data={monthlyAttendance(state, student.id).map((row) => ({ ...row, pct: row.pct }))}
                xKey="month"
                series={[{ key: 'pct', name: 'Attendance %', color: 'var(--c-chart-2)' }]}
                yFormatter={(value) => `${value}%`}
                yDomain={[0, 100]}
                height={210}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Session log" description="Most recent submitted sessions" compact />
            <CardBody className="max-h-72 space-y-1.5 overflow-y-auto p-3">
              {state.attendance
                .filter((session) => session.records[student.id])
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 12)
                .map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink">{subjectName(state, session.subjectId)}</p>
                      <p className="text-[11px] text-ink3">{formatDate(session.date)} · Period {session.period}</p>
                    </div>
                    <StatusBadge status={session.records[student.id]} />
                  </div>
                ))}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'exams' && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <EmptyState compact icon={FileText} title="No published results" description="Results will appear once an examination is published." />
          ) : (
            results.map((row) => (
              <div key={`${row.exam.id}-${row.subject?.id}`} className="rounded-xl border border-line px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{row.subject?.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink3">
                      {row.exam.name} · {formatDate(row.exam.startDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-ink tabular-nums">
                      {row.marks}
                      <span className="text-xs font-medium text-ink3">/{row.maxMarks}</span>
                    </p>
                    <Badge tone={row.marks / row.maxMarks >= 0.4 ? 'success' : 'danger'}>
                      Grade {gradeFor((row.marks / row.maxMarks) * 100)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'fees' && canFinance && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-muted px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Total due</p>
              <p className="mt-1 font-display text-lg font-bold text-ink tabular-nums">{formatMoney(due)}</p>
            </div>
            <div className="rounded-xl border border-line bg-muted px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Receipts issued</p>
              <p className="mt-1 font-display text-lg font-bold text-ink tabular-nums">{receipts.length}</p>
            </div>
          </div>

          <Card>
            <CardHeader title="Fee records" compact />
            <CardBody className="space-y-2">
              {fees.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{fee.category}</p>
                    <p className="text-[11px] text-ink3">Due {formatDate(fee.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-ink tabular-nums">{formatMoney(fee.amount)}</p>
                    <StatusBadge status={fee.status} />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <EmptyState compact icon={CalendarHeart} title="No events created" description="This student has not submitted any event proposals." />
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-xl border border-line px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{event.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink3">
                      {event.category} · {formatDate(event.date)} · {event.venue}
                    </p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
                {event.reviewNote && <p className="mt-2 text-xs italic text-ink2">“{event.reviewNote}”</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Academic history" compact />
            <CardBody className="space-y-3">
              <TimelineItem
                date={student.admissionDate}
                title="Admission recorded"
                body={`Enrolled into ${classNameOf(state, student.classId)} under session ${student.academicYear}.`}
              />
              {results.length > 0 && (
                <TimelineItem
                  date={results[0].exam.startDate}
                  title={`${results[0].exam.shortName} results published`}
                  body={`${results.length} subject entries available on this record.`}
                />
              )}
              <TimelineItem
                date={todayISO()}
                title="Current standing"
                body={`Attendance ${formatPercent(tally.pct)} · ${fees.filter((f) => f.status !== 'paid').length} pending fee record(s).`}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Monthly attendance" compact />
            <CardBody className="space-y-2">
              {monthly.map((row) => (
                <div key={row.month} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-ink2">{row.month}</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {row.present}/{row.total} · {formatPercent(row.pct)}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </Drawer>
  )
}

function TimelineItem({ date, title, body }: { date: string; title: string; body: string }) {
  return (
    <div className="relative flex gap-3">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-royal" />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        <p className="text-[11px] text-ink3">{formatDateTime(date.length === 10 ? `${date}T00:00:00.000Z` : date)}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink2">{body}</p>
      </div>
    </div>
  )
}
