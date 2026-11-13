import {
  CalendarHeart,
  ClipboardCheck,
  Download,
  GraduationCap,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types'
import { useDemo } from '@/store/DemoStore'
import {
  classRosterSummary,
  examAverage,
  feeSummary,
  overallAttendance,
  publishedExams,
} from '@/store/selectors'
import { PROGRAMMES } from '@/data/constants/institution'
import { useToast } from '@/store/ui'
import { formatDate, formatMoney, formatPercent, relativeTime, todayISO } from '@/utils/format'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader, KeyValue } from '@/components/common/Card'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'

interface ReportCard {
  id: 'roster' | 'attendance' | 'exams' | 'fees' | 'faculty' | 'events'
  icon: LucideIcon
  title: string
  description: string
}

const REPORTS: ReportCard[] = [
  {
    id: 'roster',
    icon: Users,
    title: 'Student roster',
    description: 'Programme-wise enrolment with class allocation, guardians and admission dates.',
  },
  {
    id: 'attendance',
    icon: ClipboardCheck,
    title: 'Attendance summary',
    description: 'Class and subject attendance percentages with present / absent / late tallies.',
  },
  {
    id: 'exams',
    icon: GraduationCap,
    title: 'Examination performance',
    description: 'Published examination averages with subject-wise and class-wise breakdowns.',
  },
  {
    id: 'fees',
    icon: Wallet,
    title: 'Fee collection',
    description: 'Collected against expected fees, outstanding balances and issued receipts.',
  },
  {
    id: 'faculty',
    icon: UsersRound,
    title: 'Faculty & allocations',
    description: 'Teaching staff by department with subject-class allocations and class teachers.',
  },
  {
    id: 'events',
    icon: CalendarHeart,
    title: 'Events & activities',
    description: 'Approved events, proposals awaiting approval and participant registrations.',
  },
]

const AUDIENCE_LABEL: Record<ReportsModuleProps['audience'], string> = {
  chairman: 'Chairman',
  director: 'Director',
  principal: 'Principal',
}

const ROLE_TONE: Record<Role, BadgeTone> = {
  chairman: 'brand',
  director: 'info',
  principal: 'gold',
  classTeacher: 'success',
  subjectTeacher: 'success',
  student: 'neutral',
  accountant: 'warn',
}

const ROLE_LABEL: Record<Role, string> = {
  chairman: 'Chairman',
  director: 'Director',
  principal: 'Principal',
  classTeacher: 'Class Teacher',
  subjectTeacher: 'Subject Teacher',
  student: 'Student',
  accountant: 'Accountant',
}

export interface ReportsModuleProps {
  audience: 'chairman' | 'director' | 'principal'
}

/**
 * Reporting centre — every report card is honestly labelled as a
 * demonstration action (no fake downloads), and the institutional summary
 * is derived live from the selectors.
 */
export function ReportsModule({ audience }: ReportsModuleProps) {
  const { state } = useDemo()
  const toast = useToast()

  const latest = (rows: string[]): string | undefined => rows.slice().sort().pop()

  const preparedDate = (id: ReportCard['id']): string => {
    switch (id) {
      case 'roster':
        return latest(state.students.map((row) => row.admissionDate)) ?? todayISO()
      case 'attendance':
        return latest(state.attendance.map((row) => row.date)) ?? todayISO()
      case 'exams':
        return latest(publishedExams(state).map((row) => row.startDate)) ?? todayISO()
      case 'fees':
        return latest(state.receipts.map((row) => row.paidAt)) ?? todayISO()
      case 'faculty':
        return latest(state.teachers.map((row) => row.joiningDate)) ?? todayISO()
      case 'events':
        return latest(state.events.map((row) => row.date)) ?? todayISO()
      default:
        return todayISO()
    }
  }

  const roster = classRosterSummary(state)
  const attendance = overallAttendance(state)
  const fees = feeSummary(state)
  const latestExam = [...publishedExams(state)].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  const examResult = latestExam ? examAverage(state, latestExam.id) : null
  const showAudit = audience === 'chairman' || audience === 'director'
  const totalSeats = PROGRAMMES.reduce((sum, programme) => sum + programme.seats, 0)

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold text-ink">Reports &amp; exports</h2>
          <DemoTag />
        </div>
        <p className="mt-0.5 text-[13px] text-ink2">
          Prepared for the {AUDIENCE_LABEL[audience]} portal. Figures below are derived live from the demonstration
          dataset.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <div key={report.id} className="flex flex-col rounded-xl border border-line bg-panel p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-soft text-royal">
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{report.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink2">{report.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-[11px] text-ink3">Prepared {formatDate(preparedDate(report.id))}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={() =>
                    toast.info('Report prepared', 'PDF export is not wired up in this demonstration build…')
                  }
                >
                  Generate
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader
          title="Institutional summary"
          description="Key figures recalculated from the store every time this page renders."
          action={<DemoTag />}
        />
        <CardBody className="divide-y divide-line py-1">
          <KeyValue
            label="Programmes & sanctioned seats"
            value={`${PROGRAMMES.length} programmes · ${totalSeats} seats`}
          />
          <KeyValue label="Class strengths" value={`${roster.length} classes`} />
          {roster.map((row) => (
            <KeyValue
              key={row.cls.id}
              className="pl-3"
              label={row.cls.name}
              value={`${row.students} students${row.teacher ? ` · ${row.teacher.name}` : ' · No class teacher'}`}
            />
          ))}
          <KeyValue
            label="Overall attendance"
            value={`${formatPercent(attendance.pct)} · ${attendance.total} session records`}
          />
          <KeyValue
            label="Latest published examination"
            value={
              latestExam && examResult
                ? `${latestExam.shortName} — ${formatPercent(examResult.percentage)} avg (${examResult.appeared} students)`
                : 'No published examination yet'
            }
          />
          <KeyValue
            label="Fee collection"
            value={`${formatMoney(fees.collected)} of ${formatMoney(fees.expected)} · ${formatMoney(fees.outstanding)} outstanding`}
          />
        </CardBody>
      </Card>

      {showAudit && (
        <Card>
          <CardHeader
            title="Access & audit activity"
            description="Governed access logging — identifiable records are only opened with a recorded reason."
            action={<DemoTag />}
          />
          <CardBody className="space-y-3">
            {state.audit.length === 0 ? (
              <EmptyState
                compact
                icon={ShieldCheck}
                title="No audit activity"
                description="Access to individual records will be listed here as it happens."
              />
            ) : (
              <ul className="space-y-2.5">
                {state.audit.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-line px-3.5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{entry.actor}</span>
                        <Badge tone={ROLE_TONE[entry.actorRole]}>{ROLE_LABEL[entry.actorRole]}</Badge>
                      </div>
                      <span className="text-[11px] text-ink3">{relativeTime(entry.at)}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink2">{entry.action}</p>
                    <p className="mt-0.5 text-[12px] text-ink3">Target: {entry.target}</p>
                    <p className="mt-1 rounded-lg bg-muted px-2.5 py-1.5 text-[12px] italic text-ink2">
                      Reason: {entry.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default ReportsModule
