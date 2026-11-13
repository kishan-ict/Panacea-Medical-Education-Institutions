import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  ClipboardList,
  IndianRupee,
  Megaphone,
  CalendarDays,
  PartyPopper,
  Library,
  MessageSquareQuote,
  FileBarChart2,
  Sparkles,
  LifeBuoy,
  Settings,
  UserCog,
  ArrowLeftRight,
  BookOpenCheck,
  ClipboardCheck,
  MonitorPlay,
  Receipt,
  Wallet,
  UserRoundSearch,
  type LucideIcon,
} from 'lucide-react'
import type { Portal, Role } from '@/types'

export interface NavItem {
  key: string
  label: string
  /** path segment appended to the portal root */
  to: string
  icon: LucideIcon
  /** live count badge sourced from the demo store */
  badge?: 'pendingEvents' | 'openTickets' | 'unreadNotices' | 'unassignedClasses' | 'pendingMarks'
  end?: boolean
}

export const ROOTS: Record<Role, string> = {
  chairman: '/chairman',
  director: '/director',
  principal: '/staff/principal',
  classTeacher: '/staff/class-teacher',
  subjectTeacher: '/staff/subject-teacher',
  student: '/student',
  accountant: '/accountant',
}

export const PORTAL_LABEL: Record<Portal, string> = {
  chairman: 'Chairman Portal',
  director: 'Director Portal',
  staff: 'Staff Portal',
  student: 'Student Portal',
  accountant: 'Accountant Portal',
}

const i = {
  overview: LayoutDashboard,
  students: GraduationCap,
  staff: UserCog,
  faculty: Users,
  departments: Building2,
  attendance: CalendarCheck,
  performance: TrendingUp,
  exams: ClipboardList,
  fees: IndianRupee,
  notices: Megaphone,
  timetable: CalendarDays,
  events: PartyPopper,
  library: Library,
  feedback: MessageSquareQuote,
  reports: FileBarChart2,
  assistant: Sparkles,
  helpdesk: LifeBuoy,
  settings: Settings,
  assign: ArrowLeftRight,
  econtent: BookOpenCheck,
  marks: ClipboardCheck,
  session: MonitorPlay,
  receipt: Receipt,
  wallet: Wallet,
  search: UserRoundSearch,
} satisfies Record<string, LucideIcon>

const chairmanNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'students', label: 'Student Management', to: 'students', icon: i.students },
  { key: 'staff', label: 'Staff Management', to: 'staff', icon: i.staff },
  { key: 'departments', label: 'Departments & Courses', to: 'departments', icon: i.departments },
  { key: 'attendance', label: 'Attendance Analytics', to: 'attendance', icon: i.attendance },
  { key: 'performance', label: 'Academic Performance', to: 'performance', icon: i.performance },
  { key: 'examinations', label: 'Examination Reports', to: 'examinations', icon: i.exams },
  { key: 'fees', label: 'Fee Overview', to: 'fees', icon: i.fees },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices, badge: 'unreadNotices' },
  { key: 'timetable', label: 'Timetable Overview', to: 'timetable', icon: i.timetable },
  { key: 'events', label: 'Events & Clubs', to: 'events', icon: i.events, badge: 'pendingEvents' },
  { key: 'library', label: 'Library Overview', to: 'library', icon: i.library },
  { key: 'feedback', label: 'Feedback', to: 'feedback', icon: i.feedback },
  { key: 'reports', label: 'Institutional Reports', to: 'reports', icon: i.reports },
  { key: 'assistant', label: 'AI Institutional Assistant', to: 'assistant', icon: i.assistant },
  { key: 'helpdesk', label: 'Developer Help Desk', to: 'helpdesk', icon: i.helpdesk, badge: 'openTickets' },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

const directorNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'students', label: 'Student Statistics', to: 'students', icon: i.students },
  { key: 'faculty', label: 'Faculty Overview', to: 'faculty', icon: i.faculty },
  { key: 'departments', label: 'Department Analytics', to: 'departments', icon: i.departments },
  { key: 'attendance', label: 'Attendance Reports', to: 'attendance', icon: i.attendance },
  { key: 'academics', label: 'Academic Reports', to: 'academics', icon: i.performance },
  { key: 'examinations', label: 'Examination Performance', to: 'examinations', icon: i.exams },
  { key: 'fees', label: 'Fee Overview', to: 'fees', icon: i.fees },
  { key: 'timetable', label: 'Timetable Overview', to: 'timetable', icon: i.timetable },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices, badge: 'unreadNotices' },
  { key: 'events', label: 'Events & Clubs', to: 'events', icon: i.events, badge: 'pendingEvents' },
  { key: 'feedback', label: 'Feedback', to: 'feedback', icon: i.feedback },
  { key: 'reports', label: 'Institutional Reports', to: 'reports', icon: i.reports },
  { key: 'assistant', label: 'AI Institutional Assistant', to: 'assistant', icon: i.assistant },
  { key: 'helpdesk', label: 'Developer Help Desk', to: 'helpdesk', icon: i.helpdesk, badge: 'openTickets' },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

const principalNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'teachers', label: 'Teacher Management', to: 'teachers', icon: i.staff },
  {
    key: 'class-assignment',
    label: 'Class Teacher Assignment',
    to: 'class-assignment',
    icon: i.assign,
    badge: 'unassignedClasses',
  },
  { key: 'subject-assignment', label: 'Subject Allocations', to: 'subject-assignment', icon: i.marks },
  { key: 'students', label: 'Student Directory', to: 'students', icon: i.students },
  { key: 'attendance', label: 'Attendance Overview', to: 'attendance', icon: i.attendance },
  { key: 'timetable', label: 'Timetable', to: 'timetable', icon: i.timetable },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices, badge: 'unreadNotices' },
  { key: 'events', label: 'Event Approvals', to: 'events', icon: i.events, badge: 'pendingEvents' },
  { key: 'library', label: 'Library', to: 'library', icon: i.library },
  { key: 'reports', label: 'Reports', to: 'reports', icon: i.reports },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

const classTeacherNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'students', label: 'My Students', to: 'students', icon: i.students },
  { key: 'subjects', label: 'Subject Allocation', to: 'subjects', icon: i.faculty },
  { key: 'attendance', label: 'Attendance', to: 'attendance', icon: i.attendance },
  { key: 'marks', label: 'Marks Management', to: 'marks', icon: i.marks, badge: 'pendingMarks' },
  { key: 'econtent', label: 'E-content', to: 'econtent', icon: i.econtent },
  { key: 'events', label: 'Event Approvals', to: 'events', icon: i.events, badge: 'pendingEvents' },
  { key: 'timetable', label: 'Timetable', to: 'timetable', icon: i.timetable },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices, badge: 'unreadNotices' },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

const subjectTeacherNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'session', label: 'Class Session', to: 'session', icon: i.session },
  { key: 'attendance', label: 'Attendance', to: 'attendance', icon: i.attendance },
  { key: 'marks', label: 'Marks Entry', to: 'marks', icon: i.marks, badge: 'pendingMarks' },
  { key: 'econtent', label: 'E-content', to: 'econtent', icon: i.econtent },
  { key: 'students', label: 'Student Details', to: 'students', icon: i.students },
  { key: 'timetable', label: 'Timetable', to: 'timetable', icon: i.timetable },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices, badge: 'unreadNotices' },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

const studentNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'attendance', label: 'Attendance', to: 'attendance', icon: i.attendance },
  { key: 'subjects', label: 'Subjects', to: 'subjects', icon: i.students },
  { key: 'econtent', label: 'E-content', to: 'econtent', icon: i.econtent },
  { key: 'timetable', label: 'Timetable', to: 'timetable', icon: i.timetable },
  { key: 'examinations', label: 'Examinations', to: 'examinations', icon: i.exams },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices, badge: 'unreadNotices' },
  { key: 'events', label: 'Events & Clubs', to: 'events', icon: i.events },
  { key: 'library', label: 'Library', to: 'library', icon: i.library },
  { key: 'fees', label: 'Fees & Receipts', to: 'fees', icon: i.fees },
  { key: 'helpdesk', label: 'Help Desk', to: 'helpdesk', icon: i.helpdesk, badge: 'openTickets' },
  { key: 'feedback', label: 'Feedback', to: 'feedback', icon: i.feedback },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

const accountantNav: NavItem[] = [
  { key: 'overview', label: 'Overview', to: 'overview', icon: i.overview, end: true },
  { key: 'students', label: 'Student Search', to: 'students', icon: i.search },
  { key: 'new-receipt', label: 'Create Fee Receipt', to: 'new-receipt', icon: i.receipt },
  { key: 'receipts', label: 'Receipt History', to: 'receipts', icon: i.wallet },
  { key: 'notices', label: 'Notices', to: 'notices', icon: i.notices },
  { key: 'settings', label: 'Settings', to: 'settings', icon: i.settings },
]

export const NAVIGATION: Record<Role, NavItem[]> = {
  chairman: chairmanNav,
  director: directorNav,
  principal: principalNav,
  classTeacher: classTeacherNav,
  subjectTeacher: subjectTeacherNav,
  student: studentNav,
  accountant: accountantNav,
}

export function getRootForRole(role: Role): string {
  return ROOTS[role]
}

export function getNavForRole(role: Role): NavItem[] {
  return NAVIGATION[role] ?? []
}

/* -------------------------- sidebar grouping ---------------------- */

const GROUP_ORDER = ['Overview', 'Academics', 'Operations', 'Accounts', 'System']

const KEY_GROUP: Record<string, string> = {
  overview: 'Overview',
  students: 'Academics',
  staff: 'Academics',
  faculty: 'Academics',
  departments: 'Academics',
  attendance: 'Academics',
  performance: 'Academics',
  examinations: 'Academics',
  academics: 'Academics',
  teachers: 'Academics',
  'class-assignment': 'Academics',
  'subject-assignment': 'Academics',
  subjects: 'Academics',
  session: 'Academics',
  marks: 'Academics',
  econtent: 'Academics',
  fees: 'Operations',
  notices: 'Operations',
  timetable: 'Operations',
  events: 'Operations',
  library: 'Operations',
  feedback: 'Operations',
  reports: 'System',
  assistant: 'System',
  helpdesk: 'System',
  settings: 'System',
  'new-receipt': 'Accounts',
  receipts: 'Accounts',
}

export function groupFor(role: Role, key: string): string {
  if (role === 'accountant') {
    if (key === 'students') return 'Accounts'
    if (key === 'notices') return 'Operations'
    if (key === 'overview') return 'Overview'
    return KEY_GROUP[key] ?? 'System'
  }
  return KEY_GROUP[key] ?? 'Operations'
}

export function groupNavItems(items: NavItem[], role: Role): { group: string; items: NavItem[] }[] {
  const buckets = new Map<string, NavItem[]>()
  items.forEach((item) => {
    const group = groupFor(role, item.key)
    if (!buckets.has(group)) buckets.set(group, [])
    buckets.get(group)!.push(item)
  })
  return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    items: buckets.get(group)!,
  }))
}
