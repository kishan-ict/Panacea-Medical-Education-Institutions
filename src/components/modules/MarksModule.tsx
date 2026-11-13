import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookX,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Megaphone,
  Save,
  TrendingUp,
} from 'lucide-react'
import type { Mark, Role } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useToast } from '@/store/ui'
import {
  className as classNameOf,
  classesForTeacher,
  examAverage,
  examClassSeries,
  gradeFor,
  pendingMarks,
  publishedExams,
  resultSummary,
  studentResults,
  subjectPerformance,
  subjectName,
  topPerformers,
} from '@/store/selectors'
import { can } from '@/routes/permissions'
import { cn } from '@/utils/cn'
import { formatDate, formatPercent } from '@/utils/format'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { Field, Input, Select } from '@/components/common/Form'
import { DataTable, type Column } from '@/components/common/DataTable'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'
import { Tabs } from '@/components/common/Tabs'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { BarList, ProgressBar } from '@/components/common/Progress'
import { BarSeriesChart, TrendChart } from '@/components/charts/Charts'

/* ── shared marks module ─────────────────────────────────────────────────── */

export type MarksMode = 'entry' | 'student' | 'overview'

interface MarksModuleProps {
  mode: MarksMode
  /** entry mode: restricts classes (teacher allocations) */
  classIds?: string[]
  teacherId?: string
  /** student mode: overrides the signed-in student */
  studentId?: string
}

export function MarksModule({ mode, classIds, teacherId, studentId }: MarksModuleProps) {
  if (mode === 'student') return <StudentResults studentId={studentId} />
  if (mode === 'overview') return <ExamOverview classIds={classIds} />
  return <MarksEntry classIds={classIds} teacherId={teacherId} />
}

/* ================================================================== *
 * Marks entry (class teacher / subject teacher)                       *
 * ================================================================== */

interface EntryRow {
  studentId: string
  name: string
  admissionNo: string
  value: string
  status: 'draft' | 'published'
}

