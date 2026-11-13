import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  CheckCircle2,
  CircleSlash,
  Clock,
  GraduationCap,
  Info,
  Lock,
  Save,
  UserCheck,
} from 'lucide-react'
import type { AttendanceStatus, Role } from '@/types'
import { cn } from '@/utils/cn'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useToast } from '@/store/ui'
import {
  attendanceFor,
  classAttendance,
  classAttendanceSeries,
  className as classNameOf,
  classesForTeacher,
  getSubject,
  isTeacherAssigned,
  monthlyAttendance,
  overallAttendance,
  studentAttendance,
  studentSubjectAttendance,
  subjectsForTeacher,
  subjectName,
} from '@/store/selectors'
import { WEEK_DAYS, formatDate, formatPercent, todayISO } from '@/utils/format'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { Field, Input, Select } from '@/components/common/Form'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'
import { ProgressBar, BarList } from '@/components/common/Progress'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { BarSeriesChart, DonutChart, TrendChart } from '@/components/charts/Charts'

export type AttendanceMode = 'analytics' | 'marking' | 'student'

interface AttendanceModuleProps {
  mode: AttendanceMode
  /** restricts which classes are in scope (institution-wide when omitted) */
  classIds?: string[]
  teacherId?: string
  studentId?: string
}

const STATUS_ORDER: AttendanceStatus[] = ['present', 'late', 'absent']

export function AttendanceModule({ mode, classIds, teacherId, studentId }: AttendanceModuleProps) {
  if (mode === 'marking') return <MarkingWorkflow classIds={classIds} teacherId={teacherId} />
  if (mode === 'student') return <StudentAttendance studentId={studentId} />
  return <AttendanceAnalytics classIds={classIds} />
}

/* ================================================================== *
 * Analytics (Chairman / Director / Principal / Class teacher)         *
 * ================================================================== */

