import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import type { DemoState } from '@/types'
import { cn, uid } from '@/utils/cn'
import { useDemo } from '@/store/DemoStore'
import {
  classAttendanceSeries,
  courseDistribution,
  departmentFaculty,
  examAverage,
  examClassSeries,
  feeSummary,
  feeTrend,
  institutionalStats,
  overallAttendance,
  pendingEventApprovals,
  publishedExams,
  subjectPerformance,
  unassignedClasses,
} from '@/store/selectors'
import { DISCLAIMER } from '@/data/constants/institution'
import { formatDate, formatMoney, formatNumber, formatPercent, nowISO, relativeTime } from '@/utils/format'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { Input } from '@/components/common/Form'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: string
}

interface Topic {
  id: string
  keywords: string[]
  build: (state: DemoState) => string
}

/* ------------------------------------------------------------------ *
 * Answer builders — every figure is computed live from the store.      *
 * ------------------------------------------------------------------ */

function enrolmentAnswer(state: DemoState): string {
  const stats = institutionalStats(state)
  const distribution = courseDistribution(state)
  const total = distribution.reduce((sum, row) => sum + row.value, 0)
  return [
    `The demonstration dataset holds ${formatNumber(stats.students)} active students across ${stats.classes} classes.`,
    '',
    'Programme enrolment:',
    ...distribution.map((row) => `  • ${row.name}: ${formatNumber(row.value)} students`),
    '',
    `Total enrolment: ${formatNumber(total)} students.`,
  ].join('\n')
}

function lowestAttendanceAnswer(state: DemoState): string {
  const rows = classAttendanceSeries(state)
    .filter((row) => row.pct > 0)
    .sort((a, b) => a.pct - b.pct)
  if (!rows.length) return 'No attendance sessions have been recorded in the demonstration dataset yet.'
  const worst = rows[0]
  const best = rows[rows.length - 1]
  return [
    `${worst.name} (${worst.code}) has the lowest attendance at ${formatPercent(worst.pct)}.`,
    '',
    'Bottom three classes:',
    ...rows.slice(0, 3).map((row, index) => `  ${index + 1}. ${row.name} — ${formatPercent(row.pct)}`),
    '',
    `Highest: ${best.name} at ${formatPercent(best.pct)}.`,
  ].join('\n')
}

function overallAttendanceAnswer(state: DemoState): string {
  const tally = overallAttendance(state)
  if (!tally.total) return 'No attendance has been recorded in the demonstration dataset yet.'
  return [
    `Overall attendance across the demonstration dataset is ${formatPercent(tally.pct)}.`,
    '',
    `  • ${formatNumber(tally.present)} present`,
    `  • ${formatNumber(tally.late)} late`,
    `  • ${formatNumber(tally.absent)} absent`,
    `  • ${formatNumber(tally.total)} marks recorded in total`,
  ].join('\n')
}

function courseEnrolmentAnswer(state: DemoState): string {
  const rows = courseDistribution(state).sort((a, b) => b.value - a.value)
  if (!rows.length || rows[0].value === 0) return 'No student enrolment records exist in the demonstration dataset.'
  const top = rows[0]
  return [
    `${top.name} has the highest student enrolment with ${formatNumber(top.value)} students.`,
    '',
    'All programmes by enrolment:',
    ...rows.map((row, index) => `  ${index + 1}. ${row.name}: ${formatNumber(row.value)} students`),
  ].join('\n')
}

function pendingEventsAnswer(state: DemoState): string {
  const pending = pendingEventApprovals(state)
  if (!pending.length) return 'There are no event proposals awaiting approval in the demonstration dataset.'
  const lines = [
    `${pending.length} event${pending.length === 1 ? ' is' : 's are'} pending approval:`,
    '',
    ...pending
      .slice(0, 6)
      .map((event, index) => `  ${index + 1}. ${event.title} — ${event.category}, ${formatDate(event.date)}`),
  ]
  if (pending.length > 6) lines.push('', `  …and ${pending.length - 6} more.`)
  return lines.join('\n')
}

