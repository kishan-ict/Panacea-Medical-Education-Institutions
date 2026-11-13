import { CalendarDays, ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DemoTag } from '@/components/common/EmptyState'
import { MiniStats } from '@/components/dashboard/StatCard'
import { TimetableModule } from '@/components/modules/TimetableModule'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { subjectsForTeacher } from '@/store/selectors'
import { WEEK_DAYS } from '@/utils/format'

/**
 * Class session — the subject teacher's "what am I teaching today" page.
 *
 * No permission guard: `timetable.view` is a read capability every teaching
 * role holds, and PortalGate already role-gates this route. Attendance and
 * marks are opened from their own nav items so the workflow stays explicit.
 */
export default function SessionPage() {
  const { session } = useAuth()
  const { state } = useDemo()

  const teacherId = session?.linkedId ?? ''
  const todayName = WEEK_DAYS[(new Date().getDay() + 6) % 7]
  const todaySlots = state.timetable.filter(
    (slot) => slot.teacherId === teacherId && slot.day === todayName,
  )
  const classesToday = new Set(todaySlots.map((slot) => slot.classId)).size
  const subjects = subjectsForTeacher(state, teacherId).length

  return (
    <>
      <PageHeader
        title="Class Session"
        description="Your teaching plan for today with the weekly timetable for your allocated classes."
        actions={<DemoTag />}
      />

      <div className="space-y-4">
        <MiniStats
          items={[
            {
              label: 'Periods today',
              value: todaySlots.length,
              hint: 'scheduled for you',
            },
            {
              label: 'Classes today',
              value: classesToday,
              hint: 'distinct classes',
            },
            {
              label: 'Subjects',
              value: subjects,
              hint: 'subject allocations',
            },
          ]}
        />

        <TimetableModule teacherId={teacherId || undefined} showClassPicker={false} />

        <Card>
          <CardHeader
            title="Session workflow"
            description="How attendance and marks fit around this timetable"
            icon={<ClipboardCheck className="h-4 w-4" />}
          />
          <CardBody>
            <p className="text-[13px] leading-6 text-ink2">
              This session view is read-only. Marking attendance and entering marks open from their
              own navigation items — <span className="font-medium text-ink">Attendance</span> and{' '}
              <span className="font-medium text-ink">Marks Entry</span> — so every figure stays tied
              to the record that produced it. Use{' '}
              <span className="font-medium text-ink">Today's classes</span> above to plan the day, then
              record against the matching class, subject and period.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink3">
              <CalendarDays className="h-3.5 w-3.5" />
              Periods run Monday to Saturday across six slots per day in the demonstration timetable.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
