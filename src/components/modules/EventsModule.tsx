import { useMemo, useState } from 'react'
import {
  CalendarHeart,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import type { EventRecord, ProgramCode, RegistrationQuestion, Role } from '@/types'
import { cn } from '@/utils/cn'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useToast } from '@/store/ui'
import {
  EVENT_STATUS_LABEL,
  canSeeParticipants,
  eventCounts,
  registrationsFor,
} from '@/store/selectors'
import { addDays, formatDate, formatDateTime, todayISO } from '@/utils/format'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button, IconButton } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { Tabs } from '@/components/common/Tabs'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'
import { Drawer, Modal } from '@/components/common/Modal'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/common/Form'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'
import { PartyPopper, CalendarDays, MapPin, Clock, Tag } from 'lucide-react'

export type EventsMode = 'institution' | 'student' | 'review'

const TONE_SURFACE: Record<number, string> = {
  1: 'bg-brand-soft text-brand-ink',
  2: 'bg-royal-soft text-royal',
  3: 'bg-gold-soft text-gold',
  4: 'bg-success-soft text-success',
}

const CATEGORY_OPTIONS = ['Cultural', 'Sports', 'Academic', 'Health Camp', 'Club', 'Workshop'] as const

interface EventsModuleProps {
  mode: EventsMode
  /** class ids the reviewer may approve (class teacher) — omitted = all pending (principal) */
  viewerClassIds?: string[]
}

