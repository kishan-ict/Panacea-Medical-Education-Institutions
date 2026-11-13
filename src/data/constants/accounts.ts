import type { DemoAccount } from '@/types'
import { INSTITUTION } from './institution'

/**
 * Demonstration credentials.
 *
 * These accounts simulate role-based access only. They do not constitute
 * authentication of any kind — the prototype has no backend.
 *
 * Leadership display names are the institution's published office holders
 * (source: pmeinursingcollege.com). All other people are fictional.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'acc-chairman',
    username: 'chairman',
    password: 'demo1234',
    role: 'chairman',
    portal: 'chairman',
    displayName: 'Mr. Akhtarul Islam Shahin',
    title: 'Chairman',
    linkedId: null,
    accent: 'brand',
  },
  {
    id: 'acc-director',
    username: 'director',
    password: 'demo1234',
    role: 'director',
    portal: 'director',
    displayName: 'Md. Sharif Alam Usmani',
    title: 'Director',
    linkedId: null,
    accent: 'royal',
  },
  {
    id: 'acc-principal',
    username: 'principal',
    password: 'demo1234',
    role: 'principal',
    portal: 'staff',
    displayName: 'Mr. Sayuj Kumar Biswas',
    title: 'Principal',
    linkedId: 'tch-01',
    accent: 'brand',
  },
  {
    id: 'acc-classteacher',
    username: 'class.teacher',
    password: 'demo1234',
    role: 'classTeacher',
    portal: 'staff',
    displayName: 'Mrs. Kavita Anand',
    title: 'Class Teacher · GNM First Year A',
    linkedId: 'tch-02',
    accent: 'gold',
  },
  {
    id: 'acc-subjectteacher',
    username: 'subject.teacher',
    password: 'demo1234',
    role: 'subjectTeacher',
    portal: 'staff',
    displayName: 'Ms. Priyanka Mishra',
    title: 'Subject Teacher · Anatomy & Pharmacology',
    linkedId: 'tch-06',
    accent: 'royal',
  },
  {
    id: 'acc-student',
    username: 'student',
    password: 'demo1234',
    role: 'student',
    portal: 'student',
    displayName: 'Jyoti Kumari',
    title: 'GNM First Year A · Student',
    linkedId: 'stu-03',
    accent: 'success',
  },
  {
    id: 'acc-accountant',
    username: 'accountant',
    password: 'demo1234',
    role: 'accountant',
    portal: 'accountant',
    displayName: 'Md. Javed Anwar',
    title: 'Accounts Officer',
    linkedId: null,
    accent: 'gold',
  },
]

export function findAccountByCredentials(username: string, password: string): DemoAccount | undefined {
  const normalised = username.trim().toLowerCase()
  return DEMO_ACCOUNTS.find(
    (a) => (a.username.toLowerCase() === normalised || a.id === normalised) && a.password === password,
  )
}

export function findAccount(id: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.id === id)
}

export const DEMO_HINT = `Demonstration credentials — every account uses the password "demo1234".`
export const DEMO_SOURCE = `Institutional information on this platform is referenced from ${INSTITUTION.website}`
