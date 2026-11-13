import type {
  AppNotification,
  AuditEntry,
  AttendanceSession,
  Book,
  BorrowRecord,
  ClassRecord,
  EContentItem,
  EventRecord,
  EventRegistration,
  Exam,
  FeeRecord,
  FeedbackRecord,
  Mark,
  Notice,
  Receipt,
  RegistrationQuestion,
  Student,
  Subject,
  SubjectAssignment,
  SupportTicket,
  Teacher,
  TimetableSlot,
  DemoState,
} from '@/types'
import { mulberry32, randInt, pick } from '@/utils/cn'
import { addDays, todayISO } from '@/utils/format'

/* ==================================================================== *
 * PMEl Login — demonstration dataset
 * Every person, identifier, amount and date in this file is fictional
 * sample data prepared for product evaluation.
 * ==================================================================== */

export const ACADEMIC_YEAR = '2026-27'
const SEED_VERSION = 1

/* ------------------------------ classes ---------------------------- */

export const CLASSES: ClassRecord[] = [
  { id: 'cls-gnm1', code: 'GNM-1A', name: 'GNM First Year — Section A', programCode: 'GNM', year: 1, section: 'A', academicYear: ACADEMIC_YEAR, classTeacherId: 'tch-02', room: 'L-201' },
  { id: 'cls-gnm2', code: 'GNM-2A', name: 'GNM Second Year — Section A', programCode: 'GNM', year: 2, section: 'A', academicYear: ACADEMIC_YEAR, classTeacherId: 'tch-05', room: 'L-202' },
  { id: 'cls-bsn1', code: 'BSN-1A', name: 'B.Sc. Nursing First Year — Section A', programCode: 'BSC', year: 1, section: 'A', academicYear: ACADEMIC_YEAR, classTeacherId: 'tch-03', room: 'L-101' },
  { id: 'cls-bsn2', code: 'BSN-2A', name: 'B.Sc. Nursing Second Year — Section A', programCode: 'BSC', year: 2, section: 'A', academicYear: ACADEMIC_YEAR, classTeacherId: 'tch-04', room: 'L-102' },
  { id: 'cls-anm1', code: 'ANM-1A', name: 'ANM First Year — Section A', programCode: 'ANM', year: 1, section: 'A', academicYear: ACADEMIC_YEAR, classTeacherId: null, room: 'L-301' },
  { id: 'cls-anm2', code: 'ANM-2A', name: 'ANM Second Year — Section A', programCode: 'ANM', year: 2, section: 'A', academicYear: ACADEMIC_YEAR, classTeacherId: 'tch-09', room: 'L-302' },
]

/* ------------------------------ teachers --------------------------- */

const TEACHER_SEED: Omit<Teacher, 'id'>[] = [
  { employeeId: 'PMEI/T/001', name: 'Mr. Sayuj Kumar Biswas', email: 's.k.biswas@example.com', phone: '+91 98765 01101', department: 'Nursing Administration', designation: 'Principal', qualification: 'M.Sc. Nursing, Ph.D.', joiningDate: '2020-07-01', status: 'active', classTeacherOfClassId: null },
  { employeeId: 'PMEI/T/002', name: 'Mrs. Kavita Anand', email: 'kavita.anand@example.com', phone: '+91 98765 01102', department: 'Fundamentals of Nursing', designation: 'Senior Lecturer', qualification: 'M.Sc. Nursing (Nursing Education)', joiningDate: '2021-06-15', status: 'active', classTeacherOfClassId: 'cls-gnm1' },
  { employeeId: 'PMEI/T/003', name: 'Mr. Rahul Deshmukh', email: 'rahul.deshmukh@example.com', phone: '+91 98765 01103', department: 'Medical-Surgical Nursing', designation: 'Lecturer', qualification: 'M.Sc. Nursing (Med-Surg)', joiningDate: '2022-01-10', status: 'active', classTeacherOfClassId: 'cls-bsn1' },
  { employeeId: 'PMEI/T/004', name: 'Ms. Farhana Qureshi', email: 'farhana.qureshi@example.com', phone: '+91 98765 01104', department: 'Community Health Nursing', designation: 'Lecturer', qualification: 'M.Sc. Nursing (Community Health)', joiningDate: '2022-07-20', status: 'active', classTeacherOfClassId: 'cls-bsn2' },
  { employeeId: 'PMEI/T/005', name: 'Mr. Santosh Kumar Yadav', email: 'santosh.yadav@example.com', phone: '+91 98765 01105', department: 'Fundamentals of Nursing', designation: 'Lecturer', qualification: 'M.Sc. Nursing', joiningDate: '2023-02-01', status: 'active', classTeacherOfClassId: 'cls-gnm2' },
  { employeeId: 'PMEI/T/006', name: 'Ms. Priyanka Mishra', email: 'priyanka.mishra@example.com', phone: '+91 98765 01106', department: 'Anatomy & Physiology', designation: 'Tutor', qualification: 'M.Sc. Nursing (Anatomy)', joiningDate: '2023-08-01', status: 'active', classTeacherOfClassId: null },
  { employeeId: 'PMEI/T/007', name: 'Mr. Imran Sheikh', email: 'imran.sheikh@example.com', phone: '+91 98765 01107', department: 'Obstetrics & Child Health', designation: 'Tutor', qualification: 'M.Sc. Nursing (Obstetrics)', joiningDate: '2024-01-08', status: 'active', classTeacherOfClassId: null },
  { employeeId: 'PMEI/T/008', name: 'Ms. Ritu Balam', email: 'ritu.balam@example.com', phone: '+91 98765 01108', department: 'Behavioural Sciences', designation: 'Tutor', qualification: 'M.A. Psychology', joiningDate: '2024-07-15', status: 'active', classTeacherOfClassId: null },
  { employeeId: 'PMEI/T/009', name: 'Mr. Ajay Bharti', email: 'ajay.bharti@example.com', phone: '+91 98765 01109', department: 'Community Health Nursing', designation: 'Tutor', qualification: 'M.Sc. Nursing (Community Health)', joiningDate: '2025-01-06', status: 'active', classTeacherOfClassId: 'cls-anm2' },
]

export const TEACHERS: Teacher[] = TEACHER_SEED.map((t, index) => ({
  ...t,
  id: `tch-${String(index + 1).padStart(2, '0')}`,
}))

/* ------------------------------ subjects --------------------------- */

