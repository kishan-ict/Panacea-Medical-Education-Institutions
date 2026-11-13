import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { produce } from 'immer'
import type {
  AppNotification,
  AuditEntry,
  AttendanceSession,
  DemoState,
  EContentItem,
  EventRecord,
  EventRegistration,
  FeedbackRecord,
  Notice,
  Portal,
  Receipt,
  RegistrationQuestion,
  SupportTicket,
  SubjectAssignment,
  Teacher,
} from '@/types'
import { createSeedState } from '@/data/mock/seed'
import { nowISO, todayISO } from '@/utils/format'
import { uid } from '@/utils/cn'

const STORAGE_KEY = 'pmei.demo.state.v1'
export const STATE_VERSION = 1

function loadState(): DemoState {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed && parsed.version === STATE_VERSION && Array.isArray(parsed.students) && parsed.students.length) {
        return parsed
      }
    }
  } catch {
    /* corrupted local demo state → fall back to the seed */
  }
  return createSeedState()
}

export type ActionResult = { ok: boolean; message: string }

export interface CreateEventInput {
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
  programCode: EventRecord['programCode']
  questions: RegistrationQuestion[]
  coverTone: EventRecord['coverTone']
}

export interface CreateReceiptInput {
  studentId: string
  feeCategory: string
  amount: number
  paidAt: string
  method: Receipt['method']
  reference: string
  remarks: string
  attachmentName: string | null
  createdBy: string
}

export interface DemoActions {
  resetDemo: () => void

  saveTeacher: (teacher: Teacher) => ActionResult
  setTeacherStatus: (id: string, status: Teacher['status']) => void
  assignClassTeacher: (classId: string, teacherId: string) => ActionResult
  removeClassTeacher: (classId: string) => void
  addSubjectAssignment: (input: Omit<SubjectAssignment, 'id'>) => ActionResult
  removeSubjectAssignment: (id: string) => void

  submitAttendance: (
    input: {
      date: string
      classId: string
      subjectId: string
      teacherId: string
      period: number
      records: AttendanceSession['records']
      markedBy: string
    },
    options?: { replace?: boolean },
  ) => ActionResult

  saveMarks: (
    rows: {
      examId: string
      classId: string
      subjectId: string
      studentId: string
      marks: number
      maxMarks: number
      status: 'draft' | 'published'
    }[],
  ) => ActionResult
  publishExam: (examId: string) => void

  addNotice: (notice: Omit<Notice, 'id'>) => void
  toggleNoticePin: (id: string) => void
  removeNotice: (id: string) => void

  addEContent: (item: Omit<EContentItem, 'id' | 'downloads'>) => ActionResult
  updateEContent: (id: string, patch: Partial<EmitEContent>) => void
  removeEContent: (id: string) => void
  bumpDownload: (id: string) => void

  createEvent: (creator: { id: string; name: string; role: EventRecord['createdByRole'] }, input: CreateEventInput, submit: boolean) => string
  updateEvent: (id: string, patch: Partial<EventRecord>) => void
  submitEventForApproval: (id: string) => ActionResult
  reviewEvent: (id: string, decision: 'approved' | 'rejected', note: string, reviewer: string) => ActionResult
  removeEvent: (id: string) => void
  registerForEvent: (
    eventId: string,
    registrant: { name: string; email: string; phone: string; answers: EventRegistration['answers'] },
  ) => ActionResult

  createReceipt: (input: CreateReceiptInput) => { ok: boolean; message: string; receipt: Receipt | null }
  settleFee: (feeId: string, amount: number) => void

  createTicket: (
    input: Omit<SupportTicket, 'id' | 'code' | 'createdAt' | 'status' | 'replies'>,
  ) => { ok: boolean; message: string; ticket: SupportTicket | null }
  updateTicketStatus: (id: string, status: SupportTicket['status'], reply?: { author: string; message: string }) => void
  addTicketReply: (
    id: string,
    reply: { author: string; authorRole: string; message: string },
  ) => void
  addFeedback: (input: Omit<FeedbackRecord, 'id' | 'at'>) => void
  addAudit: (entry: Omit<AuditEntry, 'id' | 'at'>) => void
  markNotificationsRead: (portal: Portal) => void
  notify: (input: Omit<AppNotification, 'id' | 'at' | 'read'>) => void
}

