import { useMemo, useState } from 'react'
import {
  Building2,
  Clock,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Power,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { Teacher } from '@/types'
import { useDemo } from '@/store/DemoStore'
import { useConfirm, useToast } from '@/store/ui'
import { classCode, unassignedClasses } from '@/store/selectors'
import { DEPARTMENTS } from '@/data/constants/institution'
import { Avatar } from '@/components/common/Avatar'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type Column } from '@/components/common/DataTable'
import { DemoTag } from '@/components/common/EmptyState'
import { Dropdown } from '@/components/common/Dropdown'
import { Checkbox, Field, Input, Select } from '@/components/common/Form'
import { Modal } from '@/components/common/Modal'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'

const DESIGNATIONS = ['Lecturer', 'Senior Lecturer', 'Tutor', 'Professor', 'Principal']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface TeacherForm {
  name: string
  employeeId: string
  email: string
  phone: string
  department: string
  designation: string
  qualification: string
  joiningDate: string
  active: boolean
}

type TeacherErrors = Partial<Record<'name' | 'employeeId' | 'email', string>>

const EMPTY_FORM: TeacherForm = {
  name: '',
  employeeId: '',
  email: '',
  phone: '',
  department: DEPARTMENTS[0].name,
  designation: 'Lecturer',
  qualification: '',
  joiningDate: '',
  active: true,
}

/**
 * Faculty directory for the Principal portal — create, edit and activate
 * teaching records. Mount with `canManage={false}` (Chairman, who holds only
 * staff.view) to render the read-only variant without mutating controls.
 */