export const SUBJECTS: Subject[] = [
  { id: 'sub-fund', code: 'NUF-101', name: 'Fundamentals of Nursing', shortName: 'Nursing Fundamentals', programCodes: ['GNM', 'BSC', 'ANM'], years: [1], credits: 6, type: 'Theory + Practical' },
  { id: 'sub-anat', code: 'ANP-102', name: 'Anatomy & Physiology', shortName: 'Anatomy & Physiology', programCodes: ['GNM', 'BSC', 'ANM'], years: [1], credits: 5, type: 'Theory + Practical' },
  { id: 'sub-nut', code: 'NUT-103', name: 'Nutrition & Biochemistry', shortName: 'Nutrition', programCodes: ['BSC', 'GNM'], years: [1], credits: 3, type: 'Theory' },
  { id: 'sub-psy', code: 'PSY-104', name: 'Psychology & Sociology', shortName: 'Psychology', programCodes: ['GNM', 'BSC', 'ANM'], years: [1], credits: 3, type: 'Theory' },
  { id: 'sub-com', code: 'CHN-105', name: 'Community Health Nursing', shortName: 'Community Health', programCodes: ['GNM', 'BSC', 'ANM'], years: [1, 2], credits: 5, type: 'Theory + Practical' },
  { id: 'sub-med', code: 'MSN-201', name: 'Medical-Surgical Nursing', shortName: 'Medical-Surgical', programCodes: ['GNM', 'BSC', 'ANM'], years: [2], credits: 7, type: 'Theory + Practical' },
  { id: 'sub-obg', code: 'OBS-202', name: 'Obstetrics & Midwifery Nursing', shortName: 'Midwifery', programCodes: ['GNM', 'BSC', 'ANM'], years: [1, 2], credits: 6, type: 'Theory + Practical' },
  { id: 'sub-chd', code: 'CHP-203', name: 'Child Health Nursing', shortName: 'Child Health', programCodes: ['GNM', 'BSC'], years: [2], credits: 5, type: 'Theory + Practical' },
  { id: 'sub-phm', code: 'PHA-204', name: 'Pharmacology & Therapeutics', shortName: 'Pharmacology', programCodes: ['BSC'], years: [2], credits: 4, type: 'Theory' },
  { id: 'sub-res', code: 'NRS-205', name: 'Nursing Research & Statistics', shortName: 'Research & Statistics', programCodes: ['BSC'], years: [2], credits: 3, type: 'Theory' },
  { id: 'sub-mgt', code: 'NAD-206', name: 'Nursing Administration & Management', shortName: 'Nursing Administration', programCodes: ['GNM', 'BSC', 'ANM'], years: [2], credits: 3, type: 'Theory' },
]

/** Primary subject teacher used for timetable / e-content / attendance seeding. */
const SUBJECT_LEAD: Record<string, string> = {
  'sub-fund': 'tch-05',
  'sub-anat': 'tch-06',
  'sub-nut': 'tch-08',
  'sub-psy': 'tch-08',
  'sub-com': 'tch-04',
  'sub-med': 'tch-03',
  'sub-obg': 'tch-07',
  'sub-chd': 'tch-07',
  'sub-phm': 'tch-06',
  'sub-res': 'tch-02',
  'sub-mgt': 'tch-09',
}

export function subjectsForClass(classRecord: ClassRecord): Subject[] {
  return SUBJECTS.filter(
    (s) => s.programCodes.includes(classRecord.programCode) && s.years.includes(classRecord.year),
  )
}

/* -------------------------- subject allocation --------------------- */

function buildSubjectAssignments(): SubjectAssignment[] {
  const rows: SubjectAssignment[] = []
  CLASSES.forEach((cls) => {
    subjectsForClass(cls).forEach((subject, index) => {
      rows.push({
        id: `sa-${cls.id}-${subject.id}`,
        teacherId: SUBJECT_LEAD[subject.id] ?? 'tch-02',
        classId: cls.id,
        subjectId: subject.id,
        academicYear: ACADEMIC_YEAR,
      })
      // second allocation so classes are covered by more than one faculty member
      if (index % 2 === 0 && subject.id !== 'sub-anat') {
        const extra = ['tch-02', 'tch-03', 'tch-04', 'tch-05', 'tch-08']
        rows.push({
          id: `sa2-${cls.id}-${subject.id}`,
          teacherId: extra[index % extra.length],
          classId: cls.id,
          subjectId: subject.id,
          academicYear: ACADEMIC_YEAR,
        })
      }
    })
  })
  return rows
}

export const SUBJECT_ASSIGNMENTS: SubjectAssignment[] = buildSubjectAssignments()

/* ------------------------------ students --------------------------- */

const CLASS_ROSTER: { classId: string; names: [string, 'Female' | 'Male'][] }[] = [
  {
    classId: 'cls-gnm1',
    names: [
      ['Sana Khan', 'Female'],
      ['Rimjhim Singh', 'Female'],
      ['Jyoti Kumari', 'Female'],
      ['Pallavi Mehta', 'Female'],
      ['Nazma Khatun', 'Female'],
      ['Harshita Raj', 'Female'],
      ['Deepika Nishad', 'Female'],
    ],
  },
  {
    classId: 'cls-gnm2',
    names: [
      ['Chandni Bharti', 'Female'],
      ['Gudiya Mandal', 'Female'],
      ['Iqra Parween', 'Female'],
      ['Kajal Singh', 'Female'],
      ['Shalini Mishra', 'Female'],
      ['Varsha Rani', 'Female'],
    ],
  },
  {
    classId: 'cls-bsn1',
    names: [
      ['Aarohi Sharma', 'Female'],
      ['Aditi Rani', 'Female'],
      ['Anjali Kumari', 'Female'],
      ['Aman Verma', 'Male'],
      ['Khushboo Rani', 'Female'],
      ['Shreya Das', 'Female'],
      ['Tanvi Joshi', 'Female'],
    ],
  },
  {
    classId: 'cls-bsn2',
    names: [
      ['Lakshmi Murmu', 'Female'],
      ['Madhuri Jha', 'Female'],
      ['Manisha Pasi', 'Male'],
      ['Nandini Gupta', 'Female'],
      ['Neha Chaudhary', 'Female'],
      ['Zoya Fatima', 'Female'],
    ],
  },
  {
    classId: 'cls-anm1',
    names: [
      ['Afsana Parween', 'Female'],
      ['Bhavna Thakur', 'Female'],
      ['Jahanvi Roy', 'Female'],
      ['Kumari Sweety', 'Female'],
      ['Reena Kumari', 'Female'],
      ['Sunita Kisku', 'Female'],
    ],
  },
  {
    classId: 'cls-anm2',
    names: [
      ['Farah Khan', 'Female'],
      ['Priyanka Sah', 'Female'],
      ['Shabnam Bano', 'Female'],
      ['Usha Devi', 'Female'],
    ],
  },
]

const GUARDIAN_FIRST = [
  'Ram Prakash',
  'Suresh',
  'Mohd. Irfan',
  'Dinesh',
  'Dharmendra',
  'Dharmendra',
  'Ashok',
  'Manoj',
  'Vijay',
  'Ram Ashish',
  'Bhola Nath',
  'Sanjay',
]
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-']
const TOWNS = [
  'Samastipur, Bihar — 848104',
  'Pusa Road, Samastipur, Bihar — 848131',
  'Begusarai, Bihar — 851101',
  'Darbhanga, Bihar — 846004',
  'Muzaffarpur, Bihar — 842001',
  'Rosera, Samastipur, Bihar — 848216',
]

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.')
}

