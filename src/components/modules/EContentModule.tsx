import { useMemo, useState } from 'react'
import { Download, FileText, Lock, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useToast } from '@/store/ui'
import { className as classNameOf, subjectName } from '@/store/selectors'
import { cn } from '@/utils/cn'
import { formatDate, formatDateTime } from '@/utils/format'
import type { EContentItem } from '@/types'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Field, Input, Select, Textarea } from '@/components/common/Form'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal } from '@/components/common/Modal'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'

/* ── shared e-content module ─────────────────────────────────────────────── */

export type EContentMode = 'manage' | 'browse'

interface EContentModuleProps {
  mode: EContentMode
  /** restricts manage mode to these classes (teacher allocations) */
  classIds?: string[]
  /** browse mode: which student's class context to show */
  studentId?: string
}

interface EContentForm {
  title: string
  description: string
  classId: string
  subjectId: string
  fileType: EContentItem['fileType']
  fileName: string
  fileSizeKb: number
}

const EMPTY_FORM: EContentForm = {
  title: '',
  description: '',
  classId: '',
  subjectId: '',
  fileType: 'pdf',
  fileName: '',
  fileSizeKb: 240,
}

export function EContentModule({ mode, classIds, studentId }: EContentModuleProps) {
  return mode === 'browse' ? (
    <BrowseContent studentId={studentId} />
  ) : (
    <ManageContent classIds={classIds} />
  )
}

/* ================================================================== *
 * Manage — principal / class teacher / subject teacher                *
 * ================================================================== */

