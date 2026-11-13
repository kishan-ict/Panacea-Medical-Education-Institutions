import { useState } from 'react'
import { CalendarClock, CalendarDays } from 'lucide-react'
import { useDemo } from '@/store/DemoStore'
import { className as classNameOf, classCode, getSubject, getTeacher } from '@/store/selectors'
import { WEEK_DAYS, dayOfWeek, todayISO } from '@/utils/format'
import { cn } from '@/utils/cn'
import { CHART_COLORS } from '@/components/charts/Charts'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { Field, Select } from '@/components/common/Form'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'

const PERIOD_COUNT = 6

export interface TimetableModuleProps {
  /** limit which classes can be viewed */
  classIds?: string[]
  /** when set without classIds → show only that teacher's teaching slots */
  teacherId?: string
  /** show a class <Select> when more than one class is available */
  showClassPicker?: boolean
  /** default true: emphasise today */
  dayHighlight?: boolean
}

/**
 * Weekly teaching grid — periods 1..6 across Monday..Saturday.
 *
 * Every figure comes from `state.timetable`; subject colours reuse the
 * semantic chart palette so the board matches the rest of the platform.
 */
export function TimetableModule({
  classIds,
  teacherId,
  showClassPicker = true,
  dayHighlight = true,
}: TimetableModuleProps = {}) {
  const { state } = useDemo()
  const [picked, setPicked] = useState('')

  const availableClassIds = (() => {
    const scoped = classIds?.length ? classIds : undefined
    const source = state.timetable.filter(
      (slot) => (!scoped || scoped.includes(slot.classId)) && (!teacherId || slot.teacherId === teacherId),
    )
    const derived = Array.from(new Set(source.map((slot) => slot.classId)))
    if (derived.length) return derived
    return scoped ?? state.classes.map((cls) => cls.id)
  })()

  const activeClassId = availableClassIds.includes(picked) ? picked : (availableClassIds[0] ?? '')
  const classSlots = state.timetable.filter((slot) => slot.classId === activeClassId)
  const slots = classSlots.filter((slot) => !teacherId || slot.teacherId === teacherId)
  const todayName = dayOfWeek(todayISO())

  const periods = Array.from({ length: PERIOD_COUNT }, (_, index) => {
    const sample = classSlots.find((slot) => slot.period === index + 1)
    return { period: index + 1, start: sample?.startTime ?? '', end: sample?.endTime ?? '' }
  })

  const colourFor = (() => {
    const map = new Map<string, string>()
    for (const slot of classSlots) {
      if (!map.has(slot.subjectId)) {
        map.set(slot.subjectId, CHART_COLORS[map.size % CHART_COLORS.length])
      }
    }
    return (subjectId: string) => map.get(subjectId) ?? CHART_COLORS[0]
  })()

  const legend = Array.from(new Set(classSlots.map((slot) => slot.subjectId))).map((subjectId) => {
    const assignment = state.subjectAssignments.find(
      (row) => row.classId === activeClassId && row.subjectId === subjectId,
    )
    const fallback = classSlots.find((slot) => slot.subjectId === subjectId)?.teacherId
    return {
      subjectId,
      colour: colourFor(subjectId),
      subject: getSubject(state, subjectId),
      teacher: getTeacher(state, assignment?.teacherId ?? fallback),
    }
  })

  const slotAt = (day: string, period: number) => slots.find((slot) => slot.day === day && slot.period === period)

  const classOptions = availableClassIds.map((id) => ({ value: id, label: classCode(state, id) }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">Weekly timetable</h2>
            <DemoTag />
            {teacherId && <Badge tone="brand">Teaching slots only</Badge>}
          </div>
          <p className="mt-0.5 text-[13px] text-ink2">
            {activeClassId ? classNameOf(state, activeClassId) : 'No class available'} · six periods, Monday to Saturday
          </p>
        </div>
        {showClassPicker && classOptions.length > 1 && (
          <Field label="Class" className="min-w-[220px]">
            <Select
              selectSize="sm"
              value={activeClassId}
              onChange={(event) => setPicked(event.target.value)}
              options={classOptions}
            />
          </Field>
        )}
      </div>

      {slots.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No teaching slots"
          description="This class has no timetable entries for the current demonstration dataset, or the selected teacher has no slots here."
        />
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-panel shadow-card">
          <table className="w-full border-collapse text-left" style={{ minWidth: '880px' }}>
            <thead>
              <tr>
                <th className="border-b border-line bg-muted/70 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink3">
                  Period
                </th>
                {WEEK_DAYS.map((day) => {
                  const isToday = dayHighlight && day === todayName
                  return (
                    <th
                      key={day}
                      className={cn(
                        'border-b border-l border-line px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider',
                        isToday ? 'bg-brand-soft text-brand-ink' : 'bg-muted/70 text-ink3',
                      )}
                    >
                      {day}
                      {isToday && <span className="ml-1.5 normal-case tracking-normal opacity-80">today</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {periods.map((row) => (
                <tr key={row.period}>
                  <td className="border-b border-line bg-muted/50 px-3 py-2 align-top">
                    <p className="text-[13px] font-semibold text-ink">Period {row.period}</p>
                    <p className="text-[11px] tabular-nums text-ink3">
                      {row.start && row.end ? `${row.start}–${row.end}` : '—'}
                    </p>
                  </td>
                  {WEEK_DAYS.map((day) => {
                    const slot = slotAt(day, row.period)
                    const subject = slot ? getSubject(state, slot.subjectId) : undefined
                    const teacher = slot ? getTeacher(state, slot.teacherId) : undefined
                    return (
                      <td key={day} className="border-b border-l border-line px-2.5 py-2 align-top">
                        {slot ? (
                          <div
                            className="flex min-h-[62px] flex-col gap-0.5 border-l-2 pl-2"
                            style={{ borderLeftColor: colourFor(slot.subjectId) }}
                          >
                            <p className="text-[13px] font-medium leading-4 text-ink">
                              {subject?.shortName ?? subject?.name ?? 'Subject'}
                            </p>
                            <p className="text-[11px] leading-4 text-ink2">{teacher?.name ?? 'Faculty'}</p>
                            <p className="text-[10px] leading-4 text-ink3">{slot.room}</p>
                          </div>
                        ) : (
                          <div className="flex min-h-[62px] items-center justify-center text-[11px] text-ink3">
                            Free
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card>
        <CardBody className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink3">
              <CalendarDays className="h-3.5 w-3.5" />
              Subjects &amp; lead teachers
            </p>
            <p className="text-[11px] text-ink3">{legend.length} subjects scheduled</p>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2.5">
            {legend.map((row) => (
              <li key={row.subjectId} className="flex items-center gap-2 text-[12px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.colour }} />
                <span className="font-medium text-ink">{row.subject?.shortName ?? row.subject?.name ?? 'Subject'}</span>
                <span className="text-ink3">{row.teacher?.name ?? 'Lead teacher not allocated'}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

export default TimetableModule