function buildStudents(): Student[] {
  const rng = mulberry32(20261113)
  const rows: Student[] = []
  let counter = 0
  for (const roster of CLASS_ROSTER) {
    const cls = CLASSES.find((c) => c.id === roster.classId)!
    for (const [name, gender] of roster.names) {
      counter += 1
      const year = 2003 + randInt(rng, 0, 4)
      const month = randInt(rng, 1, 12)
      const day = randInt(rng, 1, 28)
      rows.push({
        id: `stu-${String(counter).padStart(3, '0')}`,
        admissionNo: `PMEI/2026/${String(counter).padStart(4, '0')}`,
        name,
        gender,
        dob: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        programCode: cls.programCode,
        academicYear: ACADEMIC_YEAR,
        classId: cls.id,
        guardianName: `${GUARDIAN_FIRST[(counter + 3) % GUARDIAN_FIRST.length]} ${name.split(' ').slice(-1)[0]}`,
        guardianRelation: counter % 3 === 0 ? 'Mother' : 'Father',
        guardianPhone: `+91 98765 0${String(2000 + counter * 7).slice(-4)}`,
        guardianEmail: `guardian.${slug(name)}@example.com`,
        phone: `+91 98765 0${String(3000 + counter * 5).slice(-4)}`,
        email: `${slug(name)}@example.com`,
        address: TOWNS[counter % TOWNS.length],
        bloodGroup: BLOOD[counter % BLOOD.length],
        admissionDate: `2026-0${randInt(rng, 6, 7)}-${String(randInt(rng, 10, 28)).padStart(2, '0')}`,
        status: 'active',
      })
    }
  }
  return rows
}

export const STUDENTS: Student[] = buildStudents()

/* ---------------------------- attendance --------------------------- */

const PERIODS: [string, string][] = [
  ['09:00', '10:00'],
  ['10:00', '11:00'],
  ['11:15', '12:15'],
  ['12:15', '13:15'],
  ['14:00', '15:00'],
  ['15:00', '16:00'],
]

function recentWeekdays(count: number): string[] {
  const dates: string[] = []
  const cursor = new Date()
  while (dates.length < count) {
    const dow = cursor.getDay()
    if (dow !== 0) dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() - 1)
  }
  return dates.reverse()
}

function buildAttendance(): AttendanceSession[] {
  const rng = mulberry32(4402)
  const sessions: AttendanceSession[] = []
  const days = recentWeekdays(40)
  for (const cls of CLASSES) {
    const classSubjects = subjectsForClass(cls)
    const roster = STUDENTS.filter((s) => s.classId === cls.id)
    days.forEach((date, dayIndex) => {
      const subject = classSubjects[(dayIndex + cls.code.length) % classSubjects.length]
      const period = (dayIndex % 6) + 1
      const lead = SUBJECT_LEAD[subject.id] ?? 'tch-02'
      const teacherId =
        cls.classTeacherId && dayIndex % 3 === 0 ? cls.classTeacherId : lead
      const records: AttendanceSession['records'] = {}
      for (const student of roster) {
        const roll = rng()
        records[student.id] = roll > 0.13 ? 'present' : roll > 0.05 ? 'late' : 'absent'
      }
      sessions.push({
        id: `att-${cls.id}-${date}`,
        date,
        classId: cls.id,
        subjectId: subject.id,
        teacherId,
        period,
        records,
        submittedAt: `${date}T09:${String(10 + period).padStart(2, '0')}:00.000Z`,
        markedBy: TEACHERS.find((t) => t.id === teacherId)?.name ?? 'Faculty',
      })
    })
  }
  return sessions
}

/* ------------------------------ exams & marks ---------------------- */

export const EXAMS: Exam[] = [
  { id: 'ex-ut1', name: 'Unit Test I — 2026', shortName: 'Unit Test I', type: 'Unit Test', academicYear: ACADEMIC_YEAR, startDate: '2026-08-17', endDate: '2026-08-21', classIds: CLASSES.map((c) => c.id), published: true },
  { id: 'ex-mid', name: 'Mid Semester Examination — 2026', shortName: 'Mid Semester', type: 'Mid Term', academicYear: ACADEMIC_YEAR, startDate: '2026-09-21', endDate: '2026-09-30', classIds: CLASSES.map((c) => c.id), published: true },
  { id: 'ex-ut2', name: 'Unit Test II — 2026', shortName: 'Unit Test II', type: 'Unit Test', academicYear: ACADEMIC_YEAR, startDate: '2026-11-02', endDate: '2026-11-07', classIds: CLASSES.map((c) => c.id), published: false },
  { id: 'ex-annual', name: 'Annual Examination — 2026', shortName: 'Annual Exam', type: 'Final Examination', academicYear: ACADEMIC_YEAR, startDate: '2026-12-14', endDate: '2026-12-23', classIds: CLASSES.map((c) => c.id), published: false },
]

function buildMarks(): Mark[] {
  const rng = mulberry32(7788)
  const marks: Mark[] = []
  for (const cls of CLASSES) {
    const classSubjects = subjectsForClass(cls)
    const roster = STUDENTS.filter((s) => s.classId === cls.id)
    for (const exam of EXAMS) {
      if (exam.id === 'ex-annual') continue
      const coverage = exam.id === 'ex-ut2' ? 0.62 : 1
      for (const subject of classSubjects) {
        for (const student of roster) {
          if (rng() > coverage) continue
          const base = 58 + Math.floor(rng() * 36)
          const marksObtained = Math.min(99, base)
          marks.push({
            id: `mk-${exam.id}-${student.id}-${subject.id}`,
            examId: exam.id,
            classId: cls.id,
            subjectId: subject.id,
            studentId: student.id,
            marks: marksObtained,
            maxMarks: 100,
            status: exam.id === 'ex-ut2' ? 'draft' : 'published',
          })
        }
      }
    }
  }
  return marks
}

/* ----------------------------- timetable --------------------------- */

function buildTimetable(): TimetableSlot[] {
  const slots: TimetableSlot[] = []
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  for (const cls of CLASSES) {
    const classSubjects = subjectsForClass(cls)
    days.forEach((day, dayIndex) => {
      for (let period = 1; period <= 6; period += 1) {
        const subject = classSubjects[(dayIndex + period * 2) % classSubjects.length]
        const [startTime, endTime] = PERIODS[period - 1]
        slots.push({
          id: `tt-${cls.id}-${dayIndex}-${period}`,
          classId: cls.id,
          day,
          period,
          startTime,
          endTime,
          subjectId: subject.id,
          teacherId: SUBJECT_LEAD[subject.id] ?? 'tch-02',
          room: cls.room,
        })
      }
    })
  }
  return slots
}

/* ------------------------------ notices ---------------------------- */

