import { useState } from 'react'
import { ChevronDown, Megaphone, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import type { Notice, ProgramCode } from '@/types'
import { cn } from '@/utils/cn'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useToast } from '@/store/ui'
import { classCode, noticesFor } from '@/store/selectors'
import { relativeTime } from '@/utils/format'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { Field, Input, SearchInput, Select, Textarea } from '@/components/common/Form'
import { Modal } from '@/components/common/Modal'

const CATEGORIES: Notice['category'][] = ['Institution', 'Course', 'Class', 'Examination', 'Fee', 'Event']

const PRIORITY_TONE: Record<Notice['priority'], BadgeTone> = {
  high: 'danger',
  normal: 'info',
  low: 'neutral',
}

const PRIORITY_LABEL: Record<Notice['priority'], string> = { high: 'High', normal: 'Normal', low: 'Low' }

const CATEGORY_TONE: Record<Notice['category'], BadgeTone> = {
  Institution: 'brand',
  Course: 'info',
  Class: 'success',
  Examination: 'warn',
  Fee: 'gold',
  Event: 'outline',
}

interface DraftNotice {
  title: string
  body: string
  category: Notice['category']
  priority: Notice['priority']
  program: string
  classId: string
}

const EMPTY_DRAFT: DraftNotice = {
  title: '',
  body: '',
  category: 'Institution',
  priority: 'normal',
  program: '',
  classId: '',
}

export interface NoticesModuleProps {
  mode?: 'view' | 'manage'
  /** restricts visible notices to a programme / class audience */
  audience?: { programCode?: ProgramCode; classId?: string }
  classId?: string
}

/**
 * Institutional notice board.
 *
 * `view` renders the read-only board with category filters and search;
 * `manage` adds creation, pinning and deletion for authorised roles.
 * Visibility always flows through `noticesFor` so no portal can see a
 * notice outside its audience.
 */
