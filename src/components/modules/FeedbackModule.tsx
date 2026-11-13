import { useState } from 'react'
import { CheckCircle2, MessageSquare, Send, Star } from 'lucide-react'
import type { FeedbackRecord } from '@/types'
import { cn } from '@/utils/cn'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import { feedbackStats } from '@/store/selectors'
import { relativeTime } from '@/utils/format'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { Field, Select, Textarea } from '@/components/common/Form'
import { BarList } from '@/components/common/Progress'

const CATEGORIES = [
  'Portal usability',
  'Student portal',
  'Examination',
  'Fees & receipts',
  'Events',
  'Navigation',
  'Reports',
  'Other',
] as const

const MIN_MESSAGE = 10

export interface FeedbackModuleProps {
  /** canView → institutional aggregate alongside the submission form */
  canView?: boolean
}

/**
 * Feedback — everyone can submit; users with `canView` also see the
 * institutional aggregate computed live from the store.
 */
export function FeedbackModule({ canView = false }: FeedbackModuleProps = {}) {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const toast = useToast()

  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [message, setMessage] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [sent, setSent] = useState<{ category: string; rating: number; message: string } | null>(null)

  const trimmed = message.trim()
  const ratingError = attempted && rating === 0 ? 'Select a rating from 1 to 5 stars.' : undefined
  const messageError =
    attempted && trimmed.length < MIN_MESSAGE ? `Please write at least ${MIN_MESSAGE} characters.` : undefined

  const submit = () => {
    setAttempted(true)
    if (rating === 0 || trimmed.length < MIN_MESSAGE) return
    if (!session) {
      toast.error('No active session', 'Sign in again before submitting feedback.')
      return
    }
    actions.addFeedback({
      category,
      rating,
      message: trimmed,
      submittedBy: session.displayName,
      submittedRole: session.role,
    })
    toast.success('Feedback submitted', 'Thank you — your response has been recorded in the demonstration dataset.')
    setSent({ category, rating, message: trimmed })
  }

  const reset = () => {
    setSent(null)
    setCategory(CATEGORIES[0])
    setRating(0)
    setHover(0)
    setMessage('')
    setAttempted(false)
  }

  const stats = feedbackStats(state.feedback)
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = state.feedback.filter((row) => row.rating === stars).length
    const share = stats.count ? Math.round((count / stats.count) * 100) : 0
    return {
      label: `${stars} star${stars === 1 ? '' : 's'}`,
      value: count,
      hint: `${share}% of ${stats.count} response${stats.count === 1 ? '' : 's'}`,
    }
  })
  const recent = [...state.feedback].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Feedback</h2>
            <DemoTag />
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            Tell us how the demonstration platform is working for your role.
          </p>
        </div>
        <Badge tone="neutral" icon={<MessageSquare className="h-3 w-3" />}>
          {stats.count} responses
        </Badge>
      </div>

      <div className={cn('grid gap-4', canView && 'lg:grid-cols-2')}>
        <Card>
          <CardHeader
            title="Submit feedback"
            description="Responses are stored in the demonstration dataset on this device."
            icon={<Send className="h-4 w-4" />}
          />
          <CardBody className="space-y-4">
            {sent ? (
              <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-success" strokeWidth={1.7} />
                <p className="mt-2 text-sm font-semibold text-ink">Thank you — your feedback has been recorded.</p>
                <p className="mt-1 text-xs leading-5 text-ink2">
                  {sent.category} · {sent.rating} star{sent.rating === 1 ? '' : 's'}
                </p>
                <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-[13px] leading-6 text-ink">
                  “{sent.message}”
                </p>
                <Button className="mt-4" variant="secondary" onClick={reset}>
                  Submit another response
                </Button>
              </div>
            ) : (
              <>
                <Field label="Category">
                  <Select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    options={CATEGORIES.map((value) => ({ value, label: value }))}
                  />
                </Field>

                <Field label="Rating" required error={ratingError} hint="1 = needs work, 5 = excellent.">
                  <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHover(value)}
                        className="rounded p-1 transition hover:bg-gold-soft"
                      >
                        <Star
                          className={cn(
                            'h-6 w-6 transition-colors',
                            (hover || rating) >= value ? 'text-gold' : 'text-line-strong',
                          )}
                          strokeWidth={1.6}
                          fill={(hover || rating) >= value ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-[13px] font-medium text-ink2">
                      {rating > 0 ? `${rating} / 5` : 'Not rated'}
                    </span>
                  </div>
                </Field>

                <Field
                  label="Your feedback"
                  required
                  error={messageError}
                  hint={`${trimmed.length}/${MIN_MESSAGE} characters minimum`}
                >
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="What worked well, and what should we improve?"
                    className="min-h-[112px]"
                  />
                </Field>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={reset} disabled={!message && !rating}>
                    Clear
                  </Button>
                  <Button icon={<Send className="h-4 w-4" />} onClick={submit}>
                    Submit feedback
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {canView && (
          <Card>
            <CardHeader
              title="Institutional feedback"
              description="Aggregate across every demonstration response."
              action={<DemoTag />}
            />
            <CardBody className="space-y-5">
              <div className="flex items-end justify-between gap-4 rounded-xl border border-line bg-muted/60 px-4 py-3.5">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-ink3">Average rating</p>
                  <p className="mt-1 font-display text-2xl font-bold text-ink tabular-nums">
                    {stats.average.toFixed(1)}
                    <span className="ml-1 text-sm font-medium text-ink3">/ 5</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={cn('h-4 w-4', value <= Math.round(stats.average) ? 'text-gold' : 'text-line-strong')}
                      strokeWidth={1.6}
                      fill={value <= Math.round(stats.average) ? 'currentColor' : 'none'}
                    />
                  ))}
                  <span className="ml-2 text-xs text-ink2">{stats.count} responses</span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink3">
                  Rating distribution
                </p>
                <BarList rows={distribution} suffix="" />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink3">
                  Recent submissions
                </p>
                {recent.length === 0 ? (
                  <EmptyState
                    compact
                    icon={MessageSquare}
                    title="No feedback yet"
                    description="Submitted responses will be listed here."
                  />
                ) : (
                  <ul className="space-y-2">
                    {recent.map((row) => (
                      <li key={row.id} className="rounded-lg border border-line px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-ink">{row.category}</span>
                          <span className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <Star
                                  key={value}
                                  className={cn(
                                    'h-3 w-3',
                                    value <= row.rating ? 'text-gold' : 'text-line-strong',
                                  )}
                                  strokeWidth={1.6}
                                  fill={value <= row.rating ? 'currentColor' : 'none'}
                                />
                              ))}
                            </span>
                            <span className="text-[11px] text-ink3">{relativeTime(row.at)}</span>
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink2">{row.message}</p>
                        <p className="mt-1 text-[11px] text-ink3">
                          {row.submittedBy} · {roleLabel(row.submittedRole)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

function roleLabel(role: FeedbackRecord['submittedRole']): string {
  return role
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim()
}

export default FeedbackModule