const NOTICE_SEED: Omit<Notice, 'id'>[] = [
  { title: 'Admissions open — Academic Session 2026-27 (GNM, ANM)', body: 'Applications for the 2026-27 academic session are open for GNM, ANM and B.Sc. Nursing programmes. Candidates may apply through DCECE (GNM/ANM) and BUHSJET (B.Sc. Nursing) as per the published admission schedule.', category: 'Institution', priority: 'high', programCodes: [], classIds: [], author: 'Admissions Cell', authorRole: 'Administration', publishedAt: '2026-11-09T09:15:00.000Z', pinned: true },
  { title: 'Facial & finger biometric attendance configuration', body: 'Biometric attendance configuration as per university notice. Students are instructed to complete device enrolment at the administration office before the notified date.', category: 'Institution', priority: 'high', programCodes: [], classIds: [], author: 'Controller of Examinations', authorRole: 'Examination Cell', publishedAt: '2026-11-11T07:40:00.000Z', pinned: true },
  { title: 'B.Sc. Nursing Semester II — special examination notice', body: 'Special examination scheduling for Semester II candidates. Refer to the examination portal for subject-wise dates and hall-ticket issuance.', category: 'Examination', priority: 'high', programCodes: ['BSC'], classIds: [], author: 'Examination Cell', authorRole: 'Examination Cell', publishedAt: '2026-11-08T11:05:00.000Z', pinned: false },
  { title: 'University practical timetable — B.Sc. Nursing Semester II & IV', body: 'Practical examination timetable published for Semester II (2024-2028) and Semester IV (2023-2027) batches. Practical batches will run in the skill laboratory as per the shared roster.', category: 'Examination', priority: 'normal', programCodes: ['BSC'], classIds: [], author: 'Examination Cell', authorRole: 'Examination Cell', publishedAt: '2026-11-05T10:30:00.000Z', pinned: false },
  { title: 'Unit Test II results under compilation', body: 'Unit Test II answer sheets are being evaluated. Subject-wise result sheets will be shared with class teachers after moderation and publication approval.', category: 'Examination', priority: 'normal', programCodes: [], classIds: [], author: 'Mr. Sayuj Kumar Biswas', authorRole: 'Principal', publishedAt: '2026-11-12T08:00:00.000Z', pinned: false },
  { title: 'Second installment tuition fee — due 30 Nov 2026', body: 'Second installment of tuition fee for the 2026-27 session is due on 30 November 2026. Receipts are issued by the accounts office during working hours (10:00–16:00).', category: 'Fee', priority: 'high', programCodes: [], classIds: [], author: 'Accounts Office', authorRole: 'Accounts', publishedAt: '2026-11-10T12:20:00.000Z', pinned: false },
  { title: 'GNM First Year — community health posting roster', body: 'Field posting roster for the GNM First Year batch. Students must report to the assigned health centre with record files and college identity card.', category: 'Class', priority: 'normal', programCodes: ['GNM'], classIds: ['cls-gnm1'], author: 'Mrs. Kavita Anand', authorRole: 'Class Teacher', publishedAt: '2026-11-07T06:45:00.000Z', pinned: false },
  { title: 'Library — new arrivals in Nursing Foundation section', body: 'New reference titles on nursing foundation and clinical skills have been added to the reading room. Borrowing is available against a valid college identity card.', category: 'Institution', priority: 'low', programCodes: [], classIds: [], author: 'Librarian', authorRole: 'Library', publishedAt: '2026-11-03T09:00:00.000Z', pinned: false },
  { title: 'Skill laboratory session — IV therapy practice', body: 'Demonstration and practice slots for IV therapy have been scheduled in the skill laboratory. Attendance is compulsory for all allotted batches.', category: 'Class', priority: 'normal', programCodes: [], classIds: ['cls-bsn1', 'cls-bsn2', 'cls-gnm1', 'cls-gnm2'], author: 'Skills Lab In-charge', authorRole: 'Administration', publishedAt: '2026-11-06T10:10:00.000Z', pinned: false },
  { title: 'Anti-ragging committee — mandatory orientation', body: 'Mandatory anti-ragging orientation for all students. Zero tolerance policy applies inside and outside the campus as per institutional regulation.', category: 'Institution', priority: 'high', programCodes: [], classIds: [], author: 'Committees & Cells', authorRole: 'Administration', publishedAt: '2026-10-28T08:30:00.000Z', pinned: false },
  { title: 'ANM First Year — class teacher allocation pending', body: 'Class teacher allocation for ANM First Year Section A is under review by the office of the Principal. Students will be informed once confirmed.', category: 'Class', priority: 'normal', programCodes: ['ANM'], classIds: ['cls-anm1'], author: 'Office of the Principal', authorRole: 'Principal', publishedAt: '2026-11-04T13:15:00.000Z', pinned: false },
  { title: 'College uniform & identity card verification', body: 'Uniform and identity card verification will be conducted class-wise. Students without a validated identity card will not be permitted in clinical postings.', category: 'Institution', priority: 'normal', programCodes: [], classIds: [], author: 'Student Affairs', authorRole: 'Administration', publishedAt: '2026-10-24T11:00:00.000Z', pinned: false },
]

const NOTICES: Notice[] = NOTICE_SEED.map((n, i) => ({ ...n, id: `ntc-${i + 1}` }))

/* ----------------------------- e-content --------------------------- */

function buildEContent(): EContentItem[] {
  const rows: Omit<EContentItem, 'id'>[] = []
  let n = 0
  const seed: [string, string, string, string][] = [
    ['cls-gnm1', 'sub-fund', 'Unit 3 — Bed Making & Patient Comfort', 'Step-wise procedure notes with aseptic precautions and documentation checklist.'],
    ['cls-gnm1', 'sub-anat', 'Blood Circulation — Heart & Great Vessels', 'Annotated notes covering chambers, valves, coronary circulation and applied anatomy.'],
    ['cls-gnm1', 'sub-com', 'National Health Programmes — Quick Revision', 'Programme objectives, indicators and community health nursing roles.'],
    ['cls-bsn1', 'sub-fund', 'Nursing Process — ADPIE Framework', 'Assessment, diagnosis, planning, implementation and evaluation with sample care plans.'],
    ['cls-bsn1', 'sub-anat', 'Skeletal System — Upper Limb', 'Slide notes on bone landmarks, joints and clinical relevance for bed-bound patients.'],
    ['cls-bsn1', 'sub-psy', 'Growth & Developmental Stages', 'Milestones across the lifespan with nursing implications.'],
    ['cls-bsn2', 'sub-med', 'Pre & Post-operative Nursing Care', 'Pre-operative preparation, risk assessment and post-operative monitoring.'],
    ['cls-bsn2', 'sub-phm', 'Drug Administration Routes & Safety', 'Safe medication administration, high-alert drugs and error prevention.'],
    ['cls-bsn2', 'sub-obg', 'Stages of Labour & Nursing Management', 'Phases, cardinal signs and labour-room documentation.'],
    ['cls-gnm2', 'sub-med', 'Wound Care & Dressing Techniques', 'Wound classification, cleansing, dressing selection and healing assessment.'],
    ['cls-gnm2', 'sub-chd', 'Immunisation Schedule — National Schedule', 'Age-wise schedule, contraindications and adverse event reporting.'],
    ['cls-anm1', 'sub-com', 'Family Health & Home Visit Planning', 'Home visit preparation, data collection and follow-up.'],
    ['cls-anm1', 'sub-obg', 'Antenatal Care — Routine Assessment', 'ANC visit components, danger signs and referral criteria.'],
    ['cls-anm2', 'sub-mgt', 'Records & Registers in Primary Health Centre', 'Registers, reporting formats and supervisory tools.'],
    ['cls-anm2', 'sub-com', 'Epidemiology — Basic Concepts', 'Chain of infection, surveillance and outbreak investigation basics.'],
    ['cls-gnm2', 'sub-fund', 'Vital Signs — Measurement & Charting', 'Techniques, normal ranges and escalation thresholds.'],
  ]
  const teacherName = (id: string) => TEACHERS.find((t) => t.id === id)?.name ?? 'Faculty'
  for (const [classId, subjectId, title, description] of seed) {
    n += 1
    const cls = CLASSES.find((c) => c.id === classId)!
    const lead = SUBJECT_LEAD[subjectId] ?? cls.classTeacherId ?? 'tch-02'
    const uploadedAt = `2026-11-${String(((n * 3) % 12) + 1).padStart(2, '0')}T${String(9 + (n % 6)).padStart(2, '0')}:20:00.000Z`
    rows.push({
      title,
      description,
      subjectId,
      classId,
      uploadedBy: teacherName(lead),
      uploadedAt,
      fileName: `${title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`,
      fileType: n % 5 === 0 ? 'notes' : 'pdf',
      fileSizeKb: 180 + n * 47,
      downloads: 4 + ((n * 13) % 38),
    })
  }
  return rows.map((row, i) => ({ ...row, id: `ec-${i + 1}` }))
}