function MarksEntry({ classIds, teacherId }: { classIds?: string[]; teacherId?: string }) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const role = session?.role as Role | undefined
  const canPublish = can(role, 'marks.publish')

  const allowedClasses = useMemo(() => {
    if (classIds?.length) return state.classes.filter((c) => classIds.includes(c.id))
    if (teacherId) return classesForTeacher(state, teacherId)
    return state.classes
  }, [state, classIds, teacherId])

  const editableExams = useMemo(
    () => [...state.exams].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [state.exams],
  )

  const [examId, setExamId] = useState(
    editableExams.find((e) => !e.published)?.id ?? editableExams[0]?.id ?? '',
  )
  const [classId, setClassId] = useState(allowedClasses[0]?.id ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [maxMarks, setMaxMarks] = useState(100)
  const [rows, setRows] = useState<EntryRow[]>([])

  const exam = state.exams.find((e) => e.id === examId)
  const roster = useMemo(
    () => state.students.filter((s) => s.classId === classId && s.status === 'active').sort((a, b) => a.name.localeCompare(b.name)),
    [state.students, classId],
  )

  const subjectOptions = useMemo(() => {
    const subjects = state.subjects.filter((s) =>
      state.subjectAssignments.some(
        (a) =>
          a.classId === classId &&
          a.subjectId === s.id &&
          (!teacherId || a.teacherId === teacherId),
      ),
    )
    return subjects
  }, [state.subjects, state.subjectAssignments, classId, teacherId])

  // load existing marks for the selected context
  useEffect(() => {
    if (!subjectId || !examId || !classId) {
      setRows([])
      return
    }
    const existing = state.marks.filter(
      (m) => m.examId === examId && m.classId === classId && m.subjectId === subjectId,
    )
    if (existing.length) setMaxMarks(existing[0].maxMarks)
    setRows(
      roster.map((student) => {
        const mark = existing.find((m) => m.studentId === student.id)
        return {
          studentId: student.id,
          name: student.name,
          admissionNo: student.admissionNo,
          value: mark ? String(mark.marks) : '',
          status: mark?.status ?? 'draft',
        }
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, classId, subjectId])

  // reset subject when class changes
  useEffect(() => {
    if (subjectOptions.length && !subjectOptions.some((s) => s.id === subjectId)) {
      setSubjectId(subjectOptions[0].id)
    }
    if (!subjectOptions.length) setSubjectId('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, examId])

  const entered = rows.filter((r) => r.value !== '').length
  const invalid = rows.find((r) => {
    if (r.value === '') return false
    const n = Number(r.value)
    return Number.isNaN(n) || n < 0 || n > maxMarks
  })
  const hasDrafts = rows.some((r) => r.value !== '' && r.status === 'draft')

  async function save(status: 'draft' | 'published') {
    if (!exam || !classId || !subjectId) {
      toast.error('Select an examination, class and subject first.')
      return
    }
    if (status === 'published' && !canPublish) {
      toast.error('Your role can save draft marks only.', 'Publication requires the marks.publish permission.')
      return
    }
    if (invalid) {
      toast.error(
        `Marks must be between 0 and ${maxMarks}.`,
        `${invalid.name} has “${invalid.value}” entered.`,
      )
      return
    }
    const filled = rows.filter((r) => r.value !== '')
    if (!filled.length) {
      toast.error('Enter at least one mark before saving.')
      return
    }
    if (status === 'published') {
      const proceed = await confirm({
        title: 'Publish these marks?',
        description: `${filled.length} student(s) in ${classNameOf(state, classId)} · ${subjectName(state, subjectId)} · ${exam.name}. Published marks become visible to students immediately.`,
        confirmLabel: 'Publish marks',
        tone: 'brand',
      })
      if (!proceed) return
    }

    const payload: Mark[] = filled.map((row) => ({
      id: '',
      examId,
      classId,
      subjectId,
      studentId: row.studentId,
      marks: Number(row.value),
      maxMarks,
      status,
    }))
    const result = actions.saveMarks(
      payload.map(({ examId: e, classId: c, subjectId: s, studentId, marks, maxMarks: mx, status: st }) => ({
        examId: e,
        classId: c,
        subjectId: s,
        studentId,
        marks,
        maxMarks: mx,
        status: st,
      })),
    )
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    if (status === 'published') {
      actions.addAudit({
        actor: session?.displayName ?? 'Faculty',
        actorRole: role ?? 'subjectTeacher',
        action: 'Published examination marks',
        target: `${exam.shortName} · ${classNameOf(state, classId)} · ${subjectName(state, subjectId)}`,
        reason: 'Marks publication through the staff portal',
      })
      actions.notify({
        title: 'Results published',
        body: `${exam.shortName} marks for ${subjectName(state, subjectId)} are now visible.`,
        tone: 'success',
        audience: ['student'],
      })
    }
    toast.success(result.message, `${filled.length} record(s) · ${exam.shortName}`)
    setRows((current) => current.map((r) => (r.value !== '' ? { ...r, status } : r)))
  }

  async function publishExam() {
    if (!exam) return
    const proceed = await confirm({
      title: `Publish ${exam.shortName} results?`,
      description: 'Every saved mark for this examination will be released to student portals and the exam will be marked published.',
      confirmLabel: 'Publish exam',
      tone: 'brand',
    })
    if (!proceed) return
    actions.publishExam(exam.id)
    actions.addAudit({
      actor: session?.displayName ?? 'Faculty',
      actorRole: role ?? 'principal',
      action: 'Published examination',
      target: exam.name,
      reason: 'Release of compiled results after moderation',
    })
    actions.notify({
      title: `${exam.shortName} results published`,
      body: 'Compiled results are now available on student portals.',
      tone: 'success',
      audience: ['student', 'staff'],
    })
    toast.success(`${exam.shortName} published to student records.`)
  }

  if (allowedClasses.length === 0) {
    return (
      <EmptyState
        icon={Lock}
        title="No classes in your allocation"
        description="Marks entry opens only for classes and subjects allocated to you by the office of the Principal."
      />
    )
  }

  if (!exam) {
    return <EmptyState icon={BookX} title="No examinations configured" description="Examinations appear here once they are added to the demo dataset." />
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Marks entry"
          description="Enter subject marks per student — validate, save as draft, then publish where your role allows."
          action={
            <div className="flex items-center gap-2">
              <DemoTag />
              <StatusBadge status={exam.published ? 'published' : exam.type === 'Final Examination' ? 'scheduled' : 'draft'} />
            </div>
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Examination">
            <Select
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              options={editableExams.map((e) => ({
                value: e.id,
                label: `${e.shortName}${e.published ? '' : ' (open)'}`,
              }))}
            />
          </Field>
          <Field label="Class / section">
            <Select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              placeholder="Select class"
              options={allowedClasses.map((cls) => ({ value: cls.id, label: cls.code }))}
            />
          </Field>
          <Field label="Subject">
            <Select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              placeholder={subjectOptions.length ? 'Select subject' : 'Not allocated'}
              error={Boolean(classId && subjectOptions.length === 0)}
              options={subjectOptions.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
          <Field label="Maximum marks" hint="Applied to every row on save">
            <Input
              type="number"
              min={1}
              value={maxMarks}
              onChange={(event) => setMaxMarks(Math.max(1, Number(event.target.value) || 1))}
            />
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-lg border border-line bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-ink3">Exam window</p>
              <p className="truncate text-[13px] font-medium text-ink">
                {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {classId && subjectOptions.length === 0 && (
        <EmptyState
          icon={Lock}
          compact
          title="No subject allocated for this class"
          description="Ask the office of the Principal to allocate a subject before entering marks."
        />
      )}

      {subjectId && (
        <Card>
          <CardHeader
            title={`Roster — ${classNameOf(state, classId)}`}
            description={`${subjectName(state, subjectId)} · ${exam.name} · ${roster.length} students`}
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRows((current) => current.map((r) => ({ ...r, value: '' })))}
              >
                Clear column
              </Button>
            }
          />
          <CardBody className="space-y-2">
            {rows.map((row, index) => {
              const n = row.value === '' ? null : Number(row.value)
              const bad = n !== null && (Number.isNaN(n) || n < 0 || n > maxMarks)
              return (
                <div
                  key={row.studentId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-6 text-right text-[11px] tabular-nums text-ink3">{index + 1}</span>
                    <Avatar name={row.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{row.name}</p>
                      <p className="text-[11px] text-ink3">{row.admissionNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {row.status === 'published' && (
                      <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                        published
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        inputSize="sm"
                        className={cn('w-24 text-right tabular-nums', bad && 'border-danger/60')}
                        value={row.value}
                        placeholder="—"
                        aria-label={`Marks for ${row.name}`}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((r) =>
                              r.studentId === row.studentId ? { ...r, value: event.target.value } : r,
                            ),
                          )
                        }
                      />
                      <span className="w-10 text-[12px] tabular-nums text-ink3">/ {maxMarks}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {rows.length === 0 && (
              <EmptyState compact title="No students in this class" description="The roster for this class will appear here." />
            )}
          </CardBody>
          <CardFooter>
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink2">
              <span>
                {entered}/{rows.length} entered
              </span>
              {invalid ? (
                <span className="font-medium text-danger">
                  {invalid.name}: “{invalid.value}” is outside 0–{maxMarks}
                </span>
              ) : hasDrafts && entered > 0 ? (
                <span className="font-medium text-warn">Unsaved draft changes</span>
              ) : entered > 0 ? (
                <span className="font-medium text-success">All entered marks saved</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<Save className="h-4 w-4" />} onClick={() => save('draft')}>
                Save draft
              </Button>
              {canPublish ? (
                <Button icon={<Megaphone className="h-4 w-4" />} onClick={() => save('published')}>
                  Save & publish
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled
                  icon={<Lock className="h-4 w-4" />}
                  title="Publication requires the marks.publish permission"
                >
                  Publish locked
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {canPublish && !exam.published && (
        <Card>
          <CardHeader
            title={`Release ${exam.shortName} results`}
            description="Publishes every saved mark for this examination to student portals in one step."
            action={
              <Button icon={<Megaphone className="h-4 w-4" />} onClick={publishExam}>
                Publish whole exam
              </Button>
            }
          />
          <CardBody>
            <p className="text-xs leading-5 text-ink2">
              {pendingMarks(state, teacherId)} mark slot(s) are still unentered across your allocations —
              students only see subjects that have been saved. Draft marks remain hidden until publication.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

/* ================================================================== *
 * Student results view                                                *
 * ================================================================== */

function StudentResults({ studentId }: { studentId?: string }) {
  const { state } = useDemo()
  const { session } = useAuth()
  const id = studentId ?? session?.linkedId ?? ''
  const student = state.students.find((s) => s.id === id)

  const [examTab, setExamTab] = useState('')

  const exams = useMemo(() => {
    if (!id) return []
    const withResults = publishedExams(state).filter((exam) =>
      state.marks.some((m) => m.examId === exam.id && m.studentId === id && m.status === 'published'),
    )
    return withResults.sort((a, b) => b.startDate.localeCompare(a.startDate))
  }, [state, id])

  useEffect(() => {
    if (exams.length && !exams.some((e) => e.id === examTab)) setExamTab(exams[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams])

  if (!student) {
    return (
      <EmptyState
        icon={Lock}
        title="No student context"
        description="Results are shown against your enrolled student record in the student portal."
      />
    )
  }

  if (!exams.length) {
    return (
      <EmptyState
        icon={BookX}
        title="No published results yet"
        description="Your teachers are still entering marks. Published examination results will appear here with subject-wise scores and grades."
      />
    )
  }

  const active = exams.find((e) => e.id === examTab) ?? exams[0]
  const summary = resultSummary(state, student.id, active.id)
  const rows = studentResults(state, student.id, true).filter((row) => row.exam.id === active.id)

  const trend = [...exams]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((exam) => ({ label: exam.shortName, pct: resultSummary(state, student.id, exam.id).percentage }))

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      sortValue: (row) => row.subject?.name ?? '',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-royal-soft text-royal">
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-ink">{row.subject?.name ?? '—'}</p>
            <p className="text-[11px] text-ink3">{row.subject?.code ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'marks',
      header: 'Score',
      sortable: true,
      sortValue: (row) => row.marks,
      render: (row) => (
        <div className="flex items-center gap-3">
          <ProgressBar className="w-32" value={row.marks} max={row.maxMarks} tone="auto" />
          <span className="w-16 text-right text-[13px] font-semibold tabular-nums text-ink">
            {row.marks}/{row.maxMarks}
          </span>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (row) => (
        <Badge tone={gradeFor((row.marks / row.maxMarks) * 100) === 'F' ? 'danger' : 'success'}>
          {gradeFor((row.marks / row.maxMarks) * 100)}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Tabs
        items={exams.map((exam) => ({ id: exam.id, label: exam.shortName }))}
        value={active.id}
        onChange={setExamTab}
      />

      <StatGrid className="lg:grid-cols-4">
        <StatCard
          label="Aggregate"
          value={formatPercent(summary.percentage)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone={summary.percentage >= 60 ? 'success' : 'warn'}
          showDemoTag
          hint={`${summary.obtained} of ${summary.total} marks`}
        />
        <StatCard label="Grade" value={summary.grade} icon={<Award className="h-4 w-4" />} tone="gold" />
        <StatCard label="Subjects appeared" value={summary.subjects} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard
          label="Result status"
          value={summary.percentage >= 40 ? 'Pass' : 'Needs improvement'}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone={summary.percentage >= 40 ? 'success' : 'danger'}
          hint={summary.percentage >= 40 ? 'Above the 40% demonstration pass mark' : 'Below the 40% demonstration pass mark'}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={active.name} description={`${formatDate(active.startDate)} – ${formatDate(active.endDate)} · published results only`} />
          <div className="p-4">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => `${row.exam.id}-${row.subject?.id ?? ''}`}
              pageSize={10}
              dense
              emptyTitle="No subject marks published"
              emptyDescription="Subject results appear once your teacher publishes them."
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Performance trend" description="Aggregate percentage across published exams" />
          <CardBody>
            <TrendChart
              data={trend}
              xKey="label"
              series={[{ key: 'pct', name: 'Aggregate %', color: 'var(--c-chart-2)' }]}
              yFormatter={(value) => `${value}%`}
              yDomain={[0, 100]}
              height={240}
            />
            <div className="mt-4 rounded-xl border border-line bg-muted/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Semester standing</p>
              <p className="mt-1 text-xs leading-5 text-ink2">
                {summary.percentage >= 75
                  ? 'Consistently strong performance across subjects.'
                  : summary.percentage >= 50
                    ? 'Steady performance — focus on weaker subjects below.'
                    : 'Result is below the institutional expectation of 60%.'}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

/* ================================================================== *
 * Exam overview (principal / chairman / director)                     *
 * ================================================================== */

function ExamOverview({ classIds }: { classIds?: string[] }) {
  const { state } = useDemo()
  const { session } = useAuth()
  const canPublish = can(session?.role, 'marks.publish')

  const exams = useMemo(() => [...state.exams].sort((a, b) => b.startDate.localeCompare(a.startDate)), [state.exams])
  const [examId, setExamId] = useState(exams[0]?.id ?? '')
  const exam = exams.find((e) => e.id === examId)

  if (!exam) return <EmptyState icon={BookX} title="No examinations configured" description="Examinations appear here once configured." />

  const stats = examAverage(state, exam.id, classIds)
  const series = examClassSeries(state, exam.id)
  const subjects = subjectPerformance(state, exam.id, classIds)
  const leaders = topPerformers(state, exam.id, 8)
  const entered = state.marks.filter((m) => m.examId === exam.id && (!classIds || classIds.includes(m.classId))).length
  const drafts = state.marks.filter(
    (m) => m.examId === exam.id && m.status === 'draft' && (!classIds || classIds.includes(m.classId)),
  ).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-ink">Examination performance</h2>
          <DemoTag />
          <StatusBadge status={exam.published ? 'published' : 'draft'} />
        </div>
        <div className="w-full max-w-sm">
          <Select
            selectSize="sm"
            value={examId}
            onChange={(event) => setExamId(event.target.value)}
            options={exams.map((e) => ({ value: e.id, label: `${e.shortName} · ${e.type}` }))}
          />
        </div>
      </div>

      <StatGrid className="lg:grid-cols-4">
        <StatCard label="Exam average" value={formatPercent(stats.percentage)} icon={<TrendingUp className="h-4 w-4" />} tone={stats.percentage >= 60 ? 'success' : 'warn'} showDemoTag hint={`${stats.appeared} students appeared`} />
        <StatCard label="Marks recorded" value={entered} icon={<ClipboardCheck className="h-4 w-4" />} hint={`${classIds?.length ?? state.classes.length} classes in scope`} />
        <StatCard label="Awaiting publication" value={drafts} icon={<Megaphone className="h-4 w-4" />} tone={drafts ? 'gold' : 'success'} hint={drafts ? 'Draft marks hidden from students' : 'Nothing pending'} />
        <StatCard
          label="Exam window"
          value={formatDate(exam.startDate).slice(0, 6)}
          icon={<Award className="h-4 w-4" />}
          tone="royal"
          hint={`${formatDate(exam.startDate)} – ${formatDate(exam.endDate)}`}
        />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Class-wise average" description="Published marks only, per class" />
          <CardBody>
            {series.length === 0 ? (
              <EmptyState compact title="No published marks" description="Class averages appear after marks are published." />
            ) : (
              <BarSeriesChart
                data={series}
                xKey="name"
                bars={[{ key: 'pct', name: 'Average %', color: 'var(--c-chart-1)' }]}
                yFormatter={(value) => `${value}%`}
                horizontal
                height={Math.max(180, series.length * 42 + 40)}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Subject performance" description="Strongest subjects first" />
          <CardBody>
            {subjects.length === 0 ? (
              <EmptyState compact title="No subject data" description="Subject averages appear after publication." />
            ) : (
              <BarList rows={subjects.slice(0, 7).map((row) => ({ label: row.name, value: row.pct }))} />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Top performers"
          description={`Highest aggregates in ${exam.shortName} — published marks only`}
          action={
            canPublish && !exam.published ? (
              <PublishExamButton examId={exam.id} examName={exam.name} />
            ) : undefined
          }
        />
        <CardBody>
          {leaders.length === 0 ? (
            <EmptyState compact title="No published results" description="Published subject marks determine the ranking." />
          ) : (
            <ol className="space-y-2">
              {leaders.map((row, index) => (
                <li key={row.student.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                  <span
                    className={cn(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold',
                      index === 0 ? 'bg-gold-soft text-gold' : index === 1 ? 'bg-muted text-ink2' : index === 2 ? 'bg-warn-soft text-warn' : 'bg-muted text-ink3',
                    )}
                  >
                    {index + 1}
                  </span>
                  <Avatar name={row.student.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{row.student.name}</p>
                    <p className="text-[11px] text-ink3">
                      {row.student.admissionNo} · {classNameOf(state, row.student.classId)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold tabular-nums text-ink">{formatPercent(row.percentage)}</p>
                    <p className="text-[11px] text-ink3">{row.subjects} subjects</p>
                  </div>
                  <Badge tone={row.percentage >= 75 ? 'success' : row.percentage >= 50 ? 'info' : 'warn'}>
                    {gradeFor(row.percentage)}
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function PublishExamButton({ examId, examName }: { examId: string; examName: string }) {
  const { actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  async function publish() {
    const proceed = await confirm({
      title: 'Publish whole examination?',
      description: `${examName} — every saved mark will be released to student portals and the exam will be marked published.`,
      confirmLabel: 'Publish exam',
      tone: 'brand',
    })
    if (!proceed) return
    actions.publishExam(examId)
    actions.addAudit({
      actor: session?.displayName ?? 'Principal',
      actorRole: session?.role ?? 'principal',
      action: 'Published examination',
      target: examName,
      reason: 'Release of compiled results after moderation',
    })
    actions.notify({
      title: 'Results published',
      body: `${examName} is now visible on student portals.`,
      tone: 'success',
      audience: ['student', 'staff'],
    })
    toast.success(`${examName} published.`)
  }

  return (
    <Button size="sm" icon={<Megaphone className="h-4 w-4" />} onClick={publish}>
      Publish whole exam
    </Button>
  )
}

export default MarksModule