export function EventsModule({ mode, viewerClassIds }: EventsModuleProps) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [tab, setTab] = useState<'directory' | 'mine' | 'review' | 'clubs'>(
    mode === 'review' ? 'review' : 'directory',
  )
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<EventRecord | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const counts = eventCounts(state)
  const linkedId = session?.linkedId ?? null

  const pendingForMe = useMemo(() => {
    const pending = state.events.filter((e) => e.status === 'pending')
    if (!viewerClassIds?.length) return pending
    return pending.filter((event) => {
      const creator = state.students.find((s) => s.id === event.createdById)
      return creator ? viewerClassIds.includes(creator.classId) : false
    })
  }, [state.events, state.students, viewerClassIds])

  const directory = useMemo(() => {
    const today = todayISO()
    return state.events
      .filter((e) => e.status === 'approved' || e.status === 'completed')
      .filter((e) => (category === 'all' ? true : e.category === category))
      .filter((e) => (query.trim() ? `${e.title} ${e.venue} ${e.organizer}`.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => {
        const aUpcoming = a.date >= today
        const bUpcoming = b.date >= today
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
        return aUpcoming ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
      })
  }, [state.events, category, query])

  const mine = useMemo(
    () => state.events.filter((e) => e.createdById === linkedId),
    [state.events, linkedId],
  )

  const clubs = useMemo(() => {
    const map = new Map<string, { club: string; events: number; next?: string }>()
    for (const event of state.events) {
      const row = map.get(event.organizerClub) ?? { club: event.organizerClub, events: 0 }
      row.events += 1
      if (event.status === 'approved' && (!row.next || event.date < row.next)) row.next = event.date
      map.set(event.organizerClub, row)
    }
    return Array.from(map.values()).sort((a, b) => b.events - a.events)
  }, [state.events])

  const tabs =
    mode === 'student'
      ? [
          { id: 'directory', label: 'Official events' },
          { id: 'mine', label: 'My events', count: mine.length },
          { id: 'clubs', label: 'Clubs' },
        ]
      : mode === 'review'
        ? [
            { id: 'review', label: 'Pending approval', count: pendingForMe.length },
            { id: 'directory', label: 'Approved directory' },
            { id: 'clubs', label: 'Clubs' },
          ]
        : [
            { id: 'directory', label: 'Approved & past events' },
            { id: 'review', label: 'Awaiting approval', count: counts.pending },
            { id: 'clubs', label: 'Clubs' },
          ]

  const shareUrl = (event: EventRecord) => `https://demo.pmei.local/events/${event.shareSlug}`

  const copyLink = async (event: EventRecord) => {
    try {
      await navigator.clipboard.writeText(shareUrl(event))
      toast.success('Registration link copied', 'Share it with participants — approval status stays visible on the page.')
    } catch {
      toast.info('Copy not available', shareUrl(event))
    }
  }

  return (
    <div className="space-y-5">
      {/* ------------------------------ header ------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Events & clubs</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            {mode === 'student'
              ? 'Create club and campus events, share a registration form and track institutional approval.'
              : mode === 'review'
                ? 'Review student-submitted events for your assigned class and record an approval decision.'
                : 'Institutional activity calendar with an auditable approval trail.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'student' && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              Create event
            </Button>
          )}
        </div>
      </div>

      {mode === 'institution' && (
        <StatGrid className="lg:grid-cols-4">
          <StatCard label="Approved events" value={counts.approved} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" showDemoTag />
          <StatCard label="Pending approval" value={counts.pending} icon={<ClipboardCheck className="h-4 w-4" />} tone="warn" hint="Awaiting class teacher review" />
          <StatCard label="Completed" value={counts.completed} icon={<CalendarDays className="h-4 w-4" />} />
          <StatCard label="Participants registered" value={state.registrations.length} icon={<Users className="h-4 w-4" />} tone="royal" />
        </StatGrid>
      )}

      <Tabs items={tabs} value={tab} onChange={(id) => setTab(id as typeof tab)} />

      {/* ---------------------------- directory ----------------------------- */}
      {tab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, venues, organisers…"
                className="h-9 w-full rounded-lg border border-line bg-panel pl-9 pr-3 text-[13px] text-ink placeholder:text-ink3 transition focus:border-royal/60 focus:ring-2 focus:ring-royal/15 focus-visible:outline-none"
              />
            </div>
            <Select
              selectSize="sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))]}
              className="w-44"
            />
          </div>

          {directory.length === 0 ? (
            <EmptyState
              icon={CalendarHeart}
              title="No events match these filters"
              description="Approved institutional events will appear here once the class teacher or office of the principal approves them."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {directory.map((event) => (
                <EventCard key={event.id} event={event} onOpen={() => setSelected(event)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ mine -------------------------------- */}
      {tab === 'mine' && (
        <div className="space-y-4">
          {mine.length === 0 ? (
            <EmptyState
              icon={PartyPopper}
              title="You have not created any events yet"
              description="Use “Create event” to propose a club or campus event with your own registration form."
              action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Create event</Button>}
            />
          ) : (
            mine.map((event) => (
              <Card key={event.id}>
                <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-ink">{event.title}</p>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink2">
                      {event.category} · {formatDate(event.date)} · {event.startTime}–{event.endTime} · {event.venue}
                    </p>
                    {event.reviewNote && (
                      <p className="mt-1.5 text-xs italic text-ink2">
                        {event.status === 'rejected' ? 'Reviewer note: ' : 'Review note: '}
                        {event.reviewNote}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {event.status === 'draft' && (
                      <Button
                        size="sm"
                        icon={<Send className="h-3.5 w-3.5" />}
                        onClick={() => {
                          const result = actions.submitEventForApproval(event.id)
                          result.ok ? toast.success(result.message) : toast.error(result.message)
                        }}
                      >
                        Submit for approval
                      </Button>
                    )}
                    {event.status !== 'draft' && (
                      <Button size="sm" variant="secondary" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyLink(event)}>
                        Copy link
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => setSelected(event)}>
                      Open
                    </Button>
                    <IconButton
                      tooltip="Delete draft"
                      tone="danger"
                      onClick={async () => {
                        const sure = await confirm({
                          title: 'Delete this event?',
                          description: `${event.title} and its registrations will be removed from the demonstration dataset.`,
                          confirmLabel: 'Delete event',
                          tone: 'danger',
                        })
                        if (sure) {
                          actions.removeEvent(event.id)
                          toast.success('Event deleted')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ----------------------------- review ------------------------------- */}
      {tab === 'review' && (
        <div className="space-y-4">
          {mode !== 'review' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warn/25 bg-warn-soft px-4 py-3">
              <Eye className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <p className="text-xs leading-5 text-ink2">
                Approval decisions are recorded by the class teacher (and the office of the principal). Chairmen and
                directors observe the queue here without a decision control.
              </p>
            </div>
          )}

          {pendingForMe.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No events awaiting approval"
              description="Student submissions for your class will appear here with the proposed registration form."
            />
          ) : (
            pendingForMe.map((event) => {
              const creator = state.students.find((s) => s.id === event.createdById)
              return (
                <Card key={event.id}>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-semibold text-ink">{event.title}</p>
                          <Badge tone="warn" dot>
                            {EVENT_STATUS_LABEL.pending}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-ink2">
                          {event.category} · {formatDate(event.date)} · {event.startTime}–{event.endTime} · {event.venue}
                        </p>
                        <p className="mt-1 text-xs text-ink3">
                          Submitted by {event.createdByName}
                          {creator ? ` · ${creator.admissionNo}` : ''} · {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelected(event)}>
                          Review form
                        </Button>
                        {mode === 'review' && (
                          <ReviewButton event={event} onDone={() => setSelected(null)} />
                        )}
                      </div>
                    </div>
                    <p className="border-t border-line pt-3 text-[13px] leading-6 text-ink2">{event.description}</p>
                  </CardBody>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ------------------------------ clubs ------------------------------- */}
      {tab === 'clubs' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((row, index) => (
            <Card key={row.club}>
              <CardBody className="flex items-start gap-3">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', TONE_SURFACE[(index % 4) + 1])}>
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink">{row.club}</p>
                  <p className="mt-0.5 text-xs text-ink2">
                    {row.events} event{row.events === 1 ? '' : 's'} organised
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink3">
                    {row.next ? `Next approved event ${formatDate(row.next)}` : 'No upcoming approved event'}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <EventDrawer event={selected} onClose={() => setSelected(null)} mode={mode} shareUrl={selected ? shareUrl(selected) : ''} onCopy={() => selected && copyLink(selected)} />

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values, submit) => {
          if (!session) return
          actions.createEvent(
            { id: session.linkedId ?? session.accountId, name: session.displayName, role: session.role },
            values,
            submit,
          )
          setCreateOpen(false)
          setTab('mine')
          toast.success(submit ? 'Event submitted for approval' : 'Draft saved', submit ? 'The class teacher will review your registration form.' : 'You can edit and submit it later from “My events”.')
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Event card                                                          *
 * ------------------------------------------------------------------ */

function EventCard({ event, onOpen }: { event: EventRecord; onOpen: () => void }) {
  const { state } = useDemo()
  const registrants = registrationsFor(state, event.id).length
  const past = event.date < todayISO()

  return (
    <button type="button" onClick={onOpen} className="group overflow-hidden rounded-panel border border-line bg-panel text-left shadow-card transition hover:border-line-strong hover:shadow-pop">
      <div className={cn('relative flex h-24 items-center justify-between px-4', TONE_SURFACE[event.coverTone])}>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{event.category}</span>
        <span className="rounded-full bg-panel/70 px-2 py-0.5 text-[11px] font-semibold text-ink">
          {formatDate(event.date)}
        </span>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] font-semibold leading-5 text-ink group-hover:text-royal">{event.title}</p>
          <StatusBadge status={event.status} />
        </div>
        <p className="line-clamp-2 text-xs leading-5 text-ink2">{event.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink3">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.startTime}–{event.endTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.venue}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {registrants}/{event.maxParticipants}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-2.5">
          <span className="truncate text-[11px] text-ink2">{event.organizer}</span>
          <Badge tone={past ? 'neutral' : 'brand'}>{past ? 'Concluded' : 'Upcoming'}</Badge>
        </div>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Detail drawer: details + registration + participants                *
 * ------------------------------------------------------------------ */

function EventDrawer({
  event,
  onClose,
  mode,
  shareUrl,
  onCopy,
}: {
  event: EventRecord | null
  onClose: () => void
  mode: EventsMode
  shareUrl: string
  onCopy: () => void
}) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [registrant, setRegistrant] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!event) return null

  const registrations = registrationsFor(state, event.id)
  const viewer = { role: (session?.role ?? 'student') as Role, linkedId: session?.linkedId ?? null }
  const showParticipants = canSeeParticipants(event, viewer)
  const isCreator = session?.linkedId === event.createdById
  const editable = mode === 'student' && isCreator && (event.status === 'draft' || event.status === 'rejected')
  const registrationOpen =
    (event.status === 'approved' || event.status === 'pending') && event.registrationDeadline >= todayISO()
  const approvalPending = event.status === 'pending'

  const submitRegistration = () => {
    const nextErrors: Record<string, string> = {}
    if (!registrant.name.trim()) nextErrors.name = 'Name is required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(registrant.email)) nextErrors.email = 'Valid e-mail is required'
    if (!registrant.phone.trim()) nextErrors.phone = 'Contact number is required'
    event.questions.forEach((question) => {
      const value = (answers[question.id] ?? '').trim()
      if (question.required && !value) nextErrors[question.id] = 'This field is required'
      if (question.type === 'number' && value && Number.isNaN(Number(value))) nextErrors[question.id] = 'Enter a number'
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const result = actions.registerForEvent(event.id, {
      ...registrant,
      answers: event.questions.map((question) => ({ questionId: question.id, value: answers[question.id] ?? '' })),
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    setSubmitted(true)
    toast.success('Registration recorded', approvalPending ? 'The event is awaiting institutional approval.' : 'Your registration has been recorded.')
  }

  return (
    <Drawer
      open
      onClose={onClose}
      size="lg"
      title={event.title}
      description={`${event.category} · ${formatDate(event.date)} · ${event.venue}`}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <StatusBadge status={event.status} />
          <div className="flex gap-2">
            {(mode === 'student' && isCreator) || mode === 'review' || mode === 'institution' ? (
              <Button variant="secondary" icon={<Copy className="h-4 w-4" />} onClick={onCopy}>
                Copy registration link
              </Button>
            ) : null}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {approvalPending && (
          <div className="flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <div className="text-xs leading-5 text-ink2">
              <p className="font-semibold text-warn">Institutional approval pending</p>
              This event is not yet part of the official institutional directory. Registrations may be collected, but
              participant identities and answers stay hidden from the organiser until a class teacher approves it.
            </div>
          </div>
        )}

        {event.status === 'rejected' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="text-xs leading-5 text-ink2">
              <p className="font-semibold text-danger">Rejected</p>
              {event.reviewNote || 'No review note was provided.'}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Date', formatDate(event.date)],
            ['Time', `${event.startTime} – ${event.endTime}`],
            ['Venue', event.venue],
            ['Organiser', event.organizer],
            ['Club / cell', event.organizerClub],
            ['Registration deadline', formatDate(event.registrationDeadline)],
            ['Maximum participants', String(event.maxParticipants)],
            ['Applies to', event.programCode === 'All' ? 'All programmes' : event.programCode],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-ink3">{label}</p>
              <p className="mt-0.5 text-[13px] text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-[13px] font-semibold text-ink">Description</h4>
          <p className="mt-1.5 text-[13px] leading-6 text-ink2">{event.description}</p>
        </div>

        {/* share link */}
        <div className="rounded-xl border border-line bg-muted px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Public registration link</p>
              <p className="mt-0.5 truncate font-mono text-[12px] text-ink">{shareUrl}</p>
            </div>
            <Button size="sm" variant="secondary" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={onCopy}>
              Copy
            </Button>
          </div>
        </div>

        {/* registration form */}
        {registrationOpen && (
          <Card>
            <CardHeader
              title="Registration form"
              description={
                approvalPending
                  ? 'Demonstration registrations are accepted while approval is pending.'
                  : 'Open for participants — submissions are recorded in the demonstration dataset.'
              }
              compact
              action={<DemoTag label="DEMO FORM" />}
            />
            <CardBody className="space-y-3">
              {submitted ? (
                <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
                  <p className="mt-2 text-[13px] font-semibold text-ink">Registration submitted</p>
                  <p className="mt-1 text-xs text-ink2">
                    A demonstration confirmation has been recorded for {registrant.name || 'you'}.
                  </p>
                  <Button size="sm" variant="secondary" className="mt-3" onClick={() => { setSubmitted(false); setAnswers({}); setRegistrant({ name: '', email: '', phone: '' }) }}>
                    Register another participant
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Full name" required error={errors.name}>
                      <Input inputSize="sm" value={registrant.name} onChange={(e) => setRegistrant({ ...registrant, name: e.target.value })} placeholder="Participant name" />
                    </Field>
                    <Field label="E-mail" required error={errors.email}>
                      <Input inputSize="sm" value={registrant.email} onChange={(e) => setRegistrant({ ...registrant, email: e.target.value })} placeholder="name@example.com" />
                    </Field>
                    <Field label="Contact number" required error={errors.phone}>
                      <Input inputSize="sm" value={registrant.phone} onChange={(e) => setRegistrant({ ...registrant, phone: e.target.value })} placeholder="+91" />
                    </Field>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {event.questions.map((question) => (
                      <Field
                        key={question.id}
                        label={question.label}
                        required={question.required}
                        error={errors[question.id]}
                        className={question.type === 'textarea' ? 'sm:col-span-2' : undefined}
                      >
                        {question.type === 'textarea' ? (
                          <Textarea
                            className="min-h-[72px]"
                            value={answers[question.id] ?? ''}
                            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                          />
                        ) : question.type === 'select' ? (
                          <Select
                            selectSize="sm"
                            value={answers[question.id] ?? ''}
                            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                            placeholder="Select an option"
                            options={question.options.map((option) => ({ value: option, label: option }))}
                          />
                        ) : (
                          <Input
                            inputSize="sm"
                            type={question.type === 'number' ? 'number' : 'text'}
                            value={answers[question.id] ?? ''}
                            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                          />
                        )}
                      </Field>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-ink3">All submissions are simulated locally.</p>
                    <Button icon={<Send className="h-4 w-4" />} onClick={submitRegistration}>
                      Submit registration
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        )}

        {/* participants */}
        <Card>
          <CardHeader
            title="Participants"
            description={
              showParticipants
                ? `${registrations.length} registration${registrations.length === 1 ? '' : 's'} recorded for this event.`
                : 'Participant identities are withheld until institutional approval.'
            }
            compact
            action={
              showParticipants ? (
                <Badge tone="success" icon={<Eye className="h-3 w-3" />}>
                  Visible
                </Badge>
              ) : (
                <Badge tone="warn" icon={<EyeOff className="h-3 w-3" />}>
                  Restricted
                </Badge>
              )
            }
          />
          {showParticipants ? (
            registrations.length === 0 ? (
              <CardBody>
                <EmptyState compact title="No registrations yet" description="The registration link has not been used in this demonstration." />
              </CardBody>
            ) : (
              <div className="divide-y divide-line">
                {registrations.map((registration) => (
                  <div key={registration.id} className="flex items-start gap-3 px-4 py-3">
                    <Avatar name={registration.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-ink">{registration.name}</p>
                        <span className="text-[11px] text-ink3">{formatDateTime(registration.submittedAt)}</span>
                      </div>
                      <p className="text-[11px] text-ink2">
                        {registration.email} · {registration.phone}
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {event.questions.map((question) => {
                          const answer = registration.answers.find((a) => a.questionId === question.id)?.value
                          if (!answer) return null
                          return (
                            <p key={question.id} className="text-[11.5px] leading-5 text-ink2">
                              <span className="text-ink3">{question.label}: </span>
                              {answer}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <CardBody>
              <div className="flex items-center gap-3 rounded-lg border border-line bg-muted px-3.5 py-3">
                <Lock className="h-4 w-4 shrink-0 text-warn" />
                <div className="text-xs leading-5 text-ink2">
                  <p className="font-medium text-ink">{registrations.length} registration{registrations.length === 1 ? '' : 's'} received so far</p>
                  The organiser can see this count only. Names and answers unlock automatically after approval —
                  pending approvals never expose participant identities in this prototype.
                </div>
              </div>
            </CardBody>
          )}
        </Card>

        {editable && (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-muted px-3.5 py-3 text-xs text-ink2">
            <Tag className="h-4 w-4 text-ink3" />
            This event is a {event.status === 'draft' ? 'draft' : 'rejected submission'} — submit it from “My events” to request institutional approval again.
          </div>
        )}
      </div>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ *
 * Review control                                                      *
 * ------------------------------------------------------------------ */

function ReviewButton({ event, onDone }: { event: EventRecord; onDone: () => void }) {
  const { actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [note, setNote] = useState('')

  const submit = () => {
    if (decision === 'rejected' && note.trim().length < 5) {
      toast.error('A short review note is required when rejecting an event.')
      return
    }
    const result = actions.reviewEvent(event.id, decision, note.trim(), session?.displayName ?? 'Reviewer')
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(result.message, `${event.title} — ${EVENT_STATUS_LABEL[decision]}`)
    setOpen(false)
    setNote('')
    onDone()
  }

  return (
    <>
      <Button size="sm" icon={<ClipboardCheck className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
        Review decision
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Event approval decision"
        description={`${event.title} · submitted ${formatDateTime(event.createdAt)}`}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decision === 'approved' ? 'primary' : 'danger'}
              icon={decision === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              onClick={submit}
            >
              {decision === 'approved' ? 'Approve event' : 'Reject event'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-muted px-3.5 py-3 text-[13px] leading-6 text-ink2">
            <p className="font-semibold text-ink">{event.title}</p>
            <p className="mt-1">{event.description}</p>
            <p className="mt-2 text-xs text-ink3">
              {formatDate(event.date)} · {event.startTime}–{event.endTime} · {event.venue} · max {event.maxParticipants}{' '}
              participants
            </p>
          </div>

          <div>
            <p className="text-[13px] font-medium text-ink">Proposed registration form</p>
            <div className="mt-2 space-y-1.5">
              {['Participant name (auto)', 'E-mail (auto)', 'Contact number (auto)', ...event.questions.map((q) => `${q.label}${q.required ? ' *' : ''} — ${q.type}`)].map((field) => (
                <p key={field} className="rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink2">
                  {field}
                </p>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink">Decision</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={cn(
                  'rounded-lg border px-3 py-2 text-[13px] font-medium transition',
                  decision === 'approved' ? 'border-success/40 bg-success-soft text-success' : 'border-line text-ink2 hover:bg-muted',
                )}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={cn(
                  'rounded-lg border px-3 py-2 text-[13px] font-medium transition',
                  decision === 'rejected' ? 'border-danger/40 bg-danger-soft text-danger' : 'border-line text-ink2 hover:bg-muted',
                )}
              >
                Reject
              </button>
            </div>
          </div>

          <Field
            label="Review note"
            required={decision === 'rejected'}
            hint={decision === 'rejected' ? 'Required — the creator will see this note.' : 'Optional. Shared with the event creator.'}
          >
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[80px]" placeholder={decision === 'approved' ? 'Conditions or instructions for the organiser…' : 'Reason for rejection and what to change…'} />
          </Field>
        </div>
      </Modal>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Create event                                                        *
 * ------------------------------------------------------------------ */

interface CreateEventValues {
  title: string
  description: string
  category: EventRecord['category']
  date: string
  startTime: string
  endTime: string
  venue: string
  organizer: string
  organizerClub: string
  registrationDeadline: string
  maxParticipants: number
  programCode: ProgramCode | 'All'
  coverTone: 1 | 2 | 3 | 4
  questions: RegistrationQuestion[]
}

function CreateEventModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateEventValues, submit: boolean) => void
}) {
  const { session } = useAuth()
  const today = todayISO()
  const [values, setValues] = useState<CreateEventValues>({
    title: '',
    description: '',
    category: 'Club',
    date: addDays(today, 14),
    startTime: '10:00',
    endTime: '13:00',
    venue: '',
    organizer: session?.displayName ?? 'Student organiser',
    organizerClub: 'Nursing Club',
    registrationDeadline: addDays(today, 10),
    maxParticipants: 50,
    programCode: 'All',
    coverTone: 1,
    questions: [
      { id: 'q-bio', label: 'Year & section', type: 'text', required: true, options: [] },
      { id: 'q-why', label: 'Why do you want to participate?', type: 'textarea', required: false, options: [] },
    ],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [image, setImage] = useState<string | null>(null)

  const set = <K extends keyof CreateEventValues>(key: K, value: CreateEventValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (values.title.trim().length < 4) next.title = 'Give the event a clear title (min 4 characters)'
    if (values.description.trim().length < 20) next.description = 'Describe the event in at least 20 characters'
    if (!values.venue.trim()) next.venue = 'Venue is required'
    if (!values.date) next.date = 'Select an event date'
    if (!values.registrationDeadline) next.deadline = 'Select a registration deadline'
    else if (values.date && values.registrationDeadline > values.date) next.deadline = 'Deadline must be on or before the event date'
    if (values.endTime <= values.startTime) next.time = 'End time must be after start time'
    if (values.maxParticipants < 1) next.maxParticipants = 'At least one participant slot is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const addQuestion = () => {
    set('questions', [
      ...values.questions,
      { id: `q-${Date.now().toString(36)}`, label: '', type: 'text', required: false, options: [] },
    ])
  }

  const updateQuestion = (id: string, patch: Partial<RegistrationQuestion>) =>
    set(
      'questions',
      values.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create institutional event"
      description="The event stays private until a class teacher approves it. You can already share its registration link."
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-ink3">All fields marked * are required</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (validate()) onSubmit(values, false)
              }}
            >
              Save draft
            </Button>
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={() => {
                if (validate()) onSubmit(values, true)
              }}
            >
              Submit for approval
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Event title" required error={errors.title}>
          <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. World Health Day Awareness Drive" />
        </Field>

        <Field label="Description" required error={errors.description} hint="What happens, who it is for and what participants should bring.">
          <Textarea value={values.description} onChange={(e) => set('description', e.target.value)} className="min-h-[92px]" />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Category" required>
            <Select value={values.category} onChange={(e) => set('category', e.target.value as CreateEventValues['category'])} options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Applies to" required>
            <Select
              value={values.programCode}
              onChange={(e) => set('programCode', e.target.value as ProgramCode | 'All')}
              options={[
                { value: 'All', label: 'All programmes' },
                { value: 'GNM', label: 'GNM' },
                { value: 'BSC', label: 'B.Sc. Nursing' },
                { value: 'ANM', label: 'ANM' },
              ]}
            />
          </Field>
          <Field label="Maximum participants" required error={errors.maxParticipants}>
            <Input type="number" min={1} value={values.maxParticipants} onChange={(e) => set('maxParticipants', Number(e.target.value))} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Event date" required error={errors.date}>
            <Input type="date" value={values.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Start time" required error={errors.time}>
            <Input type="time" value={values.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
          <Field label="End time" required>
            <Input type="time" value={values.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Venue" required error={errors.venue}>
            <Input value={values.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Seminar Hall" />
          </Field>
          <Field label="Organiser / club" required>
            <Input value={values.organizerClub} onChange={(e) => set('organizerClub', e.target.value)} placeholder="Photography Club" />
          </Field>
          <Field label="Registration deadline" required error={errors.deadline}>
            <Input type="date" value={values.registrationDeadline} onChange={(e) => set('registrationDeadline', e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Organiser name" required>
            <Input value={values.organizer} onChange={(e) => set('organizer', e.target.value)} />
          </Field>
          <Field label="Event image" hint={image ? 'Image selected for the demonstration' : 'PNG or JPG · stored locally only'}>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files?.[0]?.name ?? null)}
                className="block w-full cursor-pointer rounded-lg border border-line bg-panel px-3 py-2 text-[13px] text-ink2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-[12px] file:font-medium file:text-ink"
              />
            </div>
          </Field>
        </div>

        <div className="rounded-xl border border-line bg-muted/70 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">Registration form questions</p>
              <p className="mt-0.5 text-xs text-ink2">Name, e-mail and contact number are always collected. Add your own fields below.</p>
            </div>
            <Button size="sm" variant="secondary" icon={<Plus className="h-3.5 w-3.5" />} onClick={addQuestion}>
              Add question
            </Button>
          </div>

          <div className="mt-3 space-y-2.5">
            {values.questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border border-line bg-panel p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2 text-[11px] font-semibold text-ink3">Q{index + 1}</span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      inputSize="sm"
                      value={question.label}
                      placeholder="Question label"
                      onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        selectSize="sm"
                        className="w-40"
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, { type: e.target.value as RegistrationQuestion['type'] })}
                        options={[
                          { value: 'text', label: 'Short text' },
                          { value: 'textarea', label: 'Paragraph' },
                          { value: 'select', label: 'Option list' },
                          { value: 'number', label: 'Number' },
                        ]}
                      />
                      {question.type === 'select' && (
                        <Input
                          inputSize="sm"
                          className="w-56"
                          value={question.options.join(', ')}
                          placeholder="Options, comma separated"
                          onChange={(e) => updateQuestion(question.id, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })}
                        />
                      )}
                      <Checkbox
                        checked={question.required}
                        onChange={(checked) => updateQuestion(question.id, { required: checked })}
                        label="Required"
                      />
                      <IconButton
                        tooltip="Remove question"
                        tone="danger"
                        onClick={() => set('questions', values.questions.filter((q) => q.id !== question.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {values.questions.length === 0 && (
              <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-xs text-ink2">
                No custom questions — participants will only provide name, e-mail and contact number.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink">Cover style</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => set('coverTone', tone as 1 | 2 | 3 | 4)}
                className={cn(
                  'h-9 w-16 rounded-lg border-2 transition',
                  TONE_SURFACE[tone],
                  values.coverTone === tone ? 'border-royal' : 'border-transparent',
                )}
                aria-label={`Cover style ${tone}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EventsModule