/* ------------------------------ library ---------------------------- */

const BOOK_SEED: Omit<Book, 'id'>[] = [
  { title: "Textbook of Nursing Foundation for GNM", author: 'S. K. Sharma', category: 'Nursing Foundation', isbn: '978-81-0000-100-1', copies: 6, available: 2, shelf: 'NF-01' },
  { title: 'Anatomy & Physiology for Nurses', author: 'C. P. Anthapur', category: 'Anatomy', isbn: '978-81-0000-101-8', copies: 5, available: 3, shelf: 'AN-04' },
  { title: 'Community Health Nursing — Text & Atlas', author: 'K. Park', category: 'Community Health', isbn: '978-81-0000-102-5', copies: 8, available: 5, shelf: 'CH-02' },
  { title: 'Medical-Surgical Nursing — Volume I', author: 'Brunner & Suddarth (Ed.)', category: 'Medical-Surgical', isbn: '978-81-0000-103-2', copies: 4, available: 1, shelf: 'MS-07' },
  { title: 'Midwifery & Obstetrical Nursing', author: 'P. M. Padubidri', category: 'Midwifery', isbn: '978-81-0000-104-9', copies: 6, available: 4, shelf: 'OB-03' },
  { title: 'Child Health Nursing', author: 'Ghosh', category: 'Child Health', isbn: '978-81-0000-105-6', copies: 5, available: 5, shelf: 'CH-09' },
  { title: 'Pharmacology for Nurses', author: 'K. D. Tripathi', category: 'Pharmacology', isbn: '978-81-0000-106-3', copies: 4, available: 2, shelf: 'PH-05' },
  { title: 'Psychology for Nurses', author: 'S. Agrawal', category: 'Behavioural Sciences', isbn: '978-81-0000-107-0', copies: 5, available: 4, shelf: 'PS-06' },
  { title: 'Nutrition & Dietetics', author: 'Srilakshmi', category: 'Nutrition', isbn: '978-81-0000-108-7', copies: 4, available: 3, shelf: 'NU-08' },
  { title: 'Nursing Research & Statistics', author: 'Sreevani', category: 'Research', isbn: '978-81-0000-109-4', copies: 3, available: 3, shelf: 'RS-10' },
  { title: 'Handbook of Clinical Nursing Skills', author: 'PMEI Skills Lab (Comp.)', category: 'Reference', isbn: '978-81-0000-110-0', copies: 10, available: 6, shelf: 'RF-00' },
  { title: 'Dictionary of Medical Terminology', author: 'Taber (Ed.)', category: 'Reference', isbn: '978-81-0000-111-7', copies: 3, available: 1, shelf: 'RF-01' },
  { title: 'Public Health Nursing — Field Manual', author: 'NIHFW', category: 'Community Health', isbn: '978-81-0000-112-4', copies: 6, available: 6, shelf: 'CH-04' },
  { title: 'Ethics & Legal Aspects of Nursing', author: 'A. K. Srivastava', category: 'Reference', isbn: '978-81-0000-113-1', copies: 3, available: 2, shelf: 'RF-03' },
  { title: 'Operating Theatre Technique', author: 'N. D. Nagalaxmi', category: 'Medical-Surgical', isbn: '978-81-0000-114-8', copies: 4, available: 2, shelf: 'MS-02' },
  { title: 'Emergency & Disaster Nursing', author: 'H. S. Satyanarayana', category: 'Reference', isbn: '978-81-0000-115-5', copies: 4, available: 4, shelf: 'RF-06' },
]

const BOOKS: Book[] = BOOK_SEED.map((b, i) => ({ ...b, id: `bk-${i + 1}` }))

function buildBorrows(): BorrowRecord[] {
  const rng = mulberry32(9090)
  const rows: BorrowRecord[] = []
  for (let i = 0; i < 14; i += 1) {
    const student = STUDENTS[Math.floor(rng() * STUDENTS.length)]
    const book = BOOKS[Math.floor(rng() * BOOKS.length)]
    const borrowed = addDays(todayISO(), -randInt(rng, 3, 34))
    const due = addDays(borrowed, 14)
    const returned = i % 3 === 0 ? addDays(borrowed, randInt(rng, 5, 13)) : null
    rows.push({
      id: `brw-${i + 1}`,
      bookId: book.id,
      studentId: student.id,
      borrowedAt: borrowed,
      dueAt: due,
      returnedAt: returned,
    })
  }
  return rows
}

/* ------------------------------- events ---------------------------- */

function baseQuestions(): RegistrationQuestion[] {
  return [
    { id: 'q-bio', label: 'Brief profile (year & section)', type: 'text', required: true, options: [] },
    { id: 'q-why', label: 'Why do you want to participate?', type: 'textarea', required: false, options: [] },
    {
      id: 'q-slot',
      label: 'Preferred slot',
      type: 'select',
      required: true,
      options: ['Forenoon', 'Afternoon', 'Either'],
    },
    { id: 'q-exp', label: 'Relevant experience (years)', type: 'number', required: false, options: [] },
  ]
}