export function FacultyModule({ canManage = true }: { canManage?: boolean } = {}) {
  const { state, actions } = useDemo()
  const toast = useToast()
  const confirm = useConfirm()

  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TeacherForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<TeacherErrors>({})
  const [photoName, setPhotoName] = useState<string | null>(null)

  const activeCount = state.teachers.filter((t) => t.status === 'active').length
  const departmentsCovered = new Set(state.teachers.map((t) => t.department)).size
  const classTeacherCount = state.teachers.filter((t) => t.classTeacherOfClassId).length
  const pending = unassignedClasses(state)

  const departmentFilterOptions = useMemo(() => {
    const names = Array.from(new Set(state.teachers.map((t) => t.department))).sort()
    return [{ value: 'all', label: 'All departments' }, ...names.map((name) => ({ value: name, label: name }))]
  }, [state.teachers])

  const departmentChoices = useMemo(() => {
    const names = Array.from(new Set([...DEPARTMENTS.map((d) => d.name), ...state.teachers.map((t) => t.department)])).sort()
    return names.map((name) => ({ value: name, label: name }))
  }, [state.teachers])

  const filtered = useMemo(
    () =>
      state.teachers.filter((teacher) => {
        if (deptFilter !== 'all' && teacher.department !== deptFilter) return false
        if (statusFilter !== 'all' && teacher.status !== statusFilter) return false
        return true
      }),
    [state.teachers, deptFilter, statusFilter],
  )

  const setField = <K extends keyof TeacherForm>(key: K, value: TeacherForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setPhotoName(null)
    setModalOpen(true)
  }

  const openEdit = (teacher: Teacher) => {
    setEditingId(teacher.id)
    setForm({
      name: teacher.name,
      employeeId: teacher.employeeId,
      email: teacher.email,
      phone: teacher.phone,
      department: teacher.department,
      designation: teacher.designation,
      qualification: teacher.qualification,
      joiningDate: teacher.joiningDate,
      active: teacher.status === 'active',
    })
    setErrors({})
    setPhotoName(null)
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const next: TeacherErrors = {}
    if (!form.name.trim()) next.name = 'Full name is required.'
    if (!form.employeeId.trim()) next.employeeId = 'Employee ID is required.'
    if (!form.email.trim()) next.email = 'E-mail address is required.'
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid e-mail address.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = () => {
    if (!validate()) return
    const existing = editingId ? state.teachers.find((t) => t.id === editingId) : undefined
    const releasing = existing?.classTeacherOfClassId && !form.active ? existing.classTeacherOfClassId : null

    // deactivating a class teacher must release the class first, otherwise the
    // class record would keep pointing at an inactive member of staff
    if (releasing) actions.removeClassTeacher(releasing)

    const payload: Teacher = {
      id: existing?.id ?? `tch-${Date.now().toString(36)}`,
      employeeId: form.employeeId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department,
      designation: form.designation,
      qualification: form.qualification.trim(),
      joiningDate: form.joiningDate,
      status: form.active ? 'active' : 'inactive',
      classTeacherOfClassId: form.active ? (existing?.classTeacherOfClassId ?? null) : null,
    }

    const result = actions.saveTeacher(payload)
    if (result.ok) {
      toast.success(result.message)
      setModalOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  const activate = (teacher: Teacher) => {
    actions.setTeacherStatus(teacher.id, 'active')
    toast.success(`${teacher.name} is active again.`)
  }

  const deactivate = async (teacher: Teacher) => {
    const confirmed = await confirm({
      title: `Deactivate ${teacher.name}?`,
      description: teacher.classTeacherOfClassId
        ? 'The record stays on file but the class-teacher assignment is released immediately. Subject allocations are kept.'
        : 'The record stays on file for reporting. Subject allocations and timetable entries are kept.',
      confirmLabel: 'Deactivate',
      tone: 'danger',
    })
    if (!confirmed) return
    actions.setTeacherStatus(teacher.id, 'inactive')
    toast.success(`${teacher.name} marked inactive.`)
  }

  const columns: Column<Teacher>[] = [
    {
      key: 'name',
      header: 'Teacher',
      sortable: true,
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.name}</p>
            <p className="truncate text-[11px] text-ink3">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeId',
      header: 'Employee ID',
      sortable: true,
      sortValue: (row) => row.employeeId,
      render: (row) => <span className="font-mono text-[12px] text-ink2">{row.employeeId}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      sortValue: (row) => row.department,
      render: (row) => <span className="text-[13px] text-ink2">{row.department}</span>,
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (row) => <span className="text-[13px] text-ink">{row.designation}</span>,
    },
    {
      key: 'classTeacher',
      header: 'Class teacher',
      render: (row) =>
        row.classTeacherOfClassId ? (
          <Badge tone="info">{classCode(state, row.classTeacherOfClassId)}</Badge>
        ) : (
          <span className="text-ink3">—</span>
        ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        canManage ? (
          <Dropdown
            trigger={
              <Button size="sm" variant="secondary" icon={<MoreHorizontal className="h-3.5 w-3.5" />}>
                Actions
              </Button>
            }
            items={[
              { id: 'edit', label: 'Edit record', icon: <Pencil className="h-3.5 w-3.5" />, onSelect: () => openEdit(row) },
              row.status === 'active'
                ? {
                    id: 'deactivate',
                    label: 'Deactivate',
                    icon: <Power className="h-3.5 w-3.5" />,
                    tone: 'danger',
                    separator: true,
                    onSelect: () => void deactivate(row),
                  }
                : {
                    id: 'activate',
                    label: 'Activate',
                    icon: <Power className="h-3.5 w-3.5" />,
                    separator: true,
                    onSelect: () => activate(row),
                  },
            ]}
          />
        ) : (
          <span className="text-[11px] text-ink3">view only</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Faculty directory</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            Teaching staff records, department coverage and class-teacher responsibilities.
          </p>
        </div>
      </div>

      <StatGrid>
        <StatCard
          label="Total teachers"
          value={activeCount}
          icon={<Users className="h-4 w-4" />}
          hint={`${state.teachers.length} record${state.teachers.length === 1 ? '' : 's'} on file`}
        />
        <StatCard
          label="Departments covered"
          value={departmentsCovered}
          icon={<Building2 className="h-4 w-4" />}
          hint="with at least one teaching member"
        />
        <StatCard
          label="Class teachers assigned"
          value={classTeacherCount}
          icon={<UserCheck className="h-4 w-4" />}
          tone="royal"
          hint={`across ${state.classes.length} classes in session`}
        />
        <StatCard
          label="Pending class assignments"
          value={pending.length}
          icon={<Clock className="h-4 w-4" />}
          tone={pending.length ? 'warn' : 'success'}
          hint={pending.length ? pending[0].name : 'Every class has a class teacher'}
        />
      </StatGrid>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(row) => row.id}
        searchValue={(row) => `${row.name} ${row.employeeId} ${row.email} ${row.department}`}
        searchPlaceholder="Search name, employee ID, e-mail or department…"
        pageSize={8}
        emptyTitle="No teachers match the current filters"
        emptyDescription="Clear the department or status filter to bring the demonstration faculty list back."
        toolbar={
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="w-48">
              <Select
                selectSize="sm"
                value={deptFilter}
                onChange={(event) => setDeptFilter(event.target.value)}
                options={departmentFilterOptions}
                aria-label="Filter by department"
              />
            </div>
            <div className="w-36">
              <Select
                selectSize="sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                aria-label="Filter by status"
              />
            </div>
            <span className="hidden text-xs text-ink2 sm:inline">
              {filtered.length} of {state.teachers.length}
            </span>
            {canManage && (
              <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={openAdd}>
                Add teacher
              </Button>
            )}
          </div>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit teacher record' : 'Add teacher'}
        description="Demonstration record — the photograph is never uploaded; only its file name is kept in this browser session."
        size="md"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-[11px] text-ink3">Fields marked * are required</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button icon={<UserPlus className="h-4 w-4" />} onClick={submit}>
                {editingId ? 'Save changes' : 'Create teacher'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                placeholder="Mrs. Kavita Anand"
                error={Boolean(errors.name)}
              />
            </Field>
            <Field label="Employee ID" required error={errors.employeeId} hint="Format: PMEI/T/010">
              <Input
                value={form.employeeId}
                onChange={(event) => setField('employeeId', event.target.value)}
                placeholder="PMEI/T/010"
                error={Boolean(errors.employeeId)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                placeholder="name@example.com"
                error={Boolean(errors.email)}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                placeholder="+91 98765 01110"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Department">
              <Select
                value={form.department}
                onChange={(event) => setField('department', event.target.value)}
                options={departmentChoices}
              />
            </Field>
            <Field label="Designation">
              <Select
                value={form.designation}
                onChange={(event) => setField('designation', event.target.value)}
                options={DESIGNATIONS.map((designation) => ({ value: designation, label: designation }))}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Qualification">
              <Input
                value={form.qualification}
                onChange={(event) => setField('qualification', event.target.value)}
                placeholder="M.Sc. Nursing"
              />
            </Field>
            <Field label="Joining date">
              <Input type="date" value={form.joiningDate} onChange={(event) => setField('joiningDate', event.target.value)} />
            </Field>
          </div>

          <Field
            label="Profile photograph"
            hint={
              photoName
                ? 'Stored locally for the demonstration — no file is uploaded anywhere.'
                : 'PNG or JPG · the file name is stored locally for the demonstration; no upload takes place.'
            }
          >
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? null)}
                className="block w-full cursor-pointer rounded-lg border border-line bg-panel px-3 py-2 text-[13px] text-ink2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-[12px] file:font-medium file:text-ink"
              />
              {photoName && (
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-muted px-3 py-1 text-[11px] text-ink2">
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-ink3" />
                  <span className="max-w-[13rem] truncate font-medium text-ink">{photoName}</span>
                  <span className="hidden text-ink3 sm:inline">placeholder preview · stored locally</span>
                  <button
                    type="button"
                    aria-label="Clear selected photograph"
                    onClick={() => setPhotoName(null)}
                    className="rounded p-0.5 text-ink3 transition hover:text-ink"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </Field>

          <Checkbox
            checked={form.active}
            onChange={(checked) => setField('active', checked)}
            label="Active member of staff"
            description="Inactive teachers cannot be assigned as class teacher or receive new subject allocations; deactivating releases any class-teacher assignment."
          />
        </div>
      </Modal>
    </div>
  )
}

export default FacultyModule
