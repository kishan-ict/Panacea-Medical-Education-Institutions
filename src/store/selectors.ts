import type {
  ClassRecord,
  DemoState,
  Exam,
  EventRecord,
  FeedbackRecord,
  Mark,
  Notice,
  Portal,
  Receipt,
  Role,
  Student,
  Subject,
  Teacher,
} from '@/types'
import { PROGRAMMES, DEPARTMENTS } from '@/data/constants/institution'

/* ================================================================== *
 * Selectors — every portal reads its figures through these functions
 * so no two dashboards can disagree.
 * ================================================================== */

/* ---------------------------- lookups ---------------------------- */

export const byId = <T extends { id: string }>(rows: T[], id: string | null | undefined): T | undefined =>
  id ? rows.find((row) => row.id === id) : undefined

export function getClass(state: DemoState, id: string): ClassRecord | undefined {
  return byId(state.classes, id)
}

export function getStudent(state: DemoState, id: string): Student | undefined {
  return byId(state.students, id)
}

export function getTeacher(state: DemoState, id: string | null | undefined): Teacher | undefined {
  return byId(state.teachers, id)
}

export function getSubject(state: DemoState, id: string): Subject | undefined {
  return byId(state.subjects, id)
}

export function className(state: DemoState, id: string): string {
  return getClass(state, id)?.name ?? 'Unassigned class'
}

export function classCode(state: DemoState, id: string): string {
  return getClass(state, id)?.code ?? '—'
}

export function subjectName(state: DemoState, id: string): string {
  return getSubject(state, id)?.name ?? '—'
}

export function studentsOfClass(state: DemoState, classId: string): Student[] {
  return state.students.filter((s) => s.classId === classId)
}

export function subjectsOfClass(state: DemoState, classId: string): Subject[] {
  const cls = getClass(state, classId)
  if (!cls) return []
  return state.subjects.filter(
    (s) => s.programCodes.includes(cls.programCode) && s.years.includes(cls.year),
  )
}

export function classTeacher(state: DemoState, classId: string): Teacher | undefined {
  const cls = getClass(state, classId)
  return getTeacher(state, cls?.classTeacherId)
}

export function programName(code: string): string {
  return PROGRAMMES.find((p) => p.code === code)?.short ?? code
}

/* --------------------------- attendance --------------------------- */

export interface AttendanceFilter {
  classIds?: string[]
  studentId?: string
  subjectId?: string
  from?: string
  to?: string
}

export interface Tally {
  present: number
  absent: number
  late: number
  total: number
  pct: number
}

export function filterAttendance(state: DemoState, filter: AttendanceFilter): typeof state.attendance {
  return attendanceFor(state, filter)
}

function tallyOf(
  sessions: DemoState['attendance'],
  options: { studentId?: string; classId?: string } = {},
): Tally {
  let present = 0
  let absent = 0
  let late = 0
  for (const session of sessions) {
    if (options.studentId) {
      const status = session.records[options.studentId]
      if (!status) continue
      if (status === 'present') present += 1
      else if (status === 'absent') absent += 1
      else late += 1
      continue
    }
    const statuses = Object.values(session.records)
    for (const status of statuses) {
      if (status === 'present') present += 1
      else if (status === 'absent') absent += 1
      else late += 1
    }
  }
  const total = present + absent + late
  return { present, absent, late, total, pct: total ? Number((((present + late) / total) * 100).toFixed(1)) : 0 }
}

export function attendanceFor(state: DemoState, filter: AttendanceFilter): DemoState['attendance'] {
  return state.attendance.filter((session) => {
    if (filter.classIds && !filter.classIds.includes(session.classId)) return false
    if (filter.subjectId && session.subjectId !== filter.subjectId) return false
    if (filter.from && session.date < filter.from) return false
    if (filter.to && session.date > filter.to) return false
    if (filter.studentId && !session.records[filter.studentId]) return false
    return true
  })
}

export function studentAttendance(state: DemoState, studentId: string, filter: AttendanceFilter = {}): Tally {
  const sessions = attendanceFor(state, { ...filter, studentId })
  return tallyOf(sessions, { studentId })
}