function buildEvents(): EventRecord[] {
  const today = todayISO()
  const base: Omit<EventRecord, 'id' | 'questions'>[] = [
    {
      title: 'Blood Donation & Health Screening Camp',
      description:
        'A voluntary blood donation drive conducted with the district blood centre along with basic health screening — BP, BMI and Hb — for students and staff.',
      category: 'Health Camp', date: addDays(today, 12), startTime: '09:30', endTime: '14:00',
      venue: 'College Auditorium', organizer: 'Community Health Nursing Department', organizerClub: 'Red Ribbon Cell',
      registrationDeadline: addDays(today, 9), maxParticipants: 150, programCode: 'All',
      status: 'approved', createdById: 'tch-04', createdByName: 'Ms. Farhana Qureshi', createdByRole: 'classTeacher',
      createdAt: addDays(today, -18), reviewedAt: addDays(today, -16), reviewedBy: 'Mr. Sayuj Kumar Biswas',
      reviewNote: 'Approved for institutional calendar. Ensure consent forms are available at registration desk.',
      shareSlug: 'blood-donation-camp-26', coverTone: 1,
    },
    {
      title: 'Annual Cultural Evening — “Sanjeevani”',
      description:
        'Annual cultural evening featuring nursing skits, folk dance, choir and poster exhibition on patient-care themes. Open to all programmes.',
      category: 'Cultural', date: addDays(today, 20), startTime: '17:00', endTime: '21:00',
      venue: 'Open Air Amphitheatre', organizer: 'Student Cultural Club', organizerClub: 'Cultural Club',
      registrationDeadline: addDays(today, 16), maxParticipants: 300, programCode: 'All',
      status: 'approved', createdById: 'stu-01', createdByName: 'Sana Khan', createdByRole: 'student',
      createdAt: addDays(today, -25), reviewedAt: addDays(today, -22), reviewedBy: 'Mrs. Kavita Anand',
      reviewNote: 'Approved. Coordinate sound and lighting with the administrative office.',
      shareSlug: 'sanjeevani-2026', coverTone: 2,
    },
    {
      title: 'Inter-Class Sports Meet',
      description:
        'Inter-class sports meet covering volleyball, kabaddi, relay and sprint events. Medals for winners and participation certificates for all.',
      category: 'Sports', date: addDays(today, 27), startTime: '08:00', endTime: '13:00',
      venue: 'College Playground', organizer: 'Sports Committee', organizerClub: 'Sports Club',
      registrationDeadline: addDays(today, 23), maxParticipants: 240, programCode: 'All',
      status: 'approved', createdById: 'tch-09', createdByName: 'Mr. Ajay Bharti', createdByRole: 'subjectTeacher',
      createdAt: addDays(today, -12), reviewedAt: addDays(today, -10), reviewedBy: 'Mr. Sayuj Kumar Biswas',
      reviewNote: 'Approved with first-aid station requirement.', shareSlug: 'sports-meet-2026', coverTone: 3,
    },
    {
      title: 'Nursing Skills Workshop — IV Therapy & Cannulation',
      description:
        'Hands-on workshop on IV therapy, cannulation and infusion safety using simulation lab equipment. Limited to two batches.',
      category: 'Workshop', date: addDays(today, 7), startTime: '10:00', endTime: '13:00',
      venue: 'Skills Laboratory', organizer: 'Fundamentals of Nursing Department', organizerClub: 'Skills Club',
      registrationDeadline: addDays(today, 5), maxParticipants: 40, programCode: 'All',
      status: 'approved', createdById: 'tch-02', createdByName: 'Mrs. Kavita Anand', createdByRole: 'classTeacher',
      createdAt: addDays(today, -9), reviewedAt: addDays(today, -8), reviewedBy: 'Mr. Sayuj Kumar Biswas',
      reviewNote: 'Approved. Prioritise second and third year students.', shareSlug: 'iv-therapy-workshop', coverTone: 4,
    },
    {
      title: 'World AIDS Day — Awareness Rally',
      description:
        'Campus-to-town awareness rally on HIV prevention with poster display and pledge signing. Participants will receive a certificate of participation.',
      category: 'Health Camp', date: addDays(today, 18), startTime: '08:30', endTime: '12:00',
      venue: 'College Gate → Main Market Road', organizer: 'Jyoti Kumari (GNM First Year A)', organizerClub: 'Red Ribbon Cell',
      registrationDeadline: addDays(today, 14), maxParticipants: 120, programCode: 'All',
      status: 'pending', createdById: 'stu-03', createdByName: 'Jyoti Kumari', createdByRole: 'student',
      createdAt: addDays(today, -3), reviewedAt: null, reviewedBy: null, reviewNote: '',
      shareSlug: 'aids-day-rally-2026', coverTone: 1,
    },
    {
      title: 'First Aid Training Drive — Volunteers',
      description:
        'Peer-to-peer first aid training for student volunteers before the sports meet. CPR demonstration and bandaging practice included.',
      category: 'Workshop', date: addDays(today, 15), startTime: '14:00', endTime: '16:30',
      venue: 'Seminar Hall', organizer: 'Pallavi Mehta (GNM First Year A)', organizerClub: 'Nursing Club',
      registrationDeadline: addDays(today, 12), maxParticipants: 60, programCode: 'All',
      status: 'pending', createdById: 'stu-04', createdByName: 'Pallavi Mehta', createdByRole: 'student',
      createdAt: addDays(today, -2), reviewedAt: null, reviewedBy: null, reviewNote: '',
      shareSlug: 'first-aid-drive', coverTone: 3,
    },
    {
      title: 'Yoga & Wellness Week',
      description: 'Early-morning yoga and wellness sessions across one week for students and staff.',
      category: 'Club', date: addDays(today, 9), startTime: '06:30', endTime: '07:30',
      venue: 'Yoga Room, Block C', organizer: 'Wellness Club', organizerClub: 'Wellness Club',
      registrationDeadline: addDays(today, 6), maxParticipants: 80, programCode: 'All',
      status: 'rejected', createdById: 'stu-05', createdByName: 'Nazma Khatun', createdByRole: 'student',
      createdAt: addDays(today, -14), reviewedAt: addDays(today, -11), reviewedBy: 'Mrs. Kavita Anand',
      reviewNote: 'Rejected for this window — the 06:30 slot overlaps with clinical posting buses. Re-submit with an alternate schedule.',
      shareSlug: 'yoga-wellness-week', coverTone: 2,
    },
    {
      title: 'Community Outreach — Village Health Visit',
      description: 'Field visit to Samastipur block villages for health education, BP screening and referral follow-up.',
      category: 'Health Camp', date: addDays(today, -15), startTime: '09:00', endTime: '15:00',
      venue: 'Rampur Village, Samastipur', organizer: 'Community Health Department', organizerClub: 'Community Club',
      registrationDeadline: addDays(today, -19), maxParticipants: 50, programCode: 'All',
      status: 'completed', createdById: 'tch-04', createdByName: 'Ms. Farhana Qureshi', createdByRole: 'classTeacher',
      createdAt: addDays(today, -40), reviewedAt: addDays(today, -37), reviewedBy: 'Mr. Sayuj Kumar Biswas',
      reviewNote: 'Approved. Complete post-visit report within one week.', shareSlug: 'village-health-visit', coverTone: 4,
    },
    {
      title: 'Photography Club — Campus Frames Exhibition',
      description: 'Open call for campus photography submissions. Selected frames will be displayed during the cultural evening.',
      category: 'Club', date: addDays(today, 30), startTime: '11:00', endTime: '16:00',
      venue: 'Exhibition Corridor', organizer: 'Jyoti Kumari (GNM First Year A)', organizerClub: 'Photography Club',
      registrationDeadline: addDays(today, 24), maxParticipants: 40, programCode: 'All',
      status: 'draft', createdById: 'stu-03', createdByName: 'Jyoti Kumari', createdByRole: 'student',
      createdAt: addDays(today, -1), reviewedAt: null, reviewedBy: null, reviewNote: '',
      shareSlug: 'campus-frames-2026', coverTone: 3,
    },
  ]
  return base.map((event, i) => ({
    ...event,
    id: `eve-${i + 1}`,
    questions:
      i === 0 || i === 4
        ? [
            ...baseQuestions(),
            { id: 'q-med', label: 'Do you have any medical condition to declare?', type: 'select', required: false, options: ['No', 'Yes — I will declare at the desk'] },
          ]
        : baseQuestions(),
  }))
}