function feeAnswer(state: DemoState): string {
  const summary = feeSummary(state)
  const trend = feeTrend(state)
  const pct = summary.expected ? Math.round((summary.collected / summary.expected) * 100) : 0
  const lines = [
    'Fee collection overview (demonstration figures):',
    `  • Collected: ${formatMoney(summary.collected)} of ${formatMoney(summary.expected)} expected (${pct}%)`,
    `  • Outstanding: ${formatMoney(summary.outstanding)} across ${summary.pendingRecords} pending record(s)`,
    `  • Receipts issued: ${formatNumber(state.receipts.length)} (${formatMoney(summary.todayCollected)} recorded today)`,
    `  • Fee records in the dataset: ${summary.records}`,
  ]
  if (trend.length) {
    lines.push('', 'Monthly collection trend:')
    trend.slice(-4).forEach((row) => lines.push(`  • ${row.month}: ${formatMoney(row.amount)}`))
  }
  return lines.join('\n')
}

function performanceAnswer(state: DemoState): string {
  const exam = [...publishedExams(state)].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  if (!exam) return 'No examination has been published yet in the demonstration dataset.'
  const average = examAverage(state, exam.id)
  const subjects = subjectPerformance(state, exam.id)
  const classes = examClassSeries(state, exam.id)
  const lines = [
    `${exam.name} (published) — institutional average ${formatPercent(average.percentage)} across ${formatNumber(
      average.appeared,
    )} students (${formatNumber(average.records)} subject entries).`,
    '',
  ]
  if (subjects.length) {
    const strongest = subjects[0]
    const weakest = subjects[subjects.length - 1]
    lines.push(`  • Strongest subject: ${strongest.name} at ${formatPercent(strongest.pct)}`)
    lines.push(`  • Needs attention: ${weakest.name} at ${formatPercent(weakest.pct)}`)
  }
  if (classes.length) {
    const bestClass = [...classes].sort((a, b) => b.pct - a.pct)[0]
    lines.push(`  • Best performing class: ${bestClass.name} at ${formatPercent(bestClass.pct)}`)
  }
  return lines.join('\n')
}

function staffAnswer(state: DemoState): string {
  const active = state.teachers.filter((teacher) => teacher.status === 'active')
  const inactive = state.teachers.length - active.length
  const departments = departmentFaculty(state).filter((row) => row.faculty > 0)
  return [
    `There are ${formatNumber(active.length)} active teaching staff in the demonstration dataset${
      inactive ? ` (and ${inactive} marked inactive)` : ''
    }.`,
    '',
    'Active faculty by department:',
    ...departments.map((row) => `  • ${row.department}: ${row.faculty}`),
    '',
    `Departments represented: ${departments.length}.`,
  ].join('\n')
}

function unassignedAnswer(state: DemoState): string {
  const rows = unassignedClasses(state)
  if (!rows.length) return 'Every class in the demonstration dataset has a class teacher assigned.'
  return [
    `${rows.length} class${rows.length === 1 ? '' : 'es'} still without a class teacher:`,
    '',
    ...rows.map((cls) => `  • ${cls.name} (${cls.code})`),
    '',
    'Assign one from the staff & allocations screen to complete the roster.',
  ].join('\n')
}

function fallbackAnswer(): string {
  return [
    'I could not match that question to a topic in the demonstration dataset.',
    '',
    'I can answer questions about:',
    '  • Enrolment — how many students are enrolled, by programme',
    '  • Attendance — the overall percentage and the lowest-attending class',
    '  • Examinations — the latest published average by subject and class',
    '  • Fees — collected vs expected, outstanding amounts, receipts and trend',
    '  • Events — proposals still awaiting approval',
    '  • Staff — active teaching staff counted by department',
    '  • Allocations — classes that still have no class teacher',
    '',
    'Try one of the suggested questions alongside this chat.',
  ].join('\n')
}