type EmitEContent = Omit<EContentItem, 'id'>

interface StoreValue {
  state: DemoState
  actions: DemoActions
}

const DemoStoreContext = createContext<StoreValue | null>(null)

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage quota exceeded — the demo continues in memory */
    }
  }, [state])

  const mutate = useCallback((recipe: (draft: DemoState) => void) => {
    setState((prev) => produce(prev, recipe))
  }, [])

  const actions = useMemo<DemoActions>(() => {
    const ok = (message: string): ActionResult => ({ ok: true, message })
    const fail = (message: string): ActionResult => ({ ok: false, message })

    return {
      resetDemo() {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        setState(createSeedState())
      },

      /* ------------------------------ staff ------------------------------ */
      saveTeacher(teacher) {
        const exists = state.teachers.some((t) => t.id === teacher.id)
        const duplicateId = state.teachers.some(
          (t) => t.id !== teacher.id && t.employeeId.toLowerCase() === teacher.employeeId.toLowerCase(),
        )
        if (duplicateId) return fail('That employee ID is already in use by another teacher record.')
        mutate((draft) => {
          if (exists) {
            const index = draft.teachers.findIndex((t) => t.id === teacher.id)
            draft.teachers[index] = teacher
          } else {
            draft.teachers.push(teacher)
          }
        })
        return ok(exists ? 'Teacher record updated.' : 'Teacher record created.')
      },

      setTeacherStatus(id, status) {
        mutate((draft) => {
          const teacher = draft.teachers.find((t) => t.id === id)
          if (!teacher) return
          teacher.status = status
          if (status === 'inactive' && teacher.classTeacherOfClassId) {
            const cls = draft.classes.find((c) => c.id === teacher.classTeacherOfClassId)
            if (cls) cls.classTeacherId = null
            teacher.classTeacherOfClassId = null
          }
        })
      },

      assignClassTeacher(classId, teacherId) {
        const cls = state.classes.find((c) => c.id === classId)
        const teacher = state.teachers.find((t) => t.id === teacherId)
        if (!cls || !teacher) return fail('Class or teacher could not be found in the demo dataset.')
        if (teacher.status !== 'active') return fail('Inactive teachers cannot be assigned as class teacher.')
        if (cls.classTeacherId) return fail(`${cls.name} already has a class teacher. Remove that assignment first.`)
        const otherClass = state.classes.find((c) => c.classTeacherId === teacherId)
        if (otherClass) return fail(`${teacher.name} is already the class teacher of ${otherClass.name}.`)
        mutate((draft) => {
          const target = draft.classes.find((c) => c.id === classId)
          const staff = draft.teachers.find((t) => t.id === teacherId)
          if (!target || !staff) return
          target.classTeacherId = teacherId
          staff.classTeacherOfClassId = classId
        })
        return ok(`${teacher.name} assigned as class teacher of ${cls.name}.`)
      },

      removeClassTeacher(classId) {
        mutate((draft) => {
          const cls = draft.classes.find((c) => c.id === classId)
          if (!cls) return
          const teacher = draft.teachers.find((t) => t.id === cls.classTeacherId)
          if (teacher) teacher.classTeacherOfClassId = null
          cls.classTeacherId = null
        })
      },

      addSubjectAssignment(input) {
        const duplicate = state.subjectAssignments.some(
          (a) => a.classId === input.classId && a.subjectId === input.subjectId && a.teacherId === input.teacherId,
        )
        if (duplicate) return fail('That teacher is already allocated to this subject and class.')
        const teacher = state.teachers.find((t) => t.id === input.teacherId)
        if (!teacher) return fail('Selected teacher was not found.')
        if (teacher.status !== 'active') return fail('Inactive teachers cannot receive subject allocations.')
        mutate((draft) => {
          draft.subjectAssignments.push({ ...input, id: uid('sa') })
        })
        return ok('Subject allocation saved.')
      },

      removeSubjectAssignment(id) {
        mutate((draft) => {
          draft.subjectAssignments = draft.subjectAssignments.filter((a) => a.id !== id)
        })
      },

      /* ---------------------------- attendance --------------------------- */
      submitAttendance(input, options) {
        const exists = state.attendance.some(
          (s) =>
            s.classId === input.classId &&
            s.date === input.date &&
            s.period === input.period,
        )
        if (exists && !options?.replace) {
          return fail(
            'Attendance for this class, date and period has already been submitted. Edit the existing session instead of submitting twice.',
          )
        }
        mutate((draft) => {
          if (exists) {
            const index = draft.attendance.findIndex(
              (s) => s.classId === input.classId && s.date === input.date && s.period === input.period,
            )
            draft.attendance[index] = { ...input, id: draft.attendance[index].id, submittedAt: nowISO() }
          } else {
            draft.attendance.push({ ...input, id: uid('att'), submittedAt: nowISO() })
          }
        })
        return ok('Attendance submitted for the class record.')
      },

      /* ------------------------------ marks ------------------------------ */
      saveMarks(rows) {
        if (!rows.length) return fail('No marks were provided.')
        const invalid = rows.find((r) => r.marks < 0 || r.marks > r.maxMarks)
        if (invalid) return fail(`Marks must be between 0 and ${invalid.maxMarks}.`)
        mutate((draft) => {
          for (const row of rows) {
            const existing = draft.marks.find(
              (m) =>
                m.examId === row.examId &&
                m.classId === row.classId &&
                m.subjectId === row.subjectId &&
                m.studentId === row.studentId,
            )
            if (existing) {
              existing.marks = row.marks
              existing.status = row.status
            } else {
              draft.marks.push({ ...row, id: uid('mk') })
            }
          }
        })
        const published = rows.every((r) => r.status === 'published')
        return ok(published ? 'Marks published to student records.' : 'Marks saved as draft.')
      },

      publishExam(examId) {
        mutate((draft) => {
          const exam = draft.exams.find((e) => e.id === examId)
          if (exam) exam.published = true
          draft.marks.filter((m) => m.examId === examId).forEach((m) => { m.status = 'published' })
        })
      },

      /* ----------------------------- notices ----------------------------- */
      addNotice(notice) {
        mutate((draft) => {
          draft.notices.unshift({ ...notice, id: uid('ntc') })
        })
      },
      toggleNoticePin(id) {
        mutate((draft) => {
          const notice = draft.notices.find((n) => n.id === id)
          if (notice) notice.pinned = !notice.pinned
        })
      },
      removeNotice(id) {
        mutate((draft) => {
          draft.notices = draft.notices.filter((n) => n.id !== id)
        })
      },

      /* ----------------------------- e-content --------------------------- */
      addEContent(item) {
        const duplicate = state.econtent.some(
          (e) => e.fileName.toLowerCase() === item.fileName.toLowerCase() && e.classId === item.classId,
        )
        if (duplicate) return fail('A file with that name already exists for this class.')
        mutate((draft) => {
          draft.econtent.unshift({ ...item, id: uid('ec'), downloads: 0 })
        })
        return ok('Study material published to the class.')
      },
      updateEContent(id, patch) {
        mutate((draft) => {
          const index = draft.econtent.findIndex((e) => e.id === id)
          if (index >= 0) draft.econtent[index] = { ...draft.econtent[index], ...patch }
        })
      },
      removeEContent(id) {
        mutate((draft) => {
          draft.econtent = draft.econtent.filter((e) => e.id !== id)
        })
      },
      bumpDownload(id) {
        mutate((draft) => {
          const item = draft.econtent.find((e) => e.id === id)
          if (item) item.downloads += 1
        })
      },

      /* ------------------------------ events ----------------------------- */
      createEvent(creator, input, submit) {
        const id = uid('eve')
        const slug =
          input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'event'
        mutate((draft) => {
          draft.events.unshift({
            ...input,
            id,
            status: submit ? 'pending' : 'draft',
            createdById: creator.id,
            createdByName: creator.name,
            createdByRole: creator.role,
            createdAt: nowISO(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNote: '',
            shareSlug: `${slug}-${id.slice(-4)}`,
          })
        })
        return id
      },
      updateEvent(id, patch) {
        mutate((draft) => {
          const index = draft.events.findIndex((e) => e.id === id)
          if (index >= 0) draft.events[index] = { ...draft.events[index], ...patch }
        })
      },
      submitEventForApproval(id) {
        const event = state.events.find((e) => e.id === id)
        if (!event) return fail('Event not found.')
        if (event.status !== 'draft') return fail('This event has already been submitted for review.')
        mutate((draft) => {
          const target = draft.events.find((e) => e.id === id)
          if (target) {
            target.status = 'pending'
            target.reviewedAt = null
            target.reviewedBy = null
            target.reviewNote = ''
          }
        })
        return ok('Event submitted to the class teacher for institutional approval.')
      },
      reviewEvent(id, decision, note, reviewer) {
        const event = state.events.find((e) => e.id === id)
        if (!event) return fail('Event not found.')
        if (event.status !== 'pending') return fail('Only events pending approval can be reviewed.')
        mutate((draft) => {
          const target = draft.events.find((e) => e.id === id)
          if (!target) return
          target.status = decision
          target.reviewedAt = nowISO()
          target.reviewedBy = reviewer
          target.reviewNote = note
        })
        const verb = decision === 'approved' ? 'approved' : 'rejected'
        return ok(`Event ${verb} and the creator has been notified.`)
      },
      removeEvent(id) {
        mutate((draft) => {
          draft.events = draft.events.filter((e) => e.id !== id)
          draft.registrations = draft.registrations.filter((r) => r.eventId !== id)
        })
      },
      registerForEvent(eventId, registrant) {
        const event = state.events.find((e) => e.id === eventId)
        if (!event) return fail('Event not found.')
        if (event.status === 'draft' || event.status === 'rejected')
          return fail('Registrations are closed for this event.')
        if (event.status === 'completed') return return_fail_closed()
        if (event.status === 'pending' && event.registrationDeadline < todayISO())
          return fail('The registration deadline for this event has passed.')
        const dupe = state.registrations.some(
          (r) => r.eventId === eventId && r.email.toLowerCase() === registrant.email.toLowerCase(),
        )
        if (dupe) return fail('A registration with that email address already exists for this event.')
        const count = state.registrations.filter((r) => r.eventId === eventId).length
        if (count >= event.maxParticipants) return fail('This event has reached its participant limit.')
        mutate((draft) => {
          draft.registrations.push({
            id: uid('reg'),
            eventId,
            name: registrant.name,
            email: registrant.email,
            phone: registrant.phone,
            answers: registrant.answers,
            submittedAt: nowISO(),
          })
        })
        return ok('Registration recorded. The event organiser will confirm after institutional approval.')
      },

      /* ------------------------------ finance ---------------------------- */
      createReceipt(input) {
        if (!input.studentId) return { ok: false, message: 'Select a student before creating a receipt.', receipt: null }
        if (!input.amount || input.amount <= 0)
          return { ok: false, message: 'Enter a valid amount paid.', receipt: null }
        const student = state.students.find((s) => s.id === input.studentId)
        if (!student) return { ok: false, message: 'Student record not found.', receipt: null }
        if (input.reference.trim()) {
          const dupe = state.receipts.some(
            (r) => r.reference.trim().toLowerCase() === input.reference.trim().toLowerCase(),
          )
          if (dupe)
            return {
              ok: false,
              message: 'Duplicate receipt reference — a receipt with this transaction/reference number already exists.',
              receipt: null,
            }
        }
        const seq = state.receipts.length + 1
        const receipt: Receipt = {
          id: uid('rcp'),
          receiptNo: `PMEI/26-27/RCP/${String(seq).padStart(4, '0')}`,
          studentId: input.studentId,
          feeCategory: input.feeCategory,
          amount: input.amount,
          paidAt: input.paidAt,
          method: input.method,
          reference: input.reference.trim() || `REF/${String(seq).padStart(5, '0')}`,
          remarks: input.remarks,
          attachmentName: input.attachmentName,
          createdBy: input.createdBy,
          createdAt: nowISO(),
        }
        mutate((draft) => {
          draft.receipts.unshift(receipt)
          const fee = draft.feeRecords.find(
            (f) => f.studentId === receipt.studentId && f.category === receipt.feeCategory,
          )
          if (fee) {
            fee.paidAmount = Math.min(fee.amount, fee.paidAmount + receipt.amount)
            fee.status = fee.paidAmount >= fee.amount ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'pending'
          } else {
            draft.feeRecords.push({
              id: uid('fee'),
              studentId: receipt.studentId,
              category: receipt.feeCategory,
              amount: receipt.amount,
              paidAmount: receipt.amount,
              dueDate: receipt.paidAt,
              status: 'paid',
              academicYear: '2026-27',
            })
          }
          draft.notifications.unshift({
            id: uid('ntf'),
            title: 'Payment recorded',
            body: `${receipt.receiptNo} — ${formatMoneySafe(receipt.amount)} against ${receipt.feeCategory} for ${student.name}.`,
            at: nowISO(),
            tone: 'success',
            read: false,
            audience: ['student', 'accountant'],
          })
        })
        return { ok: true, message: `Receipt ${receipt.receiptNo} generated successfully.`, receipt }
      },
      settleFee(feeId, amount) {
        mutate((draft) => {
          const fee = draft.feeRecords.find((f) => f.id === feeId)
          if (!fee) return
          fee.paidAmount = Math.min(fee.amount, fee.paidAmount + amount)
          fee.status = fee.paidAmount >= fee.amount ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'pending'
        })
      },

      /* ------------------------------ support ---------------------------- */
      createTicket(input) {
        if (!input.title.trim() || !input.description.trim())
          return { ok: false, message: 'Provide a title and description for the ticket.', ticket: null }
        const seq = 1046 + state.tickets.filter((t) => t.code.startsWith('HD-')).length
        const ticket: SupportTicket = {
          ...input,
          id: uid('tkt'),
          code: `HD-${seq}`,
          status: 'open',
          createdAt: nowISO(),
          replies: [
            {
              id: uid('rep'),
              author: 'PMEl Development Desk',
              authorRole: 'developer',
              message:
                'Ticket acknowledged by the development desk. This demonstration environment simulates developer responses — no external system has been contacted.',
              at: nowISO(),
            },
          ],
        }
        mutate((draft) => {
          draft.tickets.unshift(ticket)
        })
        return { ok: true, message: `Ticket ${ticket.code} created.`, ticket }
      },
      updateTicketStatus(id, status, reply) {
        mutate((draft) => {
          const ticket = draft.tickets.find((t) => t.id === id)
          if (!ticket) return
          ticket.status = status
          if (reply) {
            ticket.replies.push({ id: uid('rep'), author: reply.author, authorRole: 'developer', message: reply.message, at: nowISO() })
          }
        })
      },
      addTicketReply(id, reply) {
        mutate((draft) => {
          const ticket = draft.tickets.find((t) => t.id === id)
          if (!ticket) return
          ticket.replies.push({ id: uid('rep'), author: reply.author, authorRole: reply.authorRole, message: reply.message, at: nowISO() })
        })
      },
      addFeedback(input) {
        mutate((draft) => {
          draft.feedback.unshift({ ...input, id: uid('fb'), at: nowISO() })
        })
      },
      addAudit(entry) {
        mutate((draft) => {
          draft.audit.unshift({ ...entry, id: uid('aud'), at: nowISO() })
        })
      },
      markNotificationsRead(portal) {
        mutate((draft) => {
          draft.notifications.forEach((n) => {
            if (n.audience.includes(portal)) n.read = true
          })
        })
      },
      notify(input) {
        mutate((draft) => {
          draft.notifications.unshift({ ...input, id: uid('ntf'), at: nowISO(), read: false })
        })
      },
    }
  }, [state, mutate])

  const value = useMemo<StoreValue>(() => ({ state, actions }), [state, actions])

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

function return_fail_closed(): ActionResult {
  return { ok: false, message: 'This event has already concluded — registrations are closed.' }
}

function formatMoneySafe(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function useDemo(): StoreValue {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemo must be used inside <DemoStoreProvider>')
  return ctx
}

export type { Notice }
