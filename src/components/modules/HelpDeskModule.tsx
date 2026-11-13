import { useMemo, useState } from 'react'
import { CheckCircle2, LifeBuoy, MessageSquare, Paperclip, Plus, Send, Ticket } from 'lucide-react'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useToast } from '@/store/ui'
import { cn } from '@/utils/cn'
import { formatDateTime, relativeTime } from '@/utils/format'
import type { SupportTicket, TicketStatus } from '@/types'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge, StatusBadge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Field, Input, Select, Textarea } from '@/components/common/Form'
import { Modal } from '@/components/common/Modal'
import { EmptyState, DemoTag } from '@/components/common/EmptyState'
import { Tabs } from '@/components/common/Tabs'
import { StatCard, StatGrid } from '@/components/dashboard/StatCard'

/* ── shared help desk module ─────────────────────────────────────────────── */

export type HelpDeskScope = 'mine' | 'institution'

interface HelpDeskModuleProps {
  scope: HelpDeskScope
}

const CATEGORIES = [
  'Receipts & Printing',
  'Attendance',
  'Marks & Examinations',
  'Events',
  'Data Export',
  'Navigation & Login',
  'E-content',
  'Other',
]

const STATUS_FILTERS: { id: 'all' | TicketStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
]

export function HelpDeskModule({ scope }: HelpDeskModuleProps) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [reply, setReply] = useState('')

  const [form, setForm] = useState({ title: '', description: '', category: CATEGORIES[0], priority: 'Normal' as SupportTicket['priority'], attachmentName: '' })
  const [error, setError] = useState<string | null>(null)

  const mine = scope === 'mine'
  const tickets = useMemo(() => {
    const list = state.tickets
      .filter((ticket) => (mine ? ticket.createdBy === (session?.displayName ?? '') : true))
      .filter((ticket) => (statusFilter === 'all' ? true : ticket.status === statusFilter))
      .filter((ticket) => (categoryFilter === 'all' ? true : ticket.category === categoryFilter))
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [state.tickets, mine, session, statusFilter, categoryFilter])

  const allMine = useMemo(
    () => state.tickets.filter((t) => t.createdBy === (session?.displayName ?? '')),
    [state.tickets, session],
  )
  const base = mine ? allMine : state.tickets
  const openCount = base.filter((t) => t.status !== 'resolved').length
  const resolvedCount = base.filter((t) => t.status === 'resolved').length
  const avgReplies = base.length
    ? Number((base.reduce((s, t) => s + t.replies.length, 0) / base.length).toFixed(1))
    : 0

  const active = state.tickets.find((t) => t.id === openId) ?? null
  const categories = useMemo(
    () => Array.from(new Set((mine ? allMine : state.tickets).map((t) => t.category))),
    [state.tickets, allMine, mine],
  )

  function submit() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Provide a title and description so the development desk can reproduce the issue.')
      return
    }
    const result = actions.createTicket({
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      priority: form.priority,
      createdBy: session?.displayName ?? 'Demo user',
      createdByRole: session?.role ?? 'student',
      attachmentName: form.attachmentName.trim() || null,
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    actions.addAudit({
      actor: session?.displayName ?? 'Demo user',
      actorRole: session?.role ?? 'student',
      action: 'Raised a help desk ticket',
      target: result.ticket?.code ?? 'Ticket',
      reason: 'Developer help desk request through the portal',
    })
    toast.success(result.message, 'The simulated development desk has already acknowledged it.')
    setCreating(false)
    setError(null)
    setForm({ title: '', description: '', category: CATEGORIES[0], priority: 'Normal', attachmentName: '' })
    if (result.ticket) setOpenId(result.ticket.id)
  }

  function addReply() {
    if (!active || !reply.trim()) return
    const message = reply.trim()
    const ticketId = active.id
    actions.addTicketReply(ticketId, {
      author: session?.displayName ?? 'Demo user',
      authorRole: session?.role ?? 'student',
      message,
    })
    setReply('')
    toast.success('Note added to the ticket thread.')
    window.setTimeout(() => {
      actions.updateTicketStatus(ticketId, 'in-progress', {
        author: 'PMEl Development Desk',
        message: 'Received — the development desk is reviewing your note. (Simulated response in this demonstration.)',
      })
    }, 900)
  }

  async function setStatus(status: TicketStatus) {
    if (!active) return
    if (status === 'resolved') {
      const proceed = await confirm({
        title: `Resolve ${active.code}?`,
        description: 'The ticket moves to Resolved and stays visible in the history.',
        confirmLabel: 'Mark resolved',
      })
      if (!proceed) return
    }
    const deskReplies: Partial<Record<TicketStatus, string>> = {
      'in-progress': 'Picked up by the development desk — work in progress. (Simulated)',
      resolved: 'Fix verified in the demonstration build — closing this ticket. (Simulated)',
      open: 'Reopened for another look. (Simulated)',
    }
    actions.updateTicketStatus(active.id, status, {
      author: 'PMEl Development Desk',
      message: deskReplies[status] ?? 'Status updated.',
    })
    toast.success(`Ticket ${active.code} moved to ${status}.`)
  }

  return (
    <div className="space-y-4">
      <StatGrid className="lg:grid-cols-4">
        <StatCard label={mine ? 'My tickets' : 'Total tickets'} value={base.length} icon={<Ticket className="h-4 w-4" />} showDemoTag hint={mine ? 'Raised by your account' : 'Across all demo accounts'} />
        <StatCard label="Open / in progress" value={openCount} icon={<LifeBuoy className="h-4 w-4" />} tone={openCount ? 'gold' : 'success'} />
        <StatCard label="Resolved" value={resolvedCount} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
        <StatCard label="Avg. replies" value={avgReplies} icon={<MessageSquare className="h-4 w-4" />} tone="royal" hint="Includes simulated desk responses" />
      </StatGrid>

      <Card>
        <CardHeader
          title={mine ? 'My help desk tickets' : 'Developer help desk'}
          description={
            mine
              ? 'Track issues you have raised with the development desk.'
              : 'Every ticket raised across the demonstration — replies are simulated by the development desk.'
          }
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              New ticket
            </Button>
          }
        />
        <CardBody>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Tabs
              items={STATUS_FILTERS.map((s) => ({ id: s.id, label: s.label }))}
              value={statusFilter}
              onChange={(id) => setStatusFilter(id as 'all' | TicketStatus)}
              size="sm"
            />
            <div className="w-full max-w-52">
              <Select
                selectSize="sm"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>

          {tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title={statusFilter === 'all' ? 'No tickets yet' : `No ${statusFilter} tickets`}
              description="Raise a ticket to see the full workflow — acknowledgement, replies and status transitions are all simulated."
              action={
                <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
                  Create the first ticket
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(ticket.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left transition hover:border-royal/40 hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-royal">{ticket.code}</span>
                        <span className="truncate text-[13px] font-medium text-ink">{ticket.title}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink3">
                        {ticket.category} · {ticket.createdBy} · {relativeTime(ticket.createdAt)}
                        {ticket.replies.length > 0 && ` · ${ticket.replies.length} repl${ticket.replies.length === 1 ? 'y' : 'ies'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={ticket.priority === 'High' ? 'danger' : ticket.priority === 'Low' ? 'neutral' : 'warn'}>
                        {ticket.priority}
                      </Badge>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <DemoTag label="Simulated support desk" />
          </div>
        </CardBody>
      </Card>

      {/* create */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Raise a help desk ticket"
        description="Describe the issue — the simulated development desk acknowledges every ticket instantly."
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button icon={<Send className="h-4 w-4" />} onClick={submit}>
              Submit ticket
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>
          )}
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Short summary of the problem"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value as SupportTicket['priority'] })}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Normal', label: 'Normal' },
                  { value: 'High', label: 'High' },
                ]}
              />
            </Field>
          </div>
          <Field label="Description" required hint="Steps to reproduce, expected behaviour, what you saw.">
            <Textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="1. Open … 2. Click … — the screen shows …"
            />
          </Field>
          <Field label="Attachment (simulated)" hint="File names only — no file is uploaded in this demo.">
            <Input
              value={form.attachmentName}
              onChange={(event) => setForm({ ...form, attachmentName: event.target.value })}
              placeholder="screenshot-error.png"
            />
          </Field>
        </div>
      </Modal>

      {/* thread */}
      <Modal
        open={active !== null}
        onClose={() => setOpenId(null)}
        title={active ? `${active.code} — ${active.title}` : ''}
        description={active ? `${active.category} · raised by ${active.createdBy} · ${formatDateTime(active.createdAt)}` : ''}
        size="lg"
        footer={
          active ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {active.status !== 'open' && active.status !== 'resolved' && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus('open')}>
                    Reopen
                  </Button>
                )}
                {active.status !== 'resolved' && (
                  <Button size="sm" variant="secondary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setStatus('resolved')}>
                    Mark resolved
                  </Button>
                )}
                {active.status === 'resolved' && (
                  <Button size="sm" variant="secondary" onClick={() => setStatus('in-progress')}>
                    Reopen as in progress
                  </Button>
                )}
              </div>
              <DemoTag label="Simulated thread" />
            </div>
          ) : undefined
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-muted/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={active.status} />
                <Badge tone={active.priority === 'High' ? 'danger' : active.priority === 'Low' ? 'neutral' : 'warn'}>
                  {active.priority} priority
                </Badge>
                {active.attachmentName && (
                  <Badge tone="info" icon={<Paperclip className="h-3 w-3" />}>
                    {active.attachmentName}
                  </Badge>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-ink2">{active.description}</p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink3">Thread</p>
              <ol className="space-y-3">
                {active.replies.map((entry) => {
                  const isDesk = entry.authorRole === 'developer'
                  return (
                    <li
                      key={entry.id}
                      className={cn(
                        'rounded-xl border px-4 py-3',
                        isDesk ? 'border-royal/25 bg-royal-soft/60' : 'border-line bg-panel',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={cn('text-[13px] font-semibold', isDesk ? 'text-royal' : 'text-ink')}>
                          {entry.author}
                          {isDesk && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-ink3">
                              development desk
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-ink3">{relativeTime(entry.at)}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-6 text-ink2">{entry.message}</p>
                    </li>
                  )
                })}
                {active.replies.length === 0 && (
                  <li className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs text-ink3">
                    No replies yet — the development desk will respond shortly.
                  </li>
                )}
              </ol>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Add a note">
                  <Textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Add more detail or a follow-up…"
                  />
                </Field>
              </div>
              <Button icon={<Send className="h-4 w-4" />} disabled={!reply.trim()} onClick={addReply}>
                Send
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HelpDeskModule