function AttendanceAnalytics({ classIds }: { classIds?: string[] }) {
  const { state } = useDemo()
  const [scope, setScope] = useState('all')
  const [range, setRange] = useState('60')

  const availableClasses = classIds?.length ? state.classes.filter((c) => classIds.includes(c.id)) : state.classes
  const activeClassIds = scope === 'all' ? availableClasses.map((c) => c.id) : [scope]
  const from = range === 'all' ? undefined : new Date(Date.now() - Number(range) * 86400000).toISOString().slice(0, 10)

  const tally = overallAttendance(state, { classIds: activeClassIds, from })
  const sessions = attendanceFor(state, { classIds: activeClassIds, from })
  const trend = useMemo(
    () => (from ? [] : []),
    [from],
  )
  const weekly = buildWeeklyBuckets(sessions)
  const series = classAttendanceSeries(state).filter((row) => activeClassIds.includes(row.id))
  const donut = [
    { name: 'Present', value: tally.present, color: 'var(--c-chart-4)' },
    { name: 'Late', value: tally.late, color: 'var(--c-chart-3)' },
    { name: 'Absent', value: tally.absent, color: 'var(--c-chart-6)' },
  ]

  const subjectRows = useMemo(() => {
    const map = new Map<string, { present: number; late: number; absent: number }>()
    for (const session of sessions) {
      const row = map.get(session.subjectId) ?? { present: 0, late: 0, absent: 0 }
      for (const status of Object.values(session.records)) row[status] += 1
      map.set(session.subjectId, row)
    }
    return Array.from(map.entries())
      .map(([subjectId, row]) => {
        const total = row.present + row.late + row.absent
        return {
          subject: subjectName(state, subjectId),
          pct: total ? Number((((row.present + row.late) / total) * 100).toFixed(1)) : 0,
          sessions: sessions.filter((s) => s.subjectId === subjectId).length,
        }
      })
      .sort((a, b) => a.pct - b.pct)
  }, [sessions, state])

  const belowTarget = series.filter((row) => row.pct < 75)
  void trend

  const columns: Column<(typeof series)[number]>[] = [
    { key: 'name', header: 'Class', sortable: true, sortValue: (row) => row.name },
    {
      key: 'pct',
      header: 'Attendance',
      sortable: true,
      sortValue: (row) => row.pct,
      render: (row) => (
        <div className="flex items-center gap-3">
          <ProgressBar className="w-40" value={row.pct} tone="auto" />
          <span className="w-14 text-right text-[13px] font-semibold tabular-nums text-ink">{formatPercent(row.pct)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Standing',
      render: (row) => (
        <StatusBadge status={row.pct >= 75 ? 'On target' : row.pct >= 60 ? 'Watch' : 'Below target'} />
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Attendance analytics</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            Aggregated from submitted class sessions in the demonstration dataset.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableClasses.length > 1 && (
            <div className="w-56">
              <Select
                selectSize="sm"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                options={[{ value: 'all', label: `All classes (${availableClasses.length})` }, ...availableClasses.map((c) => ({ value: c.id, label: c.code }))]}
              />
            </div>
          )}
          <div className="w-44">
            <Select
              selectSize="sm"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              options={[
                { value: '30', label: 'Last 30 days' },
                { value: '60', label: 'Last 60 days' },
                { value: 'all', label: 'All recorded sessions' },
              ]}
            />
          </div>
        </div>
      </div>

      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Overall attendance" value={formatPercent(tally.pct)} icon={<CalendarCheck className="h-4 w-4" />} tone={tally.pct >= 75 ? 'success' : 'warn'} hint={`${tally.total} student-mark entries`} />
        <StatCard label="Sessions recorded" value={sessions.length} icon={<Clock className="h-4 w-4" />} hint={`${availableClasses.length} classes in scope`} />
        <StatCard label="Late arrivals" value={tally.late} icon={<UserCheck className="h-4 w-4" />} tone="gold" />
        <StatCard label="Classes below 75%" value={belowTarget.length} icon={<CircleSlash className="h-4 w-4" />} tone={belowTarget.length ? 'danger' : 'success'} hint={belowTarget.length ? belowTarget.map((r) => r.code ?? r.name).join(', ') : 'All classes on target'} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly attendance trend" description="Attendance percentage by week, calculated from submitted sessions" />
          <CardBody>
            <TrendChart
              data={weekly}
              xKey="label"
              series={[{ key: 'pct', name: 'Attendance %', color: 'var(--c-chart-2)' }]}
              yFormatter={(value) => `${value}%`}
              yDomain={[0, 100]}
              height={250}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mark distribution" description={`${tally.total} entries in scope`} />
          <CardBody>
            <DonutChart data={donut} centerValue={formatPercent(tally.pct)} centerLabel="present" height={250} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Class-wise attendance" description="Lower-performing classes appear first in the table below" />
          <CardBody>
            <BarSeriesChart
              data={series.map((row) => ({ name: row.code, pct: row.pct }))}
              xKey="name"
              bars={[{ key: 'pct', name: 'Attendance %', color: 'var(--c-chart-1)' }]}
              yFormatter={(value) => `${value}%`}
              horizontal
              height={Math.max(180, series.length * 42 + 40)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Subject-wise performance" description="Weakest subjects first — useful for class teacher follow-up" />
          <CardBody>
            {subjectRows.length === 0 ? (
              <EmptyState compact title="No sessions in range" description="Widen the date range to include more submitted sessions." />
            ) : (
              <BarList rows={subjectRows.slice(0, 7).map((row) => ({ label: row.subject, value: row.pct, hint: `${row.sessions} session(s)` }))} />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Class standing" description="Attendance against the 75% institutional expectation (demonstration rule)" />
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={series}
            getRowKey={(row) => row.id}
            pageSize={6}
            dense
            emptyTitle="No attendance in scope"
            emptyDescription="Submitted class sessions will populate this table."
          />
        </div>
      </Card>
    </div>
  )
}

function buildWeeklyBuckets(sessions: { date: string; records: Record<string, AttendanceStatus> }[]) {
  const weeks = 8
  const now = new Date()
  const buckets: { label: string; start: string; end: string; pct: number; present: number; total: number }[] = []
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = new Date(now)
    end.setDate(end.getDate() - w * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    buckets.push({
      label: start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      pct: 0,
      present: 0,
      total: 0,
    })
  }
  for (const bucket of buckets) {
    let present = 0
    let total = 0
    for (const session of sessions) {
      if (session.date < bucket.start || session.date > bucket.end) continue
      for (const status of Object.values(session.records)) {
        total += 1
        if (status !== 'absent') present += 1
      }
    }
    bucket.present = present
    bucket.total = total
    bucket.pct = total ? Number(((present / total) * 100).toFixed(1)) : 0
  }
  return buckets
}

/* ================================================================== *
 * Student view                                                        *
 * ================================================================== */

function StudentAttendance({ studentId }: { studentId?: string }) {
  const { state } = useDemo()
  const { session } = useAuth()
  const id = studentId ?? session?.linkedId
  const [dayFilter, setDayFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all')

  if (!id) return <EmptyState title="No student context" description="Select a student record to view attendance." />

  const tally = studentAttendance(state, id)
  const monthly = monthlyAttendance(state, id)
  const subjects = studentSubjectAttendance(state, id)
  const days = state.attendance
    .filter((session) => session.records[id])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map((session) => ({
      date: session.date,
      day: WEEK_DAYS[(new Date(`${session.date}T00:00:00`).getDay() + 6) % 7],
      subject: subjectName(state, session.subjectId),
      status: session.records[id] as AttendanceStatus,
    }))
    .filter((row) => dayFilter === 'all' || row.status === dayFilter)

  const columns: Column<(typeof days)[number]>[] = [
    { key: 'date', header: 'Date', sortable: true, sortValue: (row) => row.date, render: (row) => formatDate(row.date) },
    { key: 'day', header: 'Day' },
    { key: 'subject', header: 'Subject' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-5">
      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Overall attendance" value={formatPercent(tally.pct)} icon={<CalendarCheck className="h-4 w-4" />} tone={tally.pct >= 75 ? 'success' : 'warn'} showDemoTag hint={tally.pct >= 75 ? 'Meets the 75% expectation' : 'Below the 75% expectation'} />
        <StatCard label="Present" value={tally.present} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatCard label="Late" value={tally.late} icon={<Clock className="h-4 w-4" />} tone="gold" />
        <StatCard label="Absent" value={tally.absent} icon={<CircleSlash className="h-4 w-4" />} tone="danger" />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly attendance" description="Percentage of sessions attended each month" />
          <CardBody>
            <TrendChart
              data={monthly}
              xKey="month"
              series={[{ key: 'pct', name: 'Attendance %', color: 'var(--c-chart-4)' }]}
              yFormatter={(value) => `${value}%`}
              yDomain={[0, 100]}
              height={240}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Subject-wise" description="Attendance by subject" />
          <CardBody className="space-y-3">
            {subjects.map((row) => (
              <div key={row.subject.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] text-ink">{row.subject.shortName}</span>
                  <span className={cn('text-xs font-semibold tabular-nums', row.tally.pct >= 75 ? 'text-success' : 'text-warn')}>
                    {formatPercent(row.tally.pct)}
                  </span>
                </div>
                <ProgressBar value={row.tally.pct} tone="auto" />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Attendance history"
          description="Most recent submitted sessions for your class"
          action={
            <div className="flex flex-wrap gap-1">
              {(['all', 'present', 'absent', 'late'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setDayFilter(filter)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[12px] font-medium capitalize transition',
                    dayFilter === filter ? 'bg-brand-soft text-brand-ink' : 'text-ink2 hover:bg-muted',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          <DataTable
            columns={columns}
            rows={days}
            getRowKey={(row) => `${row.date}-${row.subject}`}
            pageSize={8}
            dense
            emptyTitle="No sessions match this filter"
            emptyDescription="Switch the filter to see other recorded sessions."
          />
        </div>
      </Card>
    </div>
  )
}

/* ================================================================== *
 * Marking workflow (Class teacher / Subject teacher)                  *
 * ================================================================== */

function MarkingWorkflow({ classIds, teacherId }: { classIds?: string[]; teacherId?: string }) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const allowedClasses = useMemo(() => {
    if (classIds?.length) return state.classes.filter((c) => classIds.includes(c.id))
    if (teacherId) return classesForTeacher(state, teacherId)
    return state.classes
  }, [state, classIds, teacherId])

  const [classId, setClassId] = useState(allowedClasses[0]?.id ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [period, setPeriod] = useState(1)
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [submittedFor, setSubmittedFor] = useState<string | null>(null)

  const assignedSubjects = classId ? subjectsForTeacher(state, teacherId ?? '').filter((row) => row.cls.id === classId) : []
  const roster = state.students.filter((s) => s.classId === classId && s.status === 'active')

  const existing = state.attendance.find((s) => s.classId === classId && s.date === date && s.period === period)

  const authorized =
    !teacherId || !classId ? false : isTeacherAssigned(state, teacherId, classId, subjectId || undefined)

  useEffect(() => {
    if (assignedSubjects.length && !assignedSubjects.some((row) => row.subject.id === subjectId)) {
      setSubjectId(assignedSubjects[0].subject.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  useEffect(() => {
    if (existing) {
      setStatuses(existing.records)
      setSubmittedFor(existing.id)
      return
    }
    const seed: Record<string, AttendanceStatus> = {}
    roster.forEach((student) => (seed[student.id] = 'present'))
    setStatuses(seed)
    setSubmittedFor(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, period])

  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: Object.values(statuses).filter((value) => value === status).length,
  }))
  const unmarked = roster.filter((student) => !statuses[student.id]).length

  const submit = async () => {
    if (!classId || !subjectId) {
      toast.error('Select a class and subject before submitting.')
      return
    }
    if (unmarked > 0) {
      toast.error('Every student needs a status', `${unmarked} student(s) are still unmarked.`)
      return
    }
    const alreadySubmitted = Boolean(existing)
    const proceed = await confirm({
      title: alreadySubmitted ? 'Replace this attendance session?' : 'Submit attendance?',
      description: alreadySubmitted
        ? `A session already exists for ${classNameOf(state, classId)} on ${formatDate(date)} (period ${period}). Submitting again will replace it with your current markings.`
        : `${roster.length} students · ${classNameOf(state, classId)} · ${subjectName(state, subjectId)} · ${formatDate(date)} · period ${period}.`,
      confirmLabel: alreadySubmitted ? 'Replace session' : 'Submit attendance',
      tone: alreadySubmitted ? 'danger' : 'brand',
    })
    if (!proceed) return

    const result = actions.submitAttendance(
      {
        date,
        classId,
        subjectId,
        teacherId: teacherId ?? session?.linkedId ?? '',
        period,
        records: Object.fromEntries(roster.map((student) => [student.id, statuses[student.id] ?? 'present'])),
        markedBy: session?.displayName ?? 'Faculty',
      },
      { replace: alreadySubmitted },
    )
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setSubmittedFor('just-submitted')
    toast.success(result.message, `${classNameOf(state, classId)} · ${formatDate(date)}`)
  }

  const subjectOptions = teacherId
    ? assignedSubjects.map((row) => ({ value: row.subject.id, label: row.subject.name }))
    : state.subjects.map((s) => ({ value: s.id, label: s.name }))

  if (teacherId && allowedClasses.length === 0) {
    return (
      <EmptyState
        icon={Lock}
        title="No classes assigned to you"
        description="Attendance marking opens only for classes in which you hold a subject or class-teacher allocation. Ask the office of the Principal to allocate a class."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Class attendance</h2>
            <DemoTag />
            {submittedFor && <Badge tone="success" dot>Session on record</Badge>}
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            Open a class session, mark each student and submit — duplicate submissions for the same period are blocked.
          </p>
        </div>
      </div>

      {/* session context */}
      <Card className={cn(!authorized && 'border-danger/30')}>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Class / section">
            <Select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              options={allowedClasses.map((cls) => ({ value: cls.id, label: cls.code }))}
              placeholder="Select class"
            />
          </Field>
          <Field label="Subject">
            <Select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              options={subjectOptions}
              placeholder={subjectOptions.length ? 'Select subject' : 'Not allocated'}
              error={Boolean(classId && subjectOptions.length === 0)}
            />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Period">
            <Select
              value={String(period)}
              onChange={(event) => setPeriod(Number(event.target.value))}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Period ${n}` }))}
            />
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-lg border border-line bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-ink3">Active session</p>
              <p className="truncate text-[13px] font-medium text-ink">
                {classId && subjectId ? `${classNameOf(state, classId)} · ${getSubject(state, subjectId)?.shortName ?? '—'}` : 'Not opened'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {teacherId && classId && !authorized && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div className="text-xs leading-5 text-ink2">
            <p className="font-semibold text-danger">Class activity blocked for this context</p>
            You are not allocated to {classNameOf(state, classId)}
            {subjectId ? ` for ${subjectName(state, subjectId)}` : ''}. Select a class and subject from your allocations
            to continue — permissions are enforced through the route guard, not by hiding buttons.
          </div>
        </div>
      )}

      {subjectId && !existing && (
        <div className="flex items-start gap-2.5 rounded-xl border border-royal/25 bg-royal-soft px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-royal" />
          <p className="text-xs leading-5 text-ink2">
            No attendance has been recorded for this class, date and period yet. Marking defaults every student to
            <span className="font-medium text-ink"> present</span> — adjust the exceptions and submit.
          </p>
        </div>
      )}

      {existing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3">
          <div className="text-xs leading-5 text-ink2">
            <p className="font-semibold text-warn">Session already submitted</p>
            Recorded by {existing.markedBy} · {formatDate(existing.date)} · period {existing.period}. Editing below and
            resubmitting will replace the record after confirmation.
          </div>
          <Badge tone="warn">{Object.values(existing.records).filter((r) => r !== 'absent').length} attended</Badge>
        </div>
      )}

      <StatGrid className="grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students in class" value={roster.length} icon={<GraduationCap className="h-4 w-4" />} />
        <StatCard label="Present" value={counts[0].count} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatCard label="Late" value={counts[1].count} icon={<Clock className="h-4 w-4" />} tone="warn" />
        <StatCard label="Absent" value={counts[2].count} icon={<CircleSlash className="h-4 w-4" />} tone="danger" />
      </StatGrid>

      <Card>
        <CardHeader
          title="Student roster"
          description={`${classNameOf(state, classId || '')} · mark each student for this session`}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setStatuses(Object.fromEntries(roster.map((s) => [s.id, 'present' as AttendanceStatus])))}
            >
              Mark all present
            </Button>
          }
        />
        <CardBody className="space-y-2">
          {roster.length === 0 ? (
            <EmptyState compact title="No students in this class" description="Add demonstration students to this class to begin marking." />
          ) : (
            roster.map((student) => (
              <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={student.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{student.name}</p>
                    <p className="text-[11px] text-ink3">{student.admissionNo}</p>
                  </div>
                </div>
                <div className="flex shrink-0 rounded-lg border border-line bg-muted p-0.5">
                  {STATUS_ORDER.map((status) => {
                    const active = statuses[student.id] === status
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={!authorized}
                        onClick={() => setStatuses((current) => ({ ...current, [student.id]: status }))}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-[12px] font-medium capitalize transition disabled:cursor-not-allowed disabled:opacity-50',
                          active
                            ? status === 'present'
                              ? 'bg-success text-white'
                              : status === 'late'
                                ? 'bg-warn text-white'
                                : 'bg-danger text-white'
                            : 'text-ink2 hover:text-ink',
                        )}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <p className="text-xs text-ink2">
            {unmarked === 0 ? (
              <span className="text-success">All students marked</span>
            ) : (
              <span className="text-warn">{unmarked} student(s) still unmarked</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setStatuses(Object.fromEntries(roster.map((s) => [s.id, 'present' as AttendanceStatus])))}
            >
              Reset to present
            </Button>
            <Button icon={<Save className="h-4 w-4" />} disabled={!authorized || roster.length === 0} onClick={submit}>
              {existing ? 'Update session' : 'Submit attendance'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Recent sessions for this class" description="Submitted attendance history" compact />
        <CardBody className="space-y-2">
          {state.attendance
            .filter((session) => session.classId === classId)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6)
            .map((session) => {
              const present = Object.values(session.records).filter((status) => status !== 'absent').length
              const total = Object.keys(session.records).length
              return (
                <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-ink">{subjectName(state, session.subjectId)}</p>
                    <p className="text-[11px] text-ink3">
                      {formatDate(session.date)} · period {session.period} · {session.markedBy}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-ink tabular-nums">
                    {present}/{total} present
                  </span>
                </div>
              )
            })}
          {classId && state.attendance.filter((session) => session.classId === classId).length === 0 && (
            <EmptyState compact title="No sessions yet" description="Submitted attendance will be listed here." />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

/* small helpers reused by pages */
export function AttendanceSummaryCard({ classId }: { classId: string }) {
  const { state } = useDemo()
  const tally = classAttendance(state, classId)
  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink3">Class attendance</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">{formatPercent(tally.pct)}</p>
          <p className="mt-0.5 text-[11px] text-ink2">{tally.total} mark entries recorded</p>
        </div>
        <ProgressBar className="w-40" value={tally.pct} tone="auto" showLabel />
      </CardBody>
    </Card>
  )
}

export function StudentSummaryLine({ studentId, role }: { studentId: string; role?: Role }) {
  void role
  const { state } = useDemo()
  const tally = studentAttendance(state, studentId)
  return <span className={cn('font-semibold tabular-nums', tally.pct >= 75 ? 'text-success' : 'text-warn')}>{formatPercent(tally.pct)}</span>
}

export default AttendanceModule
