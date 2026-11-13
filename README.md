# PMEl Login — Panacea Medical Education Institutions

A complete, **frontend-only institutional ERP demonstration** for Panacea Medical
Education Institutions (PMEI), Samastipur, Bihar. Every workflow runs on mock data
inside your browser — no backend, no database, no real authentication.

> **DEMO MODE** — this project is a design & workflow prototype. All data is seeded
> mock data persisted to `localStorage`. Nothing is sent to a server.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
npm run preview  # serve the production build
```

Requirements: Node.js 20+.

---

## Demo credentials

Shared password for **every** account: `demo1234`

| Username         | Role            | Portal          |
| ---------------- | --------------- | --------------- |
| `chairman`       | Chairman        | `/chairman`     |
| `director`       | Director        | `/director`     |
| `principal`      | Principal       | `/staff/principal` |
| `class.teacher`  | Class Teacher   | `/staff/class-teacher` |
| `subject.teacher`| Subject Teacher | `/staff/subject-teacher` |
| `student`        | Student         | `/student`      |
| `accountant`     | Accountant      | `/accountant`   |

The login page includes a one-click **demo account switcher** so you can jump
between roles without typing.

---

## The five portals

1. **Chairman Portal** — institutional overview, student management, staff
   (read-only), departments & courses, attendance analytics, academic
   performance, examination reports, fee overview, notices, timetable, events,
   library, feedback, institutional reports, AI assistant, help desk, settings.
2. **Director Portal** — statistics-first variant of the Chairman portal plus
   faculty overview, department analytics and academic reports (can manage
   staff and academics).
3. **Staff Portal** — three views:
   - **Principal** — teacher management, class-teacher assignment, subject
     allocations, directory, attendance, approvals, reports.
   - **Class Teacher** — their own class: students, attendance, marks,
     e-content, event approvals, notices.
   - **Subject Teacher** — class session, attendance, marks entry, e-content,
     student details.
4. **Student Portal** — attendance, subjects, e-content, timetable,
   examinations, notices, events (create + track), library, fees & receipts,
   help desk, feedback.
5. **Accountant Portal** — student search, create fee receipt, receipt history.

---

## Feature workflows (all simulated, all persistent)

- **Attendance** — daily session per class/subject, present/absent toggle,
  replace-or-block duplicate sessions, analytics views.
- **Marks** — entry within `0..maxMarks`, publish flow, per-student results.
- **Events** — student creates an event → class teacher approves → it appears
  in the public events directory (pending events stay private).
- **Fees & receipts** — accountant issues a receipt (duplicate references are
  rejected), student sees the receipt instantly with a printable preview.
- **E-content** — upload/register PDFs and notes, download counters.
- **Help desk** — tickets with an automatic developer acknowledgement reply
  and threaded follow-ups.
- **Notices, timetable, library, feedback, reports, AI assistant** — all
  working against the same seeded store.

A 22-step guided presentation flow works end-to-end (Chairman → student
inspection with reason → AI assistant → Director → Principal creates a teacher
and assigns a class teacher → Subject Teacher marks attendance, uploads
e-content and enters marks → Student creates an event → Class Teacher
approves → Student sees the approved event → Accountant issues a receipt →
Student sees the receipt).

---

## Architecture

```
src/
  components/
    common/        Reusable UI kit (Button, Card, DataTable, Modal, Form, …)
    modules/       Shared feature modules composed by the role pages
    layout/        Sidebar, Topbar, DemoSwitcher
  data/
    constants/     Verified institution facts & programmes
    mock/seed.ts   Deterministic seed data (students, staff, exams, …)
  layouts/         DashboardLayout + PortalGate
  pages/           Login + one folder per portal
  routes/          Navigation, permission table, Guard
  store/           DemoStore (state + actions), auth, theme/toast, selectors
  types/           Shared domain types
```

- **Stack**: React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 ·
  lucide-react · recharts · react-router-dom 7 · immer
- **State**: one central `DemoStore` persisted to `localStorage`
  (`pmei.demo.state.v1`). Use **Settings → Reset Demo Data** to restore the
  seed at any time.
- **Permissions**: prototype-only role → capability table in
  `src/routes/permissions.ts`, enforced by `<Guard>` / `<PortalGate>` on the
  client. Real authorisation must be server-side before any production use.
- **Theme**: light by default, dark mode toggle in the top bar (respects the
  system preference on first load).

## Institutional facts

Source: the official website, <https://pmeinursingcollege.com/> (scraped for
this demo). Programmes shown are only the ones published there: **ANM** (2 yr),
**GNM** (3 yr) and **B.Sc Nursing** (4 yr). Anything not published on the
official website is labelled as such. The logo is the official asset — it is
not invented. Leadership: Chairman Mr. Akhtarul Islam Shahin, Director
Md. Sharif Alam Usmani, Principal Mr. Sayuj Kumar Biswas.

---

## Disclaimer

This is a non-production demonstration. "Payments", receipts, emails, SMS and
approvals are all simulated locally and never leave the browser. Do not enter
real personal or financial data.