export function classAttendance(state: DemoState, classId: string, filter: AttendanceFilter = {}): Tally {
  const sessions = attendanceFor(state, { ...filter, classIds: [classId] })
  return tallyOf(sessions)
}

export function overallAttendance(state: DemoState, filter: AttendanceFilter = {}): Tally {
  const sessions = attendanceFor(state, filter)
  return tallyOf(sessions)
}

export function studentSubjectAttendance(
  state: DemoState,
  studentId: string,
): { subject: Subject; tally: Tally }[] {
  const subjectIds = Array.from(new Set(state.attendance.filter((s) => s.records[studentId]).map((s) => s.subjectId)))
  return subjectIds
    .map((subjectId) => ({
      subject: getSubject(state, subjectId),
      tally: studentAttendance(state, studentId, { subjectId }),
    }))
    .filter((row): row is { subject: Subject; tally: Tally } => Boolean(row.subject))
    .sort((a, b) => b.tally.pct - a.tally.pct)
}

export function classAttendanceSeries(state: DemoState): { id: string; name: string; code: string; pct: number }[] {
  return state.classes.map((cls) => ({
    id: cls.id,
    name: cls.name.replace(' — Section', ''),
    code: cls.code,
    pct: classAttendance(state, cls.id).pct,
  }))
}

export function attendanceTrend(
  state: DemoState,
  options: { classIds?: string[]; studentId?: string; weeks?: number } = {},
): { label: string; pct: number; present: number; absent: number; late: number }[] {
  const weeks = options.weeks ?? 8
  const sessions = attendanceFor(state, {
    classIds: options.classIds,
    studentId: options.studentId,
  })
  const buckets = new Map<string, typeof sessions>()
  const now = new Date()
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const end = new Date(now)
    end.setDate(end.getDate() - w * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    buckets.set(`${start.toISOString().slice(0, 10)}|${end.toISOString().slice(0, 10)}`, [])
  }
  for (const session of sessions) {
    for (const key of buckets.keys()) {
      const [start, end] = key.split('|')
      if (session.date >= start && session.date <= end) {
        buckets.get(key)!.push(session)
        break
      }
    }
  }
  return Array.from(buckets.entries()).map(([key, rows]) => {
    const [start] = key.split('|')
    const tally = options.studentId ? tallyOf(rows, { studentId: options.studentId }) : tallyOf(rows)
    const label = new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    return { label, pct: tally.pct, present: tally.present, absent: tally.absent, late: tally.late }
  })
}

