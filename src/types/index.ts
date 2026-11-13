/**
 * PMEl Login — shared domain model.
 *
 * Every entity below belongs to the *demonstration dataset*. Nothing in this
 * file describes a live institutional record; see `data/constants/institution.ts`.
 */

export type Role =
  | 'chairman'
  | 'director'
  | 'principal'
  | 'classTeacher'
  | 'subjectTeacher'
  | 'student'
  | 'accountant'

export type Portal = 'chairman' | 'director' | 'staff' | 'student' | 'accountant'

export type ProgramCode = 'ANM' | 'GNM' | 'BSC'

export type AttendanceStatus = 'present' | 'absent' | 'late'

export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed'

export type TicketStatus = 'open' | 'in-progress' | 'resolved'

export type FeeStatus = 'paid' | 'pending' | 'partial'

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export interface DemoAccount {
  id: string
  username: string
  password: string
  role: Role
  portal: Portal
  displayName: string
  /** short role label shown in the UI */
  title: string
  /** teacher.id or student.id this demo account is bound to */
  linkedId: string | null
  accent: 'brand' | 'royal' | 'gold' | 'success'
}

export interface Program {
  code: ProgramCode
  short: string
  name: string
  level: 'Diploma' | 'Degree'
  duration: string
  seats: number
  eligibility: string
  ageLimit: string
  description: string
  entrance: string
}

export interface ClassRecord {
  id: string
  code: string
  name: string
  programCode: ProgramCode
  year: number
  section: string
  academicYear: string
  classTeacherId: string | null
  room: string
}

export interface Subject {
  id: string
  code: string
  name: string
  shortName: string
  programCodes: ProgramCode[]
  years: number[]
  credits: number
  type: 'Theory' | 'Theory + Practical' | 'Practical'
}

export interface Student {
  id: string
  admissionNo: string
  name: string
  gender: 'Female' | 'Male'
  dob: string
  programCode: ProgramCode
  academicYear: string
  classId: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianEmail: string
  phone: string
  email: string
  address: string
  bloodGroup: string
  admissionDate: string
  status: 'active' | 'inactive'
}

export interface SubjectAssignment {
  id: string
  teacherId: string
  classId: string
  subjectId: string
  academicYear: string
}

export interface Teacher {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  designation: string
  qualification: string
  joiningDate: string
  status: 'active' | 'inactive'
  classTeacherOfClassId: string | null
}

/* ------------------------------------------------------------------ */
/* Academics                                                           */
/* ------------------------------------------------------------------ */

export interface AttendanceSession {
  id: string
  date: string
  classId: string
  subjectId: string
  teacherId: string
  period: number
  records: Record<string, AttendanceStatus>
  submittedAt: string
  markedBy: string
}

export interface Exam {
  id: string
  name: string
  shortName: string
  type: 'Unit Test' | 'Mid Term' | 'Final Examination'
  academicYear: string
  startDate: string
  endDate: string
  classIds: string[]
  published: boolean
}

export interface Mark {
  id: string
  examId: string
  classId: string
  subjectId: string
  studentId: string
  marks: number
  maxMarks: number
  status: 'draft' | 'published'
}

export interface TimetableSlot {
  id: string
  classId: string
  day: string
  period: number
  startTime: string
  endTime: string
  subjectId: string
  teacherId: string
  room: string
}

export interface Notice {
  id: string
  title: string
  body: string
  category: 'Institution' | 'Course' | 'Class' | 'Examination' | 'Event' | 'Fee'
  priority: 'high' | 'normal' | 'low'
  programCodes: ProgramCode[]
  classIds: string[]
  author: string
  authorRole: string
  publishedAt: string
  pinned: boolean
}

export interface EContentItem {
  id: string
  title: string
  description: string
  subjectId: string
  classId: string
  uploadedBy: string
  uploadedAt: string
  fileName: string
  fileType: 'pdf' | 'notes'
  fileSizeKb: number
  downloads: number
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

export interface Book {
  id: string
  title: string
  author: string
  category: string
  isbn: string
  copies: number
  available: number
  shelf: string
}

export interface BorrowRecord {
  id: string
  bookId: string
  studentId: string
  borrowedAt: string
  dueAt: string
  returnedAt: string | null
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export type RegistrationQuestionType = 'text' | 'textarea' | 'select' | 'number'

export interface RegistrationQuestion {
  id: string
  label: string
  type: RegistrationQuestionType
  required: boolean
  options: string[]
}

export interface EventRegistration {
  id: string
  eventId: string
  name: string
  email: string
  phone: string
  answers: { questionId: string; value: string }[]
  submittedAt: string
}

export interface EventRecord {
  id: string
  title: string
  description: string
  category: 'Cultural' | 'Sports' | 'Academic' | 'Health Camp' | 'Club' | 'Workshop'
  date: string
  startTime: string
  endTime: string
  venue: string
  organizer: string
  organizerClub: string
  registrationDeadline: string
  maxParticipants: number
  programCode: ProgramCode | 'All'
  status: EventStatus
  createdById: string
  createdByName: string
  createdByRole: Role
  createdAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNote: string
  shareSlug: string
  questions: RegistrationQuestion[]
  /** images are simulated — colour token used by the card artwork */
  coverTone: 1 | 2 | 3 | 4
}

/* ------------------------------------------------------------------ */
/* Finance                                                             */
/* ------------------------------------------------------------------ */

export interface FeeRecord {
  id: string
  studentId: string
  category: string
  amount: number
  paidAmount: number
  dueDate: string
  status: FeeStatus
  academicYear: string
}

export interface Receipt {
  id: string
  receiptNo: string
  studentId: string
  feeCategory: string
  amount: number
  paidAt: string
  method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'
  reference: string
  remarks: string
  attachmentName: string | null
  createdBy: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Support / feedback / governance                                     */
/* ------------------------------------------------------------------ */

export interface TicketReply {
  id: string
  author: string
  authorRole: string
  message: string
  at: string
}

export interface SupportTicket {
  id: string
  code: string
  title: string
  category: string
  description: string
  status: TicketStatus
  priority: 'Low' | 'Normal' | 'High'
  createdBy: string
  createdByRole: Role
  createdAt: string
  attachmentName: string | null
  replies: TicketReply[]
}

export interface FeedbackRecord {
  id: string
  category: string
  rating: number
  message: string
  submittedBy: string
  submittedRole: Role
  at: string
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  actorRole: Role
  action: string
  target: string
  reason: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  at: string
  tone: 'info' | 'success' | 'warn' | 'gold'
  read: boolean
  audience: Portal[]
}

/* ------------------------------------------------------------------ */
/* Aggregate store                                                     */
/* ------------------------------------------------------------------ */

export interface DemoState {
  version: number
  students: Student[]
  teachers: Teacher[]
  classes: ClassRecord[]
  subjects: Subject[]
  subjectAssignments: SubjectAssignment[]
  attendance: AttendanceSession[]
  exams: Exam[]
  marks: Mark[]
  timetable: TimetableSlot[]
  notices: Notice[]
  econtent: EContentItem[]
  books: Book[]
  borrows: BorrowRecord[]
  events: EventRecord[]
  registrations: EventRegistration[]
  feeRecords: FeeRecord[]
  receipts: Receipt[]
  tickets: SupportTicket[]
  feedback: FeedbackRecord[]
  audit: AuditEntry[]
  notifications: AppNotification[]
}

export interface Session {
  accountId: string
  role: Role
  portal: Portal
  displayName: string
  title: string
  linkedId: string | null
  signedInAt: string
}