export function NoticesModule({ mode = 'view', audience, classId }: NoticesModuleProps = {}) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState<DraftNotice>(EMPTY_DRAFT)
  const [formError, setFormError] = useState<string | null>(null)

  const manage = mode === 'manage'

  const visible = noticesFor(state, {
    role: session?.role ?? 'student',
    programCode: audience?.programCode,
    classId: audience?.classId ?? classId,
  })

  const needle = query.trim().toLowerCase()
  const filtered = visible.filter((notice) => {
    if (category !== 'all' && notice.category !== category) return false
    if (needle && !`${notice.title} ${notice.body} ${notice.author}`.toLowerCase().includes(needle)) return false
    return true
  })

  const countFor = (value: Notice['category']) => visible.filter((row) => row.category === value).length

  const publishNotice = () => {
    if (draft.title.trim().length < 4) {
      setFormError('Provide a notice title of at least 4 characters.')
      return
    }
    if (draft.body.trim().length < 10) {
      setFormError('Provide the notice text — at least 10 characters.')
      return
    }
    if (!session) {
      toast.error('No active session', 'Sign in again before publishing a notice.')
      return
    }
    actions.addNotice({
      title: draft.title.trim(),
      body: draft.body.trim(),
      category: draft.category,
      priority: draft.priority,
      programCodes: draft.program ? [draft.program as ProgramCode] : [],
      classIds: draft.classId ? [draft.classId] : [],
      author: session.displayName,
      authorRole: session.title,
      publishedAt: new Date().toISOString(),
      pinned: false,
    })
    toast.success('Notice published', `"${draft.title.trim()}" is now visible to the selected audience.`)
    setComposerOpen(false)
    setDraft({ ...EMPTY_DRAFT })
    setFormError(null)
  }

  const togglePin = (notice: Notice) => {
    actions.toggleNoticePin(notice.id)
    toast.info(notice.pinned ? 'Notice unpinned' : 'Notice pinned', notice.title)
  }

  const removeNotice = async (notice: Notice) => {
    const confirmed = await confirm({
      title: 'Delete this notice?',
      description: `“${notice.title}” will be removed from every portal in the demonstration dataset.`,
      confirmLabel: 'Delete notice',
      tone: 'danger',
    })
    if (!confirmed) return
    actions.removeNotice(notice.id)
    toast.success('Notice deleted', 'The notice is no longer visible to any portal.')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Notices</h2>
            <DemoTag />
            <Badge tone="neutral">{filtered.length} shown</Badge>
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            {manage
              ? 'Publish, pin and retire notices for the selected audience.'
              : 'Announcements relevant to your programme and class.'}
          </p>
        </div>
        {manage && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setComposerOpen(true)}>
            New notice
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition',
              category === 'all'
                ? 'border-brand/25 bg-brand-soft text-brand-ink'
                : 'border-line bg-panel text-ink2 hover:border-line-strong hover:text-ink',
            )}
          >
            All <span className="ml-1 text-[11px] opacity-70">{visible.length}</span>
          </button>
          {CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                category === value
                  ? 'border-brand/25 bg-brand-soft text-brand-ink'
                  : 'border-line bg-panel text-ink2 hover:border-line-strong hover:text-ink',
              )}
            >
              {value} <span className="ml-1 text-[11px] opacity-70">{countFor(value)}</span>
            </button>
          ))}
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search notices, authors, text…"
          className="w-full sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No matching notices"
          description={
            visible.length === 0
              ? 'No notices have been published for this audience in the demonstration dataset.'
              : 'Nothing matches the current category and search filters. Try a different combination.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              manage={manage}
              classLabels={notice.classIds.map((id) => classCode(state, id)).join(', ')}
              onTogglePin={() => togglePin(notice)}
              onDelete={() => void removeNotice(notice)}
            />
          ))}
        </div>
      )}

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="New notice"
        description="The notice is stored in the demonstration dataset and appears immediately for the audience you select."
        size="md"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button icon={<Megaphone className="h-4 w-4" />} onClick={publishNotice}>
              Publish notice
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="Title" required error={formError ?? undefined}>
            <Input
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="e.g. Second installment fee due 30 Nov 2026"
              maxLength={140}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as Notice['category'] })}
                options={CATEGORIES.map((value) => ({ value, label: value }))}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={draft.priority}
                onChange={(event) => setDraft({ ...draft, priority: event.target.value as Notice['priority'] })}
                options={[
                  { value: 'high', label: 'High — highlighted as urgent' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </Field>
            <Field label="Applies to programme" hint="Leave as “All programmes” for institution-wide notices.">
              <Select
                value={draft.program}
                onChange={(event) => setDraft({ ...draft, program: event.target.value })}
                options={[
                  { value: '', label: 'All programmes' },
                  { value: 'GNM', label: 'GNM' },
                  { value: 'BSC', label: 'B.Sc. Nursing' },
                  { value: 'ANM', label: 'ANM' },
                ]}
              />
            </Field>
            <Field label="Applies to class" hint="Optional — restricts the notice to one class.">
              <Select
                value={draft.classId}
                onChange={(event) => setDraft({ ...draft, classId: event.target.value })}
                options={[
                  { value: '', label: 'All classes' },
                  ...state.classes.map((cls) => ({ value: cls.id, label: cls.name })),
                ]}
              />
            </Field>
          </div>

          <Field label="Notice text" required hint="Displayed in full when a reader expands the notice.">
            <Textarea
              value={draft.body}
              onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              placeholder="Write the announcement…"
              className="min-h-[132px]"
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Single notice card                                                  *
 * ------------------------------------------------------------------ */

function NoticeCard({
  notice,
  manage,
  classLabels,
  onTogglePin,
  onDelete,
}: {
  notice: Notice
  manage: boolean
  classLabels: string
  onTogglePin: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <article
      className={cn(
        'rounded-xl border bg-panel px-4 py-3.5 transition',
        notice.pinned ? 'border-gold/40 shadow-card' : 'border-line shadow-card',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {notice.pinned && (
          <Badge tone="gold" icon={<Pin className="h-3 w-3" />}>
            Pinned
          </Badge>
        )}
        <Badge tone={PRIORITY_TONE[notice.priority]}>{PRIORITY_LABEL[notice.priority]} priority</Badge>
        <Badge tone={CATEGORY_TONE[notice.category]}>{notice.category}</Badge>
        <div className="ml-auto flex items-center gap-0.5">
          {manage && (
            <>
              <IconButton
                tooltip={notice.pinned ? 'Unpin notice' : 'Pin notice'}
                onClick={onTogglePin}
                className={cn(notice.pinned && 'text-gold')}
              >
                {notice.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </IconButton>
              <IconButton tooltip="Delete notice" tone="danger" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex w-full items-start gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex-1 text-[13px] font-semibold leading-5 text-ink">{notice.title}</span>
        <ChevronDown
          className={cn('mt-0.5 h-4 w-4 shrink-0 text-ink3 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-ink2">{notice.body}</p>}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink3">
        <span>
          {notice.author} · {notice.authorRole}
        </span>
        <span>{relativeTime(notice.publishedAt)}</span>
        {notice.programCodes.length > 0 && <span>Programme: {notice.programCodes.join(', ')}</span>}
        {notice.classIds.length > 0 && <span>Class: {classLabels}</span>}
        {!open && <span className="text-royal">Select to read the full notice</span>}
      </div>
    </article>
  )
}

export default NoticesModule