export function monthlyAttendance(
  state: DemoState,
  studentId?: string,
  classIds?: string[],
): { month: string; pct: number; present: number; total: number }[] {
  const sessions = attendanceFor(state, { studentId, classIds })
  const groups = new Map<string, typeof sessions>()
  for (const session of sessions) {
    const key = session.date.slice(0, 7)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(session)
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => {
      const tally = studentId ? tallyOf(rows, { studentId }) : tallyOf(rows)
      const label = new Date(`${key}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      return { month: label, pct: tally.pct, present: tally.present, total: tally.total }
    })
}

/** Per-day attendance rows for the student calendar. */
export function studentDayHistory(
  state: DemoState,
  studentId: string,
): { date: string; status: 'present' | 'absent' | 'late' | null; subject: string }[] {
  return state.attendance
    .filter((s) => s.records[studentId])
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => ({
      date: session.date,
      status: session.records[studentId] ?? null,
      subject: subjectName(state, session.subjectId),
    }))
}

/* ----------------------------- exams ------------------------------ */

export function publishedExams(state: DemoState): Exam[] {
  return state.exams.filter((e) => e.published)
}

export function upcomingExams(state: DemoState): Exam[] {
  const today = new Date().toISOString().slice(0, 10)
  return state.exams.filter((e) => e.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function marksForStudent(state: DemoState, studentId: string, opts: { publishedOnly?: boolean } = {}): Mark[] {
  return state.marks.filter(
    (m) => m.studentId === studentId && (!opts.publishedOnly || m.status === 'published'),
  )
}

export interface StudentResultRow {
  exam: Exam
  subject: Subject | undefined
  marks: number
  maxMarks: number
}

export function studentResults(state: DemoState, studentId: string, publishedOnly = true): StudentResultRow[] {
  return marksForStudent(state, studentId, { publishedOnly })
    .map((mark) => ({
      exam: state.exams.find((e) => e.id === mark.examId),
      subject: getSubject(state, mark.subjectId),
      marks: mark.marks,
      maxMarks: mark.maxMarks,
    }))
    .filter((row): row is StudentResultRow & { exam: Exam } => Boolean(row.exam))
    .sort((a, b) => (a.exam.startDate < b.exam.startDate ? 1 : -1))
}

export function resultSummary(
  state: DemoState,
  studentId: string,
  examId: string,
): { obtained: number; total: number; percentage: number; grade: string; subjects: number } {
  const rows = state.marks.filter((m) => m.studentId === studentId && m.examId === examId && m.status === 'published')
  const obtained = rows.reduce((sum, r) => sum + r.marks, 0)
  const total = rows.reduce((sum, r) => sum + r.maxMarks, 0)
  const percentage = total ? Number(((obtained / total) * 100).toFixed(1)) : 0
  return { obtained, total, percentage, grade: gradeFor(percentage), subjects: rows.length }
}

export function gradeFor(pct: number): string {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

export function examAverage(
  state: DemoState,
  examId: string,
  classIds?: string[],
): { percentage: number; records: number; appeared: number } {
  const rows = state.marks.filter(
    (m) => m.examId === examId && m.status === 'published' && (!classIds || classIds.includes(m.classId)),
  )
  const obtained = rows.reduce((s, r) => s + r.marks, 0)
  const total = rows.reduce((s, r) => s + r.maxMarks, 0)
  return {
    percentage: total ? Number(((obtained / total) * 100).toFixed(1)) : 0,
    records: rows.length,
    appeared: new Set(rows.map((r) => r.studentId)).size,
  }
}

export function examClassSeries(state: DemoState, examId: string): { name: string; pct: number }[] {
  return state.classes
    .map((cls) => ({ name: cls.code, pct: examAverage(state, examId, [cls.id]).percentage }))
    .filter((row) => row.pct > 0)
}

export function subjectPerformance(state: DemoState, examId: string, classIds?: string[]): { name: string; pct: number }[] {
  const subjectIds = Array.from(
    new Set(
      state.marks
        .filter((m) => m.examId === examId && (!classIds || classIds.includes(m.classId)))
        .map((m) => m.subjectId),
    ),
  )
  return subjectIds
    .map((subjectId) => {
      const rows = state.marks.filter(
        (m) => m.examId === examId && m.subjectId === subjectId && (!classIds || classIds.includes(m.classId)),
      )
      const obtained = rows.reduce((s, r) => s + r.marks, 0)
      const total = rows.reduce((s, r) => s + r.maxMarks, 0)
      return {
        name: getSubject(state, subjectId)?.shortName ?? 'Subject',
        pct: total ? Number(((obtained / total) * 100).toFixed(1)) : 0,
      }
    })
    .filter((row) => row.pct > 0)
    .sort((a, b) => b.pct - a.pct)
}

export function topPerformers(state: DemoState, examId: string, limit = 5) {
  const rows = state.students
    .map((student) => {
      const marks = state.marks.filter((m) => m.studentId === student.id && m.examId === examId && m.status === 'published')
      const obtained = marks.reduce((s, r) => s + r.marks, 0)
      const total = marks.reduce((s, r) => s + r.maxMarks, 0)
      return {
        student,
        percentage: total ? Number(((obtained / total) * 100).toFixed(1)) : 0,
        subjects: marks.length,
      }
    })
    .filter((row) => row.subjects > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit)
  return rows
}

/** Slots not yet entered for the most recent examination. */
export function pendingMarks(state: DemoState, teacherId?: string): number {
  const exam = [...state.exams].filter((e) => !e.published).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  if (!exam) return 0
  const assignments = state.subjectAssignments.filter((a) => !teacherId || a.teacherId === teacherId)
  let pending = 0
  const seen = new Set<string>()
  for (const assignment of assignments) {
    const key = `${assignment.classId}|${assignment.subjectId}`
    if (seen.has(key)) continue
    seen.add(key)
    const roster = studentsOfClass(state, assignment.classId)
    for (const student of roster) {
      const exists = state.marks.some(
        (m) =>
          m.examId === exam.id &&
          m.classId === assignment.classId &&
          m.subjectId === assignment.subjectId &&
          m.studentId === student.id,
      )
      if (!exists) pending += 1
    }
  }
  return pending
}

export function draftMarks(state: DemoState, teacherId?: string): number {
  const assignments = state.subjectAssignments.filter((a) => !teacherId || a.teacherId === teacherId)
  const classIds = new Set(assignments.map((a) => a.classId))
  return state.marks.filter(
    (m) =>
      m.status === 'draft' &&
      classIds.has(m.classId) &&
      (!teacherId || assignments.some((a) => a.classId === m.classId && a.subjectId === m.subjectId)),
  ).length
}

/* ----------------------------- finance ---------------------------- */

export interface FeeSummary {
  expected: number
  collected: number
  outstanding: number
  records: number
  pendingRecords: number
  todayCollected: number
}

export function feeSummary(state: DemoState): FeeSummary {
  const expected = state.feeRecords.reduce((s, f) => s + f.amount, 0)
  const collected = state.feeRecords.reduce((s, f) => s + f.paidAmount, 0)
  const today = new Date().toISOString().slice(0, 10)
  const todayCollected = state.receipts.filter((r) => r.paidAt === today).reduce((s, r) => s + r.amount, 0)
  return {
    expected,
    collected,
    outstanding: Math.max(0, expected - collected),
    records: state.feeRecords.length,
    pendingRecords: state.feeRecords.filter((f) => f.status !== 'paid').length,
    todayCollected,
  }
}

export function feeByCategory(state: DemoState): { category: string; collected: number; expected: number }[] {
  const map = new Map<string, { collected: number; expected: number }>()
  for (const fee of state.feeRecords) {
    const row = map.get(fee.category) ?? { collected: 0, expected: 0 }
    row.collected += fee.paidAmount
    row.expected += fee.amount
    map.set(fee.category, row)
  }
  return Array.from(map.entries()).map(([category, row]) => ({ category, ...row }))
}

export function feeTrend(state: DemoState): { month: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const receipt of state.receipts) {
    const key = receipt.paidAt.slice(0, 7)
    map.set(key, (map.get(key) ?? 0) + receipt.amount)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => ({
      month: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      amount,
    }))
}

export function studentFees(state: DemoState, studentId: string) {
  return state.feeRecords.filter((f) => f.studentId === studentId)
}

export function studentReceipts(state: DemoState, studentId: string): Receipt[] {
  return state.receipts.filter((r) => r.studentId === studentId)
}

export function todayReceipts(state: DemoState): Receipt[] {
  const today = new Date().toISOString().slice(0, 10)
  return state.receipts.filter((r) => r.paidAt === today)
}

/* ------------------------------ events ---------------------------- */

export const EVENT_STATUS_LABEL: Record<EventRecord['status'], string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}

export function eventCounts(state: DemoState): Record<EventRecord['status'], number> {
  const counts: Record<EventRecord['status'], number> = { draft: 0, pending: 0, approved: 0, rejected: 0, completed: 0 }
  state.events.forEach((e) => (counts[e.status] += 1))
  return counts
}

export function registrationsFor(state: DemoState, eventId: string) {
  return state.registrations.filter((r) => r.eventId === eventId)
}

export type EventVisibility = 'directory' | 'mine' | 'review'

/**
 * Participants are hidden from the creator while an event is pending —
 * the creator sees only a count until institutional approval.
 */
export function canSeeParticipants(
  event: EventRecord,
  viewer: { role: Role; linkedId: string | null },
): boolean {
  if (viewer.role === 'chairman' || viewer.role === 'director') return true
  if (viewer.role === 'principal' || viewer.role === 'classTeacher') return true
  if (event.status === 'approved' || event.status === 'completed') return true
  return false
}

export function visibleEvents(
  state: DemoState,
  viewer: { role: Role; linkedId: string | null },
): EventRecord[] {
  return state.events
    .filter((event) => {
      if (event.status === 'approved' || event.status === 'completed') return true
      if (viewer.linkedId && event.createdById === viewer.linkedId) return true
      if (event.status === 'pending') {
        return viewer.role === 'classTeacher' || viewer.role === 'principal' || viewer.role === 'chairman' || viewer.role === 'director'
      }
      // drafts and rejections stay private to their creator
      return false
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Official public directory — only institutionally approved events. */
export function publicEvents(state: DemoState): EventRecord[] {
  return state.events
    .filter((e) => e.status === 'approved' || e.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function pendingEventApprovals(state: DemoState, classIds?: string[]): EventRecord[] {
  return state.events.filter(
    (e) => e.status === 'pending' && (!classIds || classIds.includes(classOfCreator(state, e))),
  )
}

function classOfCreator(state: DemoState, event: EventRecord): string {
  const student = state.students.find((s) => s.id === event.createdById)
  return student?.classId ?? ''
}

export function creatorClassIds(state: DemoState, event: EventRecord): string[] {
  const student = state.students.find((s) => s.id === event.createdById)
  if (student) return [student.classId]
  const teacher = state.teachers.find((t) => t.id === event.createdById)
  if (teacher?.classTeacherOfClassId) return [teacher.classTeacherOfClassId]
  return []
}

/* ----------------------------- notices ---------------------------- */

export function noticesFor(
  state: DemoState,
  viewer: { role: Role; programCode?: string; classId?: string },
): Notice[] {
  return state.notices
    .filter((notice) => {
      if (viewer.programCode && notice.programCodes.length && !notice.programCodes.includes(viewer.programCode as never)) {
        return false
      }
      if (viewer.classId && notice.classIds.length && !notice.classIds.includes(viewer.classId)) return false
      return true
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.publishedAt.localeCompare(a.publishedAt)
    })
}

export function recentNoticeCount(state: DemoState, days = 7): number {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString()
  return state.notices.filter((n) => n.publishedAt >= cutoff).length
}

/* ---------------------------- academics --------------------------- */

export function courseDistribution(state: DemoState): { name: string; value: number; code: string }[] {
  return PROGRAMMES.map((program) => ({
    name: program.short,
    code: program.code,
    value: state.students.filter((s) => s.programCode === program.code).length,
  }))
}

export function classRosterSummary(state: DemoState) {
  return state.classes.map((cls) => ({
    cls,
    students: studentsOfClass(state, cls.id).length,
    teacher: classTeacher(state, cls.id),
  }))
}

export function subjectAllocationRows(state: DemoState) {
  return state.subjectAssignments.map((assignment) => ({
    ...assignment,
    teacher: getTeacher(state, assignment.teacherId),
    cls: getClass(state, assignment.classId),
    subject: getSubject(state, assignment.subjectId),
  }))
}

export function unassignedClasses(state: DemoState): ClassRecord[] {
  return state.classes.filter((c) => !c.classTeacherId)
}

/* ------------------------ teacher work context -------------------- */

export function classTeacherOf(state: DemoState, teacherId: string): ClassRecord | undefined {
  const teacher = getTeacher(state, teacherId)
  if (!teacher?.classTeacherOfClassId) return undefined
  return getClass(state, teacher.classTeacherOfClassId)
}

export interface TeacherSubjectRow {
  assignmentId: string
  cls: ClassRecord
  subject: Subject
  isLead: boolean
}

export function subjectsForTeacher(state: DemoState, teacherId: string): TeacherSubjectRow[] {
  const rows = state.subjectAssignments
    .filter((a) => a.teacherId === teacherId)
    .map((assignment) => {
      const cls = getClass(state, assignment.classId)
      const subject = getSubject(state, assignment.subjectId)
      if (!cls || !subject) return null
      return {
        assignmentId: assignment.id,
        cls,
        subject,
        isLead: state.timetable.some(
          (slot) => slot.classId === cls.id && slot.subjectId === subject.id && slot.teacherId === teacherId,
        ),
      }
    })
    .filter((row): row is TeacherSubjectRow => Boolean(row))
  return rows.sort((a, b) => a.cls.code.localeCompare(b.cls.code))
}

export function classesForTeacher(state: DemoState, teacherId: string): ClassRecord[] {
  const ids = new Set<string>()
  const lead = classTeacherOf(state, teacherId)
  if (lead) ids.add(lead.id)
  subjectsForTeacher(state, teacherId).forEach((row) => ids.add(row.cls.id))
  return state.classes.filter((c) => ids.has(c.id))
}

export function isTeacherAssigned(
  state: DemoState,
  teacherId: string,
  classId: string,
  subjectId?: string,
): boolean {
  const lead = classTeacherOf(state, teacherId)
  if (lead?.id === classId && !subjectId) return true
  return state.subjectAssignments.some(
    (a) =>
      a.teacherId === teacherId &&
      a.classId === classId &&
      (subjectId ? a.subjectId === subjectId : true),
  )
}

/* --------------------------- institution --------------------------- */

export function institutionalStats(state: DemoState) {
  const attendance = overallAttendance(state)
  const latestPublished = [...state.exams].filter((e) => e.published).sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  const exam = latestPublished ? examAverage(state, latestPublished.id) : null
  const fees = feeSummary(state)
  return {
    students: state.students.filter((s) => s.status === 'active').length,
    teachers: state.teachers.filter((t) => t.status === 'active').length,
    classes: state.classes.length,
    courses: PROGRAMMES.length,
    departments: DEPARTMENTS.length,
    attendancePct: attendance.pct,
    examPct: exam?.percentage ?? 0,
    examName: latestPublished?.shortName ?? '—',
    collected: fees.collected,
    expected: fees.expected,
    outstanding: fees.outstanding,
    pendingApprovals: state.events.filter((e) => e.status === 'pending').length,
    activeEvents: state.events.filter((e) => e.status === 'approved').length,
    openTickets: state.tickets.filter((t) => t.status !== 'resolved').length,
    receipts: state.receipts.length,
  }
}

export function departmentFaculty(state: DemoState): { department: string; head: string; faculty: number }[] {
  return DEPARTMENTS.map((dept) => ({
    department: dept.name,
    head: dept.head,
    faculty: state.teachers.filter((t) => t.department === dept.name).length,
  })).concat(
    Array.from(new Set(state.teachers.map((t) => t.department)))
      .filter((name) => !DEPARTMENTS.some((d) => d.name === name))
      .map((name) => ({
        department: name,
        head: '—',
        faculty: state.teachers.filter((t) => t.department === name).length,
      })),
  )
}

/* ------------------------- notices / support ---------------------- */

export function openTickets(state: DemoState): number {
  return state.tickets.filter((t) => t.status !== 'resolved').length
}

export function notificationsForPortal(state: DemoState, portal: Portal) {
  return state.notifications.filter((n) => n.audience.includes(portal))
}

export function unreadForPortal(state: DemoState, portal: Portal): number {
  return notificationsForPortal(state, portal).filter((n) => !n.read).length
}

export function feedbackStats(feedback: FeedbackRecord[]): { average: number; count: number } {
  if (!feedback.length) return { average: 0, count: 0 }
  const average = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length
  return { average: Number(average.toFixed(1)), count: feedback.length }
}

/* ------------------------------ library --------------------------- */

export function overdueBorrows(state: DemoState) {
  const today = new Date().toISOString().slice(0, 10)
  return state.borrows.filter((b) => !b.returnedAt && b.dueAt < today)
}

export function activeBorrows(state: DemoState, studentId?: string) {
  return state.borrows.filter((b) => !b.returnedAt && (!studentId || b.studentId === studentId))
}
