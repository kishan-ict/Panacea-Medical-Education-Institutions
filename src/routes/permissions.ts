import type { Role } from '@/types'

/**
 * ---------------------------------------------------------------------
 * PROTOTYPE PERMISSION CONFIGURATION
 * ---------------------------------------------------------------------
 * Central, documented role → capability map for the PMEl demonstration.
 *
 * | Capability            | Chairman | Director | Principal | Class Tchr | Subject Tchr | Student | Accountant |
 * |-----------------------|:--------:|:--------:|:---------:|:----------:|:------------:|:-------:|:----------:|
 * | institutional.overview|     ✓    |     ✓    |     ✓     |     –      |      –       |    –    |     –      |
 * | students.directory    |     ✓    |     ✓    |     ✓     |  own class | assigned cls |   own   |   search   |
 * | students.insight      |     ✓    |     ✓    |     ✓     |  own class | assigned cls |   own   | fee files  |
 * | staff.view            |     ✓    |     ✓    |     ✓     |      –     |      –       |    –    |     –      |
 * | staff.manage          |     –    |     ✓    |     ✓     |      –     |      –       |    –    |     –      |
 * | staff.assign          |     –    |     –    |     ✓     |      –     |      –       |    –    |     –      |
 * | academics.manage      |     –    |     ✓    |     ✓     |      –     |      –       |    –    |     –      |
 * | attendance.mark       |     –    |     –    |     –     |     ✓      |      ✓       |    –    |     –      |
 * | attendance.analytics  |     ✓    |     ✓    |     ✓     |  own class | assigned cls |   own   |     –      |
 * | marks.enter           |     –    |     –    |     –     |     ✓      |      ✓       |    –    |     –      |
 * | marks.publish         |     –    |     –    |     ✓     |     ✓      |      –       |    –    |     –      |
 * | events.create         |     –    |     –    |     –     |      –     |      –       |    ✓    |     –      |
 * | events.approve        |     –    |     –    |     ✓     |     ✓      |      –       |    –    |     –      |
 * | econtent.manage       |     –    |     –    |     ✓     |     ✓      |      ✓       |    –    |     –      |
 * | fees.overview         |     ✓    |     ✓    |     –     |      –     |      –       |    –    |     ✓      |
 * | fees.receipt.create   |     –    |     –    |     –     |      –     |      –       |    –    |     ✓      |
 * | fees.own              |     –    |     –    |     –     |      –     |      –       |    ✓    |     –      |
 * | notices.create        |     ✓    |     ✓    |     ✓     |     ✓      |      –       |    –    |     –      |
 * | reports.view          |     ✓    |     ✓    |     ✓     |      –     |      –       |    –    |     –      |
 * | assistant.use         |     ✓    |     ✓    |     –     |      –     |      –       |    –    |     –      |
 * | tickets.create        |     ✓    |     ✓    |     ✓     |     ✓      |      ✓       |    ✓    |     ✓      |
 * | feedback.view         |     ✓    |     ✓    |     ✓     |      –     |      –       |    –    |     –      |
 * | feedback.submit       |     ✓    |     ✓    |     ✓     |     ✓      |      ✓       |    ✓    |     ✓      |
 * | settings.manage       |     ✓    |     ✓    |     ✓     |      –     |      –       |    –    |     –      |
 * | audit.view            |     ✓    |     ✓    |     –     |      –     |      –       |    –    |     –      |
 * | library.manage        |     –    |     –    |     ✓     |      –     |      –       |    –    |     –      |
 *
 * NOTE: these are prototype-only, client-side capabilities. Real
 * authorisation must be enforced server-side before production use.
 * Chairman vs Director differences are intentionally documented above and
 * can be re-aligned after institutional approval by editing ROLE_PERMISSIONS.
 * ---------------------------------------------------------------------
 */

