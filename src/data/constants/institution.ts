import type { Program } from '@/types'

/**
 * Institutional identity & academic facts.
 *
 * SOURCE POLICY — every value tagged `source: 'official'` was read from
 * https://pmeinursingcollege.com/ (the only permitted institutional source).
 * Anything not published there is explicitly marked "Not published on the
 * official website." Demonstration-only values live in `data/mock/*` and are
 * never presented as institutional records.
 */

export const INSTITUTION = {
  name: 'Panacea Medical Education Institutions',
  shortName: 'PMEI',
  product: 'PMEl Login',
  productTagline: 'One Institution. One Platform. Connected Excellence.',
  productVision: 'One Institution. One Platform. Complete Academic Connectivity.',
  officialTagline: 'Best Nursing College In Bihar For ANM, GNM & B.Sc. Nursing',
  address: 'Samastipur, Bihar, India — 848104',
  phone: '7480888899',
  email: 'info@pmeinursingcollege.com',
  website: 'https://pmeinursingcollege.com/',
  established: '2020',
  approval: 'Bihar Nursing Registration Council (BNRC)',
  clinicalHours: '800+ hrs',
  academicYear: '2026-27',
  logoLight: 'https://pmeinursingcollege.com/assets/img/logo/logo-blue.png',
  logoDark: 'https://pmeinursingcollege.com/assets/img/logo/logo-white.png',
  favicon: 'https://pmeinursingcollege.com/assets/img/logo/favicon.png',
} as const

/** Official leadership, as published on the institutional website. */
export const LEADERSHIP = [
  { name: 'Mr. Akhtarul Islam Shahin', role: 'Chairman', portal: 'chairman' as const },
  { name: 'Md. Sharif Alam Usmani', role: 'Director', portal: 'director' as const },
  { name: 'Mr. Sayuj Kumar Biswas', role: 'Principal', portal: 'principal' as const },
]

export const PROGRAMMES: Program[] = [
  {
    code: 'GNM',
    short: 'GNM',
    name: 'General Nursing & Midwifery',
    level: 'Diploma',
    duration: '3 Years',
    seats: 60,
    eligibility: '12th Science (PCB) with English, min. 40%',
    ageLimit: 'Minimum 17 years',
    description:
      'A comprehensive diploma preparing students for registered nursing practice in hospitals and community health settings.',
    entrance: 'DCECE — GNM Admission',
  },
  {
    code: 'BSC',
    short: 'B.Sc. Nursing',
    name: 'Bachelor of Science in Nursing',
    level: 'Degree',
    duration: '4 Years',
    seats: 60,
    eligibility: '12th Science (PCB) with English, min. 45%',
    ageLimit: '17 years and above',
    description:
      'A four-year degree building advanced clinical, research and leadership skills for a professional nursing career.',
    entrance: 'BUHSJET — B.Sc. Admission',
  },
  {
    code: 'ANM',
    short: 'ANM',
    name: 'Auxiliary Nurse Midwifery',
    level: 'Diploma',
    duration: '2 Years',
    seats: 100,
    eligibility: '10+2 pass in any stream, with English',
    ageLimit: 'Minimum 17 years',
    description:
      'A foundational diploma building core nursing and midwifery skills for community and primary healthcare roles.',
    entrance: 'DCECE — ANM Admission',
  },
]

export const DEPARTMENTS = [
  { id: 'dept-fund', name: 'Fundamentals of Nursing', head: 'Prof. (Dr.) Meera Sinha' },
  { id: 'dept-anat', name: 'Anatomy & Physiology', head: 'Prof. (Dr.) R. K. Verma' },
  { id: 'dept-med', name: 'Medical-Surgical Nursing', head: 'Prof. (Dr) Sunita Rathore' },
  { id: 'dept-obg', name: 'Obstetrics & Child Health', head: 'Prof. Anjali Tirkey' },
  { id: 'dept-com', name: 'Community Health Nursing', head: 'Prof. Nazneen Ansari' },
  { id: 'dept-psy', name: 'Behavioural Sciences', head: 'Prof. Deepak Mishra' },
]

/** Faculty heads are demonstration personnel for this prototype. */
export const FACULTY_NOTE =
  'Faculty assignments shown in this demonstration are simulated for product evaluation and do not represent institutional records.'

export const DISCLAIMER = {
  demo: 'DEMO MODE',
  data: 'DEMO DATA',
  body: 'PMEl Login is a frontend demonstration. All records, people, figures and transactions are fictional sample data prepared for product evaluation.',
  assistant:
    'This is a simulated assistant operating on the demonstration dataset. It has not queried live institutional records or any external AI service.',
} as const

/** Copy for fields the official website does not publish. */
export const NOT_PUBLISHED = 'Not published on the official website.'
