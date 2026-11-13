import { useMemo, useState } from 'react'
import { CheckCircle2, Layers, BookOpen, AlertTriangle, Building2, Plus, Trash2, UserPlus } from 'lucide-react'
import type { ClassRecord, Subject, SubjectAssignment, Teacher } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { useConfirm, useToast } from '@/store/ui'
import {
  getClass,
  getSubject,
  getTeacher,
  programName,
  studentsOfClass,
  subjectsOfClass,
} from '@/store/selectors'
import { INSTITUTION } from '@/data/constants/institution'
import { Avatar } from '@/components/common/Avatar'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DataTable, type Column } from '@/components/common/DataTable'
import { DemoTag } from '@/components/common/EmptyState'
import { Field, Select } from '@/components/common/Form'
import { Modal } from '@/components/common/Modal'
import { ProgressBar } from '@/components/common/Progress'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'

const RULES = [
  'A class / section can have only one class teacher',
  'A teacher can be class teacher of only one class / section',
  'A class teacher may still teach other classes as a subject teacher',
  'Inactive teachers cannot be assigned',
]

/* ================================================================== *
 * a) Class-teacher assignment workflow                              *
 * ================================================================== */

export function ClassTeacherAssignment() {
  const { state, actions } = useDemo()
  const toast = useToast()
  const confirm = useConfirm()

  const [targetId, setTargetId] = useState<string | null>(null)
  const [teacherId, setTeacherId] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  const target = targetId ? state.classes.find((cls) => cls.id === targetId) : undefined
  const assignedCount = state.classes.filter((cls) => cls.classTeacherId).length
  const currentTeacher = target?.classTeacherId
    ? state.teachers.find((teacher) => teacher.id === target.classTeacherId)
    : undefined

  const teacherOptions = useMemo(() => {
    if (!target) return []
    return state.teachers
      .map((teacher) => {
        const holderId = teacher.classTeacherOfClassId
        const holder = holderId ? state.classes.find((cls) => cls.id === holderId) : undefined
        const eligible =
          teacher.status === 'active' && (!holderId || holderId === target.id)
        let label = `${teacher.name} — ${teacher.designation}, ${teacher.department}`
        if (teacher.status !== 'active') label += ' (inactive)'
        else if (holder && holder.id !== target.id) label += ` (already class teacher of ${holder.code})`
        return { value: teacher.id, label, disabled: !eligible }
      })
      .sort((a, b) => Number(a.disabled) - Number(b.disabled))
  }, [state.teachers, state.classes, target])

  const openAssign = (classId: string) => {
    setTargetId(classId)
    setTeacherId('')
    setError(undefined)
  }

  const close = () => {
    setTargetId(null)
    setTeacherId('')
    setError(undefined)
  }

  const releaseCurrent = async () => {
    if (!target || !currentTeacher) return
    const confirmed = await confirm({
      title: `Remove ${currentTeacher.name} from ${target.name}?`,
      description:
        'The class becomes unassigned immediately so another teacher can be appointed. Subject allocations for this teacher are kept.',
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (!confirmed) return
    actions.removeClassTeacher(target.id)
    toast.success(`Class teacher removed from ${target.name}.`)
  }

  const submit = () => {
    if (!target) return
    if (!teacherId) {
      setError('Select a teacher to continue.')
      return
    }
    const result = actions.assignClassTeacher(target.id, teacherId)
    if (result.ok) {
      toast.success(result.message)
      close()
    } else {
      // the store re-checks every rule — its message is surfaced verbatim
      toast.error(result.message)
      setError(result.message)
    }
  }

  const removeTeacher = async (cls: ClassRecord) => {
    const teacher = state.teachers.find((row) => row.id === cls.classTeacherId)
    const confirmed = await confirm({
      title: `Remove class teacher of ${cls.name}?`,
      description: teacher
        ? `${teacher.name} will no longer be the class teacher of ${cls.code}. Subject allocations stay unchanged.`
        : 'The class will be listed as unassigned.',
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (!confirmed) return
    actions.removeClassTeacher(cls.id)
    toast.success(`Class teacher removed from ${cls.name}.`)
  }

  const columns: Column<ClassRecord>[] = [
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      sortValue: (row) => row.code,
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-ink">{row.code}</p>
          <p className="text-[11px] text-ink3">{row.name}</p>
        </div>
      ),
    },
    {
      key: 'programme',
      header: 'Programme',
      sortable: true,
      sortValue: (row) => `${programName(row.programCode)} ${row.year}`,
      render: (row) => (
        <div>
          <p className="text-[13px] text-ink">{programName(row.programCode)}</p>
          <p className="text-[11px] text-ink3">Year {row.year}</p>
        </div>
      ),
    },
    {
      key: 'strength',
      header: 'Strength',
      align: 'right',
      sortable: true,
      sortValue: (row) => studentsOfClass(state, row.id).length,
      render: (row) => (
        <span className="tabular-nums text-ink">{studentsOfClass(state, row.id).length}</span>
      ),
    },
    {
      key: 'teacher',
      header: 'Class teacher',
      render: (row) => {
        const teacher = state.teachers.find((t) => t.id === row.classTeacherId)
        return teacher ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={teacher.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{teacher.name}</p>
              <p className="truncate text-[11px] text-ink3">{teacher.designation}</p>
            </div>
          </div>
        ) : (
          <Badge tone="gold">Unassigned</Badge>
        )
      },
    },
    {
      key: 'allocations',
      header: 'Subject allocations',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-ink2">
          {state.subjectAssignments.filter((assignment) => assignment.classId === row.id).length}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.classTeacherId ? 'assigned' : 'unassigned'} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        row.classTeacherId ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => openAssign(row.id)}>
              Change
            </Button>
            <IconButton
              tooltip="Remove class teacher"
              tone="danger"
              onClick={() => void removeTeacher(row)}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => openAssign(row.id)}
          >
            Assign
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Class teacher assignment</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            One accountable class teacher per class, validated by the demonstration store.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Assignment rules" description="Every action below is checked against these rules." compact />
        <CardBody className="grid gap-x-6 gap-y-2.5 py-3.5 sm:grid-cols-2">
          {RULES.map((rule) => (
            <div key={rule} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.8} />
              <p className="text-[13px] leading-5 text-ink2">{rule}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[13px] text-ink2">
          <span className="font-semibold text-ink">{assignedCount}</span> of {state.classes.length} classes have a class
          teacher
        </p>
        <ProgressBar value={assignedCount} max={state.classes.length} className="w-40" tone="auto" />
      </div>

      <DataTable
        columns={columns}
        rows={state.classes}
        getRowKey={(row) => row.id}
        searchValue={(row) => `${row.code} ${row.name} ${programName(row.programCode)}`}
        searchPlaceholder="Search class or programme…"
        pageSize={8}
        emptyTitle="No classes in view"
        emptyDescription="The demonstration dataset contains no classes matching this search."
      />

      <Modal
        open={Boolean(target)}
        onClose={close}
        title={target?.classTeacherId ? 'Change class teacher' : 'Assign class teacher'}
        description={target ? `${target.name} · ${target.code} · Academic session ${INSTITUTION.academicYear}` : ''}
        size="md"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={submit}>
              {target?.classTeacherId ? 'Save new class teacher' : 'Assign class teacher'}
            </Button>
          </div>
        }
      >
        {target && (
          <div className="space-y-4">
            {target.classTeacherId && (
              <div className="rounded-lg border border-warn/30 bg-warn-soft px-3.5 py-3">
                <p className="text-[13px] font-semibold text-warn">This class already has a class teacher</p>
                <p className="mt-0.5 text-xs leading-5 text-ink2">
                  {currentTeacher?.name ?? 'The current appointee'} holds the assignment. Release it before appointing
                  someone else — a class can only have one class teacher.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => void releaseCurrent()}
                >
                  Remove current assignment
                </Button>
              </div>
            )}

            <Field
              label="Select teacher"
              required
              error={error}
              hint="Eligible teachers are active staff who are not already the class teacher of another class."
            >
              <Select
                value={teacherId}
                placeholder="Choose a teacher…"
                onChange={(event) => {
                  setTeacherId(event.target.value)
                  setError(undefined)
                }}
                options={teacherOptions}
                error={Boolean(error)}
              />
            </Field>

            <div className="rounded-lg border border-line bg-muted/60 px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Selected class</p>
              <p className="mt-1 text-[13px] font-medium text-ink">
                {target.name} · {studentsOfClass(state, target.id).length} students ·{' '}
                {state.subjectAssignments.filter((assignment) => assignment.classId === target.id).length} subject
                allocations
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ================================================================== *
 * b) Subject allocation                                               *
 * ================================================================== */

interface AllocRow {
  assignment: SubjectAssignment
  teacher: Teacher
  cls: ClassRecord
  subject: Subject
}

export function SubjectAllocation() {
  const { state, actions } = useDemo()
  const toast = useToast()
  const confirm = useConfirm()

  const [modalOpen, setModalOpen] = useState(false)
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [errors, setErrors] = useState<{ teacher?: string; class?: string; subject?: string }>({})

  const rows = useMemo<AllocRow[]>(() => {
    const built: AllocRow[] = []
    for (const assignment of state.subjectAssignments) {
      const teacher = getTeacher(state, assignment.teacherId)
      const cls = getClass(state, assignment.classId)
      const subject = getSubject(state, assignment.subjectId)
      if (teacher && cls && subject) built.push({ assignment, teacher, cls, subject })
    }
    return built
  }, [state])

  const stats = useMemo(() => {
    const subjectIds = new Set<string>()
    const departments = new Set<string>()
    let uncoveredPairs = 0
    let totalPairs = 0

    for (const cls of state.classes) {
      const subjects = subjectsOfClass(state, cls.id)
      totalPairs += subjects.length
      for (const subject of subjects) {
        const hasAllocation = state.subjectAssignments.some(
          (assignment) => assignment.classId === cls.id && assignment.subjectId === subject.id,
        )
        if (!hasAllocation) uncoveredPairs += 1
      }
    }

    for (const assignment of state.subjectAssignments) {
      subjectIds.add(assignment.subjectId)
      const teacher = getTeacher(state, assignment.teacherId)
      if (teacher) departments.add(teacher.department)
    }

    return {
      allocations: state.subjectAssignments.length,
      subjects: subjectIds.size,
      uncoveredPairs,
      totalPairs,
      departments: departments.size,
    }
  }, [state])

  const teacherOptions = useMemo(
    () =>
      state.teachers
        .filter((teacher) => teacher.status === 'active')
        .map((teacher) => ({ value: teacher.id, label: `${teacher.name} — ${teacher.designation}` })),
    [state.teachers],
  )

  const classOptions = useMemo(
    () => state.classes.map((cls) => ({ value: cls.id, label: `${cls.code} — ${cls.name}` })),
    [state.classes],
  )

  const subjectOptions = useMemo(() => {
    if (!classId) return []
    return subjectsOfClass(state, classId).map((subject) => ({
      value: subject.id,
      label: `${subject.name} (${subject.code})`,
    }))
  }, [state, classId])

  const openModal = () => {
    setTeacherId('')
    setClassId('')
    setSubjectId('')
    setErrors({})
    setModalOpen(true)
  }

  const close = () => {
    setModalOpen(false)
    setErrors({})
  }

  const submit = () => {
    const next: typeof errors = {}
    if (!teacherId) next.teacher = 'Select a teacher.'
    if (!classId) next.class = 'Select a class.'
    if (!subjectId) next.subject = 'Select a subject for the chosen class.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const result = actions.addSubjectAssignment({
      teacherId,
      classId,
      subjectId,
      academicYear: INSTITUTION.academicYear,
    })
    if (result.ok) {
      toast.success(result.message)
      close()
    } else {
      // duplicate and rule checks live in the store — message surfaced verbatim
      toast.error(result.message)
    }
  }

  const removeAllocation = async (row: AllocRow) => {
    const confirmed = await confirm({
      title: 'Remove subject allocation?',
      description: `${row.teacher.name} will no longer be allocated to ${row.subject.name} for ${row.cls.code}. Timetable entries are not affected.`,
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (!confirmed) return
    actions.removeSubjectAssignment(row.assignment.id)
    toast.success('Subject allocation removed.')
  }

  const columns: Column<AllocRow>[] = [
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      sortValue: (row) => row.cls.code,
      render: (row) => (
        <div>
          <p className="text-[13px] font-semibold text-ink">{row.cls.code}</p>
          <p className="text-[11px] text-ink3">{programName(row.cls.programCode)} · Year {row.cls.year}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      sortValue: (row) => row.subject.name,
      render: (row) => (
        <div>
          <p className="text-[13px] text-ink">{row.subject.name}</p>
          <p className="font-mono text-[11px] text-ink3">{row.subject.code}</p>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.teacher.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.teacher.name}</p>
            <p className="truncate text-[11px] text-ink3">{row.teacher.designation}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (row) => <span className="text-[13px] text-ink2">{row.teacher.department}</span>,
    },
    {
      key: 'year',
      header: 'Academic year',
      render: (row) => <span className="text-[13px] text-ink2">{row.assignment.academicYear}</span>,
    },
    {
      key: 'lead',
      header: 'Lead allocation',
      render: (row) =>
        state.timetable.some(
          (slot) =>
            slot.classId === row.assignment.classId &&
            slot.subjectId === row.assignment.subjectId &&
            slot.teacherId === row.assignment.teacherId,
        ) ? (
          <Badge tone="success">Timetable lead</Badge>
        ) : (
          <span className="text-ink3">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <IconButton tooltip="Remove allocation" tone="danger" onClick={() => void removeAllocation(row)}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Subject allocation</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            Which teacher takes which subject, class by class, for the academic session.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openModal}>
            Add allocation
          </Button>
        </div>
      </div>

      <StatGrid>
        <StatCard
          label="Total allocations"
          value={stats.allocations}
          icon={<Layers className="h-4 w-4" />}
          hint="teacher–subject–class entries"
        />
        <StatCard
          label="Subjects covered"
          value={stats.subjects}
          icon={<BookOpen className="h-4 w-4" />}
          tone="royal"
          hint={`of ${state.subjects.length} subjects on the syllabus`}
        />
        <StatCard
          label="Class–subject pairs with no allocation"
          value={stats.uncoveredPairs}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={stats.uncoveredPairs ? 'warn' : 'success'}
          hint={`across ${stats.totalPairs} pairs in the curriculum`}
        />
        <StatCard
          label="Departments involved"
          value={stats.departments}
          icon={<Building2 className="h-4 w-4" />}
          hint="represented in these allocations"
        />
      </StatGrid>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.assignment.id}
        searchValue={(row) => `${row.cls.code} ${row.subject.name} ${row.subject.code} ${row.teacher.name} ${row.teacher.department}`}
        searchPlaceholder="Search class, subject or teacher…"
        pageSize={8}
        emptyTitle="No subject allocations yet"
        emptyDescription="Use “Add allocation” to map a teacher to a subject and class."
      />

      <Modal
        open={modalOpen}
        onClose={close}
        title="Add subject allocation"
        description="Duplicate allocations for the same teacher, class and subject are rejected by the store."
        size="md"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-[11px] text-ink3">Academic year {INSTITUTION.academicYear}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button icon={<Plus className="h-4 w-4" />} onClick={submit}>
                Add allocation
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="Teacher" required error={errors.teacher}>
            <Select
              value={teacherId}
              placeholder="Choose an active teacher…"
              onChange={(event) => {
                setTeacherId(event.target.value)
                setErrors((current) => ({ ...current, teacher: undefined }))
              }}
              options={teacherOptions}
              error={Boolean(errors.teacher)}
            />
          </Field>

          <Field
            label="Class"
            required
            error={errors.class}
            hint="Choosing a class re-filters the subject list to the subjects that apply to it."
          >
            <Select
              value={classId}
              placeholder="Choose a class…"
              onChange={(event) => {
                setClassId(event.target.value)
                setSubjectId('')
                setErrors((current) => ({ ...current, class: undefined, subject: undefined }))
              }}
              options={classOptions}
              error={Boolean(errors.class)}
            />
          </Field>

          <Field
            label="Subject"
            required
            error={errors.subject}
            hint={
              classId
                ? `Subjects applicable to the selected class — ${subjectOptions.length} available.`
                : 'Select a class first; only the subjects taught to that class are listed.'
            }
          >
            <Select
              value={subjectId}
              placeholder={classId ? 'Choose a subject…' : 'Select a class first'}
              disabled={!classId || subjectOptions.length === 0}
              onChange={(event) => {
                setSubjectId(event.target.value)
                setErrors((current) => ({ ...current, subject: undefined }))
              }}
              options={subjectOptions}
              error={Boolean(errors.subject)}
            />
          </Field>

          <Field label="Academic year" hint="Fixed for the current demonstration session.">
            <div className="flex h-10 items-center rounded-lg border border-line bg-muted px-3 text-[13px] text-ink2">
              {INSTITUTION.academicYear}
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  )
}

export default ClassTeacherAssignment