export type Permission =
  | 'institutional.overview'
  | 'students.directory'
  | 'students.insight'
  | 'students.finance'
  | 'staff.view'
  | 'staff.manage'
  | 'staff.assign'
  | 'academics.manage'
  | 'attendance.mark'
  | 'attendance.analytics'
  | 'marks.enter'
  | 'marks.publish'
  | 'events.create'
  | 'events.approve'
  | 'econtent.manage'
  | 'fees.overview'
  | 'fees.receipt.create'
  | 'fees.own'
  | 'notices.create'
  | 'notices.view'
  | 'library.view'
  | 'library.manage'
  | 'timetable.view'
  | 'reports.view'
  | 'assistant.use'
  | 'tickets.create'
  | 'tickets.view'
  | 'feedback.view'
  | 'feedback.submit'
  | 'settings.manage'
  | 'audit.view'

const ALL: Permission[] = [
  'institutional.overview',
  'students.directory',
  'students.insight',
  'students.finance',
  'staff.view',
  'staff.manage',
  'staff.assign',
  'academics.manage',
  'attendance.mark',
  'attendance.analytics',
  'marks.enter',
  'marks.publish',
  'events.create',
  'events.approve',
  'econtent.manage',
  'fees.overview',
  'fees.receipt.create',
  'fees.own',
  'notices.create',
  'notices.view',
  'library.view',
  'library.manage',
  'timetable.view',
  'reports.view',
  'assistant.use',
  'tickets.create',
  'tickets.view',
  'feedback.view',
  'feedback.submit',
  'settings.manage',
  'audit.view',
]

const pick = (...perms: Permission[]): Permission[] => perms

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  chairman: pick(
    'institutional.overview',
    'students.directory',
    'students.insight',
    'students.finance',
    'staff.view',
    'attendance.analytics',
    'fees.overview',
    'notices.create',
    'notices.view',
    'library.view',
    'timetable.view',
    'reports.view',
    'assistant.use',
    'tickets.create',
    'tickets.view',
    'feedback.view',
    'feedback.submit',
    'settings.manage',
    'audit.view',
  ),
  director: pick(
    'institutional.overview',
    'students.directory',
    'students.insight',
    'students.finance',
    'staff.view',
    'staff.manage',
    'academics.manage',
    'attendance.analytics',
    'fees.overview',
    'notices.create',
    'notices.view',
    'library.view',
    'timetable.view',
    'reports.view',
    'assistant.use',
    'tickets.create',
    'tickets.view',
    'feedback.view',
    'feedback.submit',
    'settings.manage',
    'audit.view',
  ),
  principal: pick(
    'institutional.overview',
    'students.directory',
    'students.insight',
    'students.finance',
    'staff.view',
    'staff.manage',
    'staff.assign',
    'academics.manage',
    'attendance.analytics',
    'marks.publish',
    'events.approve',
    'econtent.manage',
    'notices.create',
    'notices.view',
    'library.view',
    'library.manage',
    'timetable.view',
    'reports.view',
    'tickets.create',
    'tickets.view',
    'feedback.view',
    'feedback.submit',
    'settings.manage',
  ),
  classTeacher: pick(
    'students.directory',
    'students.insight',
    'attendance.mark',
    'attendance.analytics',
    'marks.enter',
    'marks.publish',
    'events.approve',
    'econtent.manage',
    'notices.view',
    'timetable.view',
    'tickets.create',
    'tickets.view',
    'feedback.submit',
    'library.view',
  ),
  subjectTeacher: pick(
    'students.directory',
    'students.insight',
    'attendance.mark',
    'attendance.analytics',
    'marks.enter',
    'econtent.manage',
    'notices.view',
    'timetable.view',
    'tickets.create',
    'tickets.view',
    'library.view',
  ),
  student: pick(
    'notices.view',
    'attendance.analytics',
    'timetable.view',
    'fees.own',
    'events.create',
    'tickets.create',
    'tickets.view',
    'feedback.submit',
    'library.view',
    'students.insight',
  ),
  accountant: pick(
    'students.directory',
    'students.finance',
    'fees.overview',
    'fees.receipt.create',
    'notices.view',
    'tickets.create',
    'tickets.view',
    'feedback.submit',
  ),
}

const ROLE_PERMISSION_SETS: Record<Role, Set<Permission>> = Object.fromEntries(
  Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => [role, new Set(perms)]),
) as Record<Role, Set<Permission>>

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSION_SETS[role]?.has(permission) ?? false
}

export function canAny(role: Role | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p))
}

export { ALL as ALL_PERMISSIONS }