function ManageContent({ classIds }: { classIds?: string[] }) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const availableClasses = useMemo(
    () => (classIds?.length ? state.classes.filter((c) => classIds.includes(c.id)) : state.classes),
    [state.classes, classIds],
  )
  const allowedIds = useMemo(() => new Set(availableClasses.map((c) => c.id)), [availableClasses])

  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<EContentForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return state.econtent
      .filter((row) => allowedIds.has(row.classId))
      .filter((row) => (classFilter === 'all' ? true : row.classId === classFilter))
      .filter((row) => (subjectFilter === 'all' ? true : row.subjectId === subjectFilter))
      .filter((row) =>
        term
          ? row.title.toLowerCase().includes(term) ||
            row.fileName.toLowerCase().includes(term) ||
            row.uploadedBy.toLowerCase().includes(term) ||
            subjectName(state, row.subjectId).toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  }, [state, allowedIds, classFilter, subjectFilter, query])

  function openCreate() {
    setEditing('new')
    setError(null)
    setForm({
      ...EMPTY_FORM,
      classId: availableClasses[0]?.id ?? '',
    })
  }

  function openEdit(item: EContentItem) {
    setEditing(item.id)
    setError(null)
    setForm({
      title: item.title,
      description: item.description,
      classId: item.classId,
      subjectId: item.subjectId,
      fileType: item.fileType,
      fileName: item.fileName,
      fileSizeKb: item.fileSizeKb,
    })
  }

  const classSubjects = form.classId
    ? state.subjects.filter(
        (s) => {
          const cls = state.classes.find((c) => c.id === form.classId)
          return cls ? s.programCodes.includes(cls.programCode) && s.years.includes(cls.year) : false
        },
      )
    : []

  function submit() {
    if (!form.title.trim()) return setError('Give the resource a title students will recognise.')
    if (!form.classId) return setError('Select the class this material belongs to.')
    if (!form.subjectId) return setError('Select the subject for this material.')
    if (!form.fileName.trim()) return setError('Enter a file name — uploads are simulated in this demo.')
    if (form.fileSizeKb <= 0) return setError('File size must be greater than zero.')

    if (editing === 'new') {
      const result = actions.addEContent({
        title: form.title.trim(),
        description: form.description.trim(),
        subjectId: form.subjectId,
        classId: form.classId,
        uploadedBy: session?.displayName ?? 'Faculty',
        uploadedAt: new Date().toISOString(),
        fileName: form.fileName.trim(),
        fileType: form.fileType,
        fileSizeKb: Math.round(form.fileSizeKb),
      })
      if (!result.ok) return setError(result.message)
      toast.success(result.message, `${classNameOf(state, form.classId)} · ${subjectName(state, form.subjectId)}`)
    } else if (editing) {
      actions.updateEContent(editing, {
        title: form.title.trim(),
        description: form.description.trim(),
        subjectId: form.subjectId,
        classId: form.classId,
        fileName: form.fileName.trim(),
        fileType: form.fileType,
        fileSizeKb: Math.round(form.fileSizeKb),
      })
      toast.success('Resource updated.')
    }
    setEditing(null)
    setError(null)
  }

  async function remove(item: EContentItem) {
    const proceed = await confirm({
      title: 'Remove this resource?',
      description: `“${item.title}” will be removed from ${classNameOf(state, item.classId)}. Students will no longer see it in their e-content list.`,
      confirmLabel: 'Remove resource',
      tone: 'danger',
    })
    if (!proceed) return
    actions.removeEContent(item.id)
    toast.success('Resource removed from the class.')
  }

  const columns: Column<EContentItem>[] = [
    {
      key: 'title',
      header: 'Resource',
      sortable: true,
      sortValue: (row) => row.title,
      render: (row) => (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-ink">
            {row.fileType === 'notes' ? <StickyNote className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.title}</p>
            <p className="truncate text-xs text-ink3">{row.fileName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'classId',
      header: 'Class',
      sortable: true,
      sortValue: (row) => classNameOf(state, row.classId),
      render: (row) => <span className="text-ink2">{classNameOf(state, row.classId)}</span>,
    },
    {
      key: 'subjectId',
      header: 'Subject',
      sortable: true,
      sortValue: (row) => subjectName(state, row.subjectId),
      render: (row) => <span className="text-ink2">{subjectName(state, row.subjectId)}</span>,
    },
    { key: 'uploadedBy', header: 'Uploaded by', sortable: true },
    {
      key: 'fileType',
      header: 'Type',
      render: (row) => <Badge tone={row.fileType === 'notes' ? 'gold' : 'info'}>{row.fileType}</Badge>,
    },
    {
      key: 'fileSizeKb',
      header: 'Size',
      sortable: true,
      sortValue: (row) => row.fileSizeKb,
      render: (row) => (
        <span className="tabular-nums text-ink2">
          {row.fileSizeKb >= 1024 ? `${(row.fileSizeKb / 1024).toFixed(1)} MB` : `${row.fileSizeKb} KB`}
        </span>
      ),
    },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      sortable: true,
      sortValue: (row) => row.uploadedAt,
      render: (row) => <span className="text-ink2">{formatDate(row.uploadedAt.slice(0, 10))}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-md p-1.5 text-ink3 transition hover:bg-muted hover:text-ink"
            aria-label={`Edit ${row.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => remove(row)}
            className="rounded-md p-1.5 text-ink3 transition hover:bg-danger-soft hover:text-danger"
            aria-label={`Remove ${row.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (availableClasses.length === 0) {
    return (
      <EmptyState
        icon={Lock}
        title="No classes in your allocation"
        description="E-content management opens only for classes you are allocated to. Ask the office of the Principal to allocate a class or subject."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="E-content library"
          description="Study material published to classes — uploads are simulated and stored only in your browser."
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add resource
            </Button>
          }
        />
        <CardBody>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Search">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, file name or teacher…"
              />
            </Field>
            <Field label="Class">
              <Select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                options={[
                  { value: 'all', label: `All classes (${availableClasses.length})` },
                  ...availableClasses.map((cls) => ({ value: cls.id, label: cls.code })),
                ]}
              />
            </Field>
            <Field label="Subject">
              <Select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                options={[
                  { value: 'all', label: 'All subjects' },
                  ...state.subjects.map((s) => ({ value: s.id, label: s.shortName })),
                ]}
              />
            </Field>
            <div className="flex items-end">
              <DemoTag label={`${rows.length} resources`} className="mb-2.5" />
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            searchPlaceholder=""
            pageSize={8}
            dense
            emptyTitle="No e-content yet"
            emptyDescription="Published study material for these filters will appear here."
          />
        </CardBody>
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add e-content' : 'Edit resource'}
        description="File upload is simulated — no file leaves your browser in this demonstration."
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing === 'new' ? 'Publish resource' : 'Save changes'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          )}
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Unit 3 — Bed Making & Patient Comfort"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class" required>
              <Select
                value={form.classId}
                onChange={(event) => setForm({ ...form, classId: event.target.value, subjectId: '' })}
                placeholder="Select class"
                options={availableClasses.map((cls) => ({ value: cls.id, label: cls.code }))}
              />
            </Field>
            <Field label="Subject" required>
              <Select
                value={form.subjectId}
                onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
                placeholder={classSubjects.length ? 'Select subject' : 'Select class first'}
                error={Boolean(form.classId && classSubjects.length === 0)}
                options={classSubjects.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="File type">
              <Select
                value={form.fileType}
                onChange={(event) =>
                  setForm({ ...form, fileType: event.target.value as EContentItem['fileType'] })
                }
                options={[
                  { value: 'pdf', label: 'PDF document' },
                  { value: 'notes', label: 'Class notes' },
                ]}
              />
            </Field>
            <Field label="Size (KB)" hint={`${form.fileSizeKb} KB`}>
              <Input
                type="number"
                min={1}
                value={form.fileSizeKb}
                onChange={(event) => setForm({ ...form, fileSizeKb: Number(event.target.value) })}
              />
            </Field>
          </div>
          <Field label="File name" required hint="e.g. bed-making-unit3.pdf">
            <Input
              value={form.fileName}
              onChange={(event) => setForm({ ...form, fileName: event.target.value })}
              placeholder="resource-file.pdf"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="What this resource covers, for the student list."
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

/* ================================================================== *
 * Browse — student view of their class material                       *
 * ================================================================== */

function BrowseContent({ studentId }: { studentId?: string }) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const id = studentId ?? session?.linkedId ?? ''
  const student = state.students.find((s) => s.id === id)

  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return state.econtent
      .filter((row) => (student ? row.classId === student.classId : false))
      .filter((row) => (subjectFilter === 'all' ? true : row.subjectId === subjectFilter))
      .filter((row) =>
        term
          ? row.title.toLowerCase().includes(term) ||
            row.description.toLowerCase().includes(term) ||
            row.fileName.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  }, [state, student, subjectFilter, query])

  if (!student) {
    return (
      <EmptyState
        icon={Lock}
        title="No student context"
        description="E-content is shown against your enrolled class. This view is available from the student portal."
      />
    )
  }

  const subjects = state.subjects.filter((s) =>
    state.econtent.some((row) => row.classId === student.classId && row.subjectId === s.id),
  )

  function download(row: EContentItem) {
    actions.bumpDownload(row.id)
    toast.info('Download simulated', `${row.fileName} — no file is transferred in this demonstration.`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="My e-content"
          description={`Study material published by your teachers for ${classNameOf(state, student.classId)}.`}
          action={<DemoTag />}
        />
        <CardBody>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Field label="Search material">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or description…"
              />
            </Field>
            <Field label="Subject">
              <Select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                options={[
                  { value: 'all', label: 'All subjects' },
                  ...subjects.map((s) => ({ value: s.id, label: s.shortName })),
                ]}
              />
            </Field>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No material matches these filters"
              description="Your teachers have not published e-content for this subject yet. Check back after your next class."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col rounded-xl border border-line bg-panel p-4 transition hover:border-royal/40"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                        row.fileType === 'notes' ? 'bg-gold-soft text-gold' : 'bg-royal-soft text-royal',
                      )}
                    >
                      {row.fileType === 'notes' ? <StickyNote className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-5 text-ink">{row.title}</p>
                      <p className="mt-0.5 text-xs text-ink3">
                        {subjectName(state, row.subjectId)} ·{' '}
                        {row.fileSizeKb >= 1024
                          ? `${(row.fileSizeKb / 1024).toFixed(1)} MB`
                          : `${row.fileSizeKb} KB`}
                      </p>
                    </div>
                    <Badge tone="neutral">{row.fileType}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-ink2">
                    {row.description || 'No description provided.'}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] text-ink2">{row.uploadedBy}</p>
                      <p className="text-[11px] text-ink3">
                        {formatDateTime(row.uploadedAt)} · {row.downloads} downloads
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Download className="h-3.5 w-3.5" />}
                      onClick={() => download(row)}
                    >
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink3">
              Showing {rows.length} resource{rows.length === 1 ? '' : 's'} for {classNameOf(state, student.classId)}.
            </p>
            <StatusBadge status="Demo dataset" />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default EContentModule