function buildRegistrations(events: EventRecord[]): EventRegistration[] {
  const rng = mulberry32(3131)
  const first = ['Ananya', 'Ritu', 'Kajal', 'Sneha', 'Pooja', 'Aarti', 'Neha', 'Simran', 'Riya', 'Tanya', 'Mansi', 'Rupal', 'Soni', 'Ankita', 'Payal', 'Deepa', 'Shruti', 'Babita']
  const last = ['Kumari', 'Singh', 'Patel', 'Sharma', 'Khan', 'Rani', 'Das', 'Mishra', 'Bharti', 'Gupta']
  const rows: EventRegistration[] = []
  let n = 0
  for (const event of events) {
    let count: number
    if (event.status === 'approved') count = 6 + Math.floor(rng() * 9)
    else if (event.status === 'completed') count = 8 + Math.floor(rng() * 8)
    else if (event.status === 'pending') count = 3
    else count = 0
    for (let i = 0; i < count; i += 1) {
      n += 1
      const name = `${first[Math.floor(rng() * first.length)]} ${last[Math.floor(rng() * last.length)]}`
      rows.push({
        id: `reg-${n}`,
        eventId: event.id,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: `+91 98765 0${String(4000 + n * 3).slice(-4)}`,
        answers: event.questions.map((q) => ({
          questionId: q.id,
          value:
            q.type === 'select'
              ? (q.options[0] ?? '—')
              : q.type === 'number'
                ? String(1 + (n % 4))
                : q.type === 'textarea'
                  ? 'Enthusiastic to participate and represent my class.'
                  : 'GNM First Year A',
        })),
        submittedAt: `${addDays(event.createdAt, 1)}T10:${String(10 + (n % 45)).padStart(2, '0')}:00.000Z`,
      })
    }
  }
  return rows
}

/* ------------------------------- fees ------------------------------ */

const FEE_STRUCTURE: Record<string, { tuition: number }> = {
  BSC: { tuition: 45000 },
  GNM: { tuition: 35000 },
  ANM: { tuition: 28000 },
}

function buildFeesAndReceipts(): { fees: FeeRecord[]; receipts: Receipt[] } {
  const rng = mulberry32(6262)
  const fees: FeeRecord[] = []
  const receipts: Receipt[] = []
  let receiptSeq = 0
  const pushReceipt = (studentId: string, feeCategory: string, amount: number, paidAt: string, method: Receipt['method'], reference: string, remarks = '') => {
    receiptSeq += 1
    receipts.push({
      id: `rcp-${receiptSeq}`,
      receiptNo: `PMEI/26-27/RCP/${String(receiptSeq).padStart(4, '0')}`,
      studentId,
      feeCategory,
      amount,
      paidAt,
      method,
      reference,
      remarks,
      attachmentName: null,
      createdBy: 'Md. Javed Anwar',
      createdAt: `${paidAt}T11:00:00.000Z`,
    })
  }

  let seq = 0
  for (const student of STUDENTS) {
    seq += 1
    const tuition = FEE_STRUCTURE[student.programCode].tuition
    const admissionRoll = rng()
    const tuitionRoll = rng()
    const examRoll = rng()
    const hostelRoll = rng()

    // Admission fee — always settled at the time of admission
    const admission: FeeRecord = {
      id: `fee-${seq}-adm`,
      studentId: student.id,
      category: 'Admission Fee',
      amount: 5000,
      paidAmount: 5000,
      dueDate: student.admissionDate,
      status: 'paid',
      academicYear: ACADEMIC_YEAR,
    }
    fees.push(admission)
    pushReceipt(student.id, 'Admission Fee', 5000, student.admissionDate, 'Bank Transfer', `NEFT/${student.admissionNo.slice(-4)}ADM`, 'Admission dues settled')

    // Tuition
    const tuitionPaid = tuitionRoll > 0.25
    const tuitionPartial = !tuitionPaid && tuitionRoll > 0.12
    const paidTuition = tuitionPaid ? tuition : tuitionPartial ? Math.round(tuition * 0.4) : 0
    const tuitionFee: FeeRecord = {
      id: `fee-${seq}-tui`,
      studentId: student.id,
      category: 'Tuition Fee',
      amount: tuition,
      paidAmount: paidTuition,
      dueDate: '2026-07-15',
      status: paidTuition >= tuition ? 'paid' : paidTuition > 0 ? 'partial' : 'pending',
      academicYear: ACADEMIC_YEAR,
    }
    fees.push(tuitionFee)
    if (paidTuition > 0) {
      pushReceipt(
        student.id,
        'Tuition Fee',
        paidTuition,
        `2026-0${admissionRoll > 0.5 ? '7' : '8'}-${String(randInt(rng, 5, 26)).padStart(2, '0')}`,
        pick(rng, ['Cash', 'UPI', 'Bank Transfer', 'Cheque'] as const),
        `REF/TUI/${String(seq).padStart(4, '0')}`,
        tuitionPaid ? 'First installment received' : 'Part payment towards tuition fee',
      )
    }

    // Examination fee
    const examPaid = examRoll > 0.2
    const examFee: FeeRecord = {
      id: `fee-${seq}-exm`,
      studentId: student.id,
      category: 'Examination Fee',
      amount: 2000,
      paidAmount: examPaid ? 2000 : 0,
      dueDate: '2026-10-25',
      status: examPaid ? 'paid' : 'pending',
      academicYear: ACADEMIC_YEAR,
    }
    fees.push(examFee)
    if (examPaid) {
      pushReceipt(student.id, 'Examination Fee', 2000, `2026-10-${String(randInt(rng, 8, 22)).padStart(2, '0')}`, 'UPI', `UPI/EXM/${String(seq).padStart(4, '0')}`, 'Semester examination fee')
    }

    // Library fee — settled for everyone
    const libraryFee: FeeRecord = {
      id: `fee-${seq}-lib`,
      studentId: student.id,
      category: 'Library Fee',
      amount: 1200,
      paidAmount: 1200,
      dueDate: '2026-07-31',
      status: 'paid',
      academicYear: ACADEMIC_YEAR,
    }
    fees.push(libraryFee)
    pushReceipt(student.id, 'Library Fee', 1200, '2026-07-28', 'Cash', `CASH/LIB/${String(seq).padStart(4, '0')}`, 'Annual library subscription')

    // Hostel (opt-in)
    if (hostelRoll > 0.62) {
      const hostelPaid = hostelRoll > 0.78
      const hostelFee: FeeRecord = {
        id: `fee-${seq}-hst`,
        studentId: student.id,
        category: 'Hostel Fee',
        amount: 30000,
        paidAmount: hostelPaid ? 30000 : 0,
        dueDate: '2026-08-10',
        status: hostelPaid ? 'paid' : 'pending',
        academicYear: ACADEMIC_YEAR,
      }
      fees.push(hostelFee)
      if (hostelPaid) {
        pushReceipt(student.id, 'Hostel Fee', 30000, '2026-08-06', 'Bank Transfer', `NEFT/HST/${String(seq).padStart(4, '0')}`, 'Hostel charges — academic session 2026-27')
      }
    }
  }
  return { fees, receipts }
}

/* --------------------- tickets, feedback, audit -------------------- */

const TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1', code: 'HD-1041', title: 'Fee receipt print layout truncated in Chrome',
    category: 'Receipts & Printing',
    description: 'When printing a fee receipt from the Accountant portal, the last row of the payment table is cut off in Chrome (Windows). Reproduced on two machines.',
    status: 'in-progress', priority: 'Normal', createdBy: 'Md. Javed Anwar', createdByRole: 'accountant',
    createdAt: '2026-11-09T10:12:00.000Z', attachmentName: 'receipt-print-cut.png',
    replies: [
      { id: 'rep-1', author: 'PMEl Development Desk', authorRole: 'developer', message: 'Reproduced. The print stylesheet is missing a page-break guard — a fix is queued for the next demonstration build.', at: '2026-11-09T14:40:00.000Z' },
    ],
  },
  {
    id: 'tkt-2', code: 'HD-1038', title: 'Attendance summary not updating after save',
    category: 'Attendance',
    description: 'Submitted an attendance session for GNM First Year A; the summary tile continued to show the previous value until a page refresh.',
    status: 'resolved', priority: 'High', createdBy: 'Mrs. Kavita Anand', createdByRole: 'classTeacher',
    createdAt: '2026-11-05T08:05:00.000Z', attachmentName: null,
    replies: [
      { id: 'rep-2', author: 'PMEl Development Desk', authorRole: 'developer', message: 'State cache invalidation was corrected — derived attendance statistics now recompute on every store update.', at: '2026-11-06T09:30:00.000Z' },
      { id: 'rep-3', author: 'PMEl Development Desk', authorRole: 'developer', message: 'Verified in the 1.0.0 demonstration build. Closing as resolved.', at: '2026-11-06T16:10:00.000Z' },
    ],
  },
  {
    id: 'tkt-3', code: 'HD-1044', title: 'Request: bulk CSV export of student roster',
    category: 'Data Export',
    description: 'The institution would like a class-wise roster export for internal verification during the evaluation period.',
    status: 'open', priority: 'Low', createdBy: 'Md. Sharif Alam Usmani', createdByRole: 'director',
    createdAt: '2026-11-11T13:25:00.000Z', attachmentName: null,
    replies: [],
  },
  {
    id: 'tkt-4', code: 'HD-1045', title: 'Event approval notification missing on portal',
    category: 'Events',
    description: 'A student reported that the approval status of a submitted event did not raise a notification on the student dashboard.',
    status: 'open', priority: 'Normal', createdBy: 'Jyoti Kumari', createdByRole: 'student',
    createdAt: '2026-11-12T09:48:00.000Z', attachmentName: 'event-status-screen.png',
    replies: [],
  },
]

const FEEDBACK: FeedbackRecord[] = [
  { id: 'fb-1', category: 'Portal usability', rating: 5, message: 'The class teacher attendance screen is quick — marking a full batch takes under a minute.', submittedBy: 'Mrs. Kavita Anand', submittedRole: 'classTeacher', at: '2026-11-08T11:00:00.000Z' },
  { id: 'fb-2', category: 'Student portal', rating: 4, message: 'Please add a due-date reminder for library books on the student overview.', submittedBy: 'Jyoti Kumari', submittedRole: 'student', at: '2026-11-07T15:30:00.000Z' },
  { id: 'fb-3', category: 'Examination', rating: 4, message: 'Marks entry is clear, but subject-wise filtering would speed up bulk publication.', submittedBy: 'Mr. Rahul Deshmukh', submittedRole: 'subjectTeacher', at: '2026-11-06T10:20:00.000Z' },
  { id: 'fb-4', category: 'Fees & receipts', rating: 5, message: 'Receipt preview matches the printed format — very useful for counter service.', submittedBy: 'Md. Javed Anwar', submittedRole: 'accountant', at: '2026-11-04T12:00:00.000Z' },
  { id: 'fb-5', category: 'Reports', rating: 4, message: 'Institutional analytics are readable in meetings. Adding a PDF summary would help.', submittedBy: 'Md. Sharif Alam Usmani', submittedRole: 'director', at: '2026-11-02T09:15:00.000Z' },
  { id: 'fb-6', category: 'Navigation', rating: 5, message: 'Consistent sidebar across portals makes demonstrations smooth.', submittedBy: 'Mr. Sayuj Kumar Biswas', submittedRole: 'principal', at: '2026-10-30T16:45:00.000Z' },
  { id: 'fb-7', category: 'Student portal', rating: 3, message: 'E-content search should also look inside descriptions.', submittedBy: 'Sana Khan', submittedRole: 'student', at: '2026-10-28T13:05:00.000Z' },
  { id: 'fb-8', category: 'Events', rating: 5, message: 'Event creation with a custom registration form is exactly what the club needed.', submittedBy: 'Pallavi Mehta', submittedRole: 'student', at: '2026-10-26T17:40:00.000Z' },
]

const AUDIT: AuditEntry[] = [
  { id: 'aud-1', at: '2026-11-11T09:12:00.000Z', actor: 'Mr. Akhtarul Islam Shahin', actorRole: 'chairman', action: 'Viewed individual student record', target: 'PMEI/2026/0003 — Jyoti Kumari', reason: 'Fee concession review for the 2026-27 session' },
  { id: 'aud-2', at: '2026-11-10T15:35:00.000Z', actor: 'Md. Sharif Alam Usmani', actorRole: 'director', action: 'Viewed individual student record', target: 'PMEI/2026/0011 — Khushboo Rani', reason: 'Parent escalation regarding attendance shortage' },
  { id: 'aud-3', at: '2026-11-09T11:44:00.000Z', actor: 'Mrs. Kavita Anand', actorRole: 'classTeacher', action: 'Exported class attendance summary', target: 'GNM First Year — Section A', reason: 'Monthly class report to the Office of the Principal' },
]

const NOTIFICATIONS: AppNotification[] = [
  { id: 'ntf-1', title: 'Two events await review', body: 'Student-submitted events are pending class teacher approval.', at: '2026-11-12T08:20:00.000Z', tone: 'gold', read: false, audience: ['staff', 'chairman', 'director'] },
  { id: 'ntf-2', title: 'Unit Test II results pending publication', body: 'Draft marks are awaiting moderation for select classes.', at: '2026-11-11T17:05:00.000Z', tone: 'info', read: false, audience: ['staff'] },
  { id: 'ntf-3', title: 'Fee installment window closes 30 Nov', body: 'Second installment dues are due at the accounts counter.', at: '2026-11-10T10:00:00.000Z', tone: 'warn', read: false, audience: ['student', 'accountant'] },
  { id: 'ntf-4', title: 'New study material published', body: 'Fundamentals of Nursing — Unit 3 notes are now available.', at: '2026-11-09T12:30:00.000Z', tone: 'success', read: false, audience: ['student'] },
  { id: 'ntf-5', title: 'Support ticket HD-1041 updated', body: 'The development desk replied to your printing issue.', at: '2026-11-09T14:42:00.000Z', tone: 'info', read: true, audience: ['accountant', 'chairman', 'director', 'student', 'staff'] },
]

/* --------------------------- assemble store ------------------------ */

export function createSeedState(): DemoState {
  const events = buildEvents()
  const registrations = buildRegistrations(events)
  const { fees, receipts } = buildFeesAndReceipts()
  return {
    version: SEED_VERSION,
    students: STUDENTS,
    teachers: TEACHERS,
    classes: CLASSES,
    subjects: SUBJECTS,
    subjectAssignments: SUBJECT_ASSIGNMENTS,
    attendance: buildAttendance(),
    exams: EXAMS,
    marks: buildMarks(),
    timetable: buildTimetable(),
    notices: NOTICES,
    econtent: buildEContent(),
    books: BOOKS,
    borrows: buildBorrows(),
    events,
    registrations,
    feeRecords: fees,
    receipts,
    tickets: TICKETS,
    feedback: FEEDBACK,
    audit: AUDIT,
    notifications: NOTIFICATIONS,
  }
}