const TOPICS: Topic[] = [
  {
    id: 'enrolment',
    keywords: ['enrolled', 'enrolment', 'enrollment', 'how many students', 'students', 'headcount', 'total students'],
    build: enrolmentAnswer,
  },
  {
    id: 'lowest-attendance',
    keywords: ['lowest', 'attendance', 'worst attendance', 'poorest attendance'],
    build: lowestAttendanceAnswer,
  },
  {
    id: 'overall-attendance',
    keywords: ['overall attendance', 'overall', 'percentage', 'percent'],
    build: overallAttendanceAnswer,
  },
  {
    id: 'course-enrolment',
    keywords: ['course', 'programme', 'program', 'highest', 'enrollment', 'by programme'],
    build: courseEnrolmentAnswer,
  },
  {
    id: 'pending-events',
    keywords: ['events', 'pending', 'approval', 'awaiting'],
    build: pendingEventsAnswer,
  },
  {
    id: 'fees',
    keywords: ['fee', 'fees', 'collect', 'collection', 'receipts', 'outstanding'],
    build: feeAnswer,
  },
  {
    id: 'performance',
    keywords: ['academic', 'performance', 'exam', 'examination', 'marks', 'results'],
    build: performanceAnswer,
  },
  {
    id: 'staff',
    keywords: ['staff', 'teachers', 'teaching', 'faculty', 'active'],
    build: staffAnswer,
  },
  {
    id: 'unassigned',
    keywords: ['unassigned', 'class teachers', 'class teacher', 'without a class teacher'],
    build: unassignedAnswer,
  },
]

function answerFor(question: string, state: DemoState): string {
  const text = question.toLowerCase()
  let best: { topic: Topic; score: number } | null = null
  for (const topic of TOPICS) {
    const score = topic.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { topic, score }
  }
  return best ? best.topic.build(state) : fallbackAnswer()
}

const SUGGESTIONS = [
  'How many students are currently enrolled?',
  'Which class has the lowest attendance?',
  'What is the overall attendance percentage?',
  'Which course has the highest student enrollment?',
  'How many events are pending approval?',
  'Show me the fee collection overview.',
  'Give me the academic performance summary.',
  'How many teaching staff are active?',
  'Which class teachers are still unassigned?',
]

export function AssistantModule() {
  const { state } = useDemo()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const element = listRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages, busy])

  useEffect(() => {
    const timer = timerRef
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const send = (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    setMessages((previous) => [...previous, { id: uid('msg'), role: 'user', text, at: nowISO() }])
    setBusy(true)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setMessages((previous) => [
        ...previous,
        { id: uid('msg'), role: 'assistant', text: answerFor(text, state), at: nowISO() },
      ])
      setBusy(false)
    }, 650)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="text-[15px] font-semibold text-ink">Institutional Assistant</h2>
          <Badge tone="gold">Demo AI Assistant</Badge>
          <DemoTag />
        </div>
        <p className="mt-1.5 max-w-3xl text-xs leading-5 text-ink2">{DISCLAIMER.assistant}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <div
            ref={listRef}
            className="max-h-[460px] min-h-[300px] flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Start a conversation"
                description="Ask about enrolment, attendance, fees, events or academic performance."
              />
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-card',
                      message.role === 'user' ? 'bg-brand text-white' : 'bg-brand-soft/60 text-ink',
                    )}
                  >
                    <p className="whitespace-pre-line text-[13px] leading-6">{message.text}</p>
                    <p
                      className={cn(
                        'mt-1.5 text-[10px]',
                        message.role === 'user' ? 'text-white/70' : 'text-ink3',
                      )}
                    >
                      {relativeTime(message.at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-brand-soft/60 px-3.5 py-2.5 text-[13px] text-ink2">
                  Reviewing the demonstration dataset…
                </div>
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-line px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              send(input)
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about the demonstration dataset…"
              aria-label="Question for the institutional assistant"
            />
            <Button type="submit" icon={<Send className="h-4 w-4" />} disabled={busy || !input.trim()}>
              Send
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader
            title="Suggested questions"
            description="Each answer is computed live from the demonstration store."
            compact
          />
          <CardBody className="flex flex-col gap-2">
            {SUGGESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                disabled={busy}
                onClick={() => send(question)}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-left text-[13px] leading-5 text-ink2 transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-ink disabled:pointer-events-none disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default AssistantModule
