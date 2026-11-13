import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Info,
  Palette,
  RotateCcw,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useDemo } from '@/store/DemoStore'
import { useAuth } from '@/store/auth'
import { useConfirm, useTheme, useToast } from '@/store/ui'
import { ROLE_PERMISSIONS, type Permission } from '@/routes/permissions'
import { DEMO_ACCOUNTS, DEMO_HINT } from '@/data/constants/accounts'
import { INSTITUTION, NOT_PUBLISHED, PROGRAMMES } from '@/data/constants/institution'
import { formatDateTime } from '@/utils/format'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader, KeyValue } from '@/components/common/Card'
import { DemoTag, EmptyState } from '@/components/common/EmptyState'
import { Switch } from '@/components/common/Form'

/** Human-readable label for every permission value in the prototype map. */
const PERMISSION_LABELS: Record<Permission, string> = {
  'institutional.overview': 'Institutional overview',
  'students.directory': 'Student directory',
  'students.insight': 'Student insight',
  'students.finance': 'Student finance files',
  'staff.view': 'View staff',
  'staff.manage': 'Manage staff',
  'staff.assign': 'Assign class teachers',
  'academics.manage': 'Manage academics',
  'attendance.mark': 'Mark attendance',
  'attendance.analytics': 'Attendance analytics',
  'marks.enter': 'Enter marks',
  'marks.publish': 'Publish marks',
  'events.create': 'Create events',
  'events.approve': 'Approve events',
  'econtent.manage': 'Manage study material',
  'fees.overview': 'Fee overview',
  'fees.receipt.create': 'Create receipts',
  'fees.own': 'Own fee records',
  'notices.create': 'Publish notices',
  'notices.view': 'View notices',
  'library.view': 'View library',
  'library.manage': 'Manage library',
  'timetable.view': 'View timetable',
  'reports.view': 'View reports',
  'assistant.use': 'Use the assistant',
  'tickets.create': 'Raise support tickets',
  'tickets.view': 'View support tickets',
  'feedback.view': 'View feedback',
  'feedback.submit': 'Submit feedback',
  'settings.manage': 'Manage settings',
  'audit.view': 'View audit activity',
}

const ROLE_NOTE: Record<string, string> = {
  chairman: 'Institutional oversight and governed access.',
  director: 'Institutional management with staff and academic administration.',
  principal: 'Academic administration, approvals and allocations.',
  classTeacher: 'Own class teaching, approvals and attendance.',
  subjectTeacher: 'Assigned subjects, attendance and marks entry.',
  student: 'Own academic record, events and feedback.',
  accountant: 'Fee collection, receipts and financial overview.',
}

export function SettingsModule() {
  const { state, actions } = useDemo()
  const { session } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const confirm = useConfirm()

  if (!session) {
    return (
      <EmptyState
        icon={User}
        title="No active session"
        description="Sign in to a demonstration account to review its settings."
      />
    )
  }

  const account = DEMO_ACCOUNTS.find((row) => row.id === session.accountId)
  const permissions = ROLE_PERMISSIONS[session.role]

  const resetDemo = async () => {
    const confirmed = await confirm({
      title: 'Reset demonstration data?',
      description:
        'Every change you made in this browser — notices, marks, receipts, feedback and events — will be replaced with the original seeded dataset.',
      confirmLabel: 'Reset demo data',
      tone: 'danger',
    })
    if (!confirmed) return
    actions.resetDemo()
    toast.success('Demonstration data reset', 'The original seeded dataset has been restored on this device.')
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold text-ink">Settings</h2>
          <Badge tone="brand">{session.title}</Badge>
        </div>
        <p className="mt-0.5 text-[13px] text-ink2">
          Account, appearance and prototype permissions for the signed-in demonstration session.
        </p>
      </div>

      {/* ------------------------------ account ------------------------------ */}
      <Card>
        <CardHeader title="Account" icon={<User className="h-4 w-4" />} />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={session.displayName} size="lg" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-ink">{session.displayName}</p>
              <p className="text-[13px] text-ink2">{session.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone="brand">{session.portal} portal</Badge>
                <Badge tone="info">{ROLE_NOTE[session.role] ?? session.role}</Badge>
              </div>
            </div>
          </div>
          <div className="divide-y divide-line border-t border-line pt-1">
            <KeyValue label="Signed in since" value={formatDateTime(session.signedInAt)} />
            <KeyValue
              label="Demonstration username"
              value={<code className="rounded bg-muted px-1.5 py-0.5 text-[12px]">{account?.username ?? '—'}</code>}
            />
            <KeyValue
              label="Password"
              value={
                <span className="inline-flex items-center gap-2">
                  <Badge tone="warn">{account?.password ?? 'demo1234'}</Badge>
                </span>
              }
            />
            <KeyValue label="Account ID" value={session.accountId} />
          </div>
          <p className="text-xs text-ink3">{DEMO_HINT}</p>
        </CardBody>
      </Card>

      {/* ---------------------------- appearance ----------------------------- */}
      <Card>
        <CardHeader title="Appearance" icon={<Palette className="h-4 w-4" />} />
        <CardBody className="space-y-3">
          <Switch
            checked={theme === 'dark'}
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            label={`Dark mode — currently ${theme === 'dark' ? 'Dark' : 'Light'}`}
            description="Switches the whole platform between the light and dark presentation themes. The choice is stored on this device."
          />
          <div className="flex gap-2">
            <Badge tone={theme === 'light' ? 'brand' : 'neutral'}>Light</Badge>
            <Badge tone={theme === 'dark' ? 'brand' : 'neutral'}>Dark</Badge>
          </div>
        </CardBody>
      </Card>

      {/* ---------------------------- permissions ---------------------------- */}
      <Card>
        <CardHeader
          title="Permissions for this role"
          description={`${permissions.length} prototype capabilities mapped to the ${session.title} role.`}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <span key={permission} title={permission}>
                <Badge tone="outline">{PERMISSION_LABELS[permission]}</Badge>
              </span>
            ))}
          </div>
          <p className="flex items-start gap-2 rounded-lg border border-line bg-muted px-3 py-2.5 text-xs leading-5 text-ink2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink3" />
            These permissions are prototype-only, client-side capabilities used to shape the demonstration interface.
            Real authorisation must be enforced server-side before any production use.
          </p>
        </CardBody>
      </Card>

      {/* ------------------------ demonstration data ------------------------- */}
      <Card>
        <CardHeader
          title="Demonstration data"
          description="Everything on this platform is simulated sample data stored in your browser."
          action={<DemoTag />}
        />
        <CardBody className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-muted px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Students</p>
              <p className="mt-1 font-display text-lg font-bold text-ink tabular-nums">{state.students.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-muted px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Notices</p>
              <p className="mt-1 font-display text-lg font-bold text-ink tabular-nums">{state.notices.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-muted px-3.5 py-3">
              <p className="text-[11px] uppercase tracking-wide text-ink3">Receipts</p>
              <p className="mt-1 font-display text-lg font-bold text-ink tabular-nums">{state.receipts.length}</p>
            </div>
          </div>
          <p className="text-[13px] leading-6 text-ink2">
            Resetting restores the original seeded dataset and clears every local change you have made — notices,
            marks, receipts, feedback, events and audit entries included.
          </p>
          <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => void resetDemo()}>
            Reset demo data
          </Button>
        </CardBody>
      </Card>

      {/* --------------------- institutional information --------------------- */}
      <Card>
        <CardHeader
          title="Institutional information"
          description="Source: pmeinursingcollege.com — official published facts only."
          icon={<Building2 className="h-4 w-4" />}
        />
        <CardBody className="space-y-3">
          <div className="divide-y divide-line border-b border-line">
            <KeyValue label="Institution" value={INSTITUTION.name} />
            <KeyValue label="Address" value={INSTITUTION.address} />
            <KeyValue label="Phone" value={INSTITUTION.phone} />
            <KeyValue label="E-mail" value={INSTITUTION.email} />
            <KeyValue
              label="Website"
              value={
                <a
                  href={INSTITUTION.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-royal transition hover:underline"
                >
                  pmeinursingcollege.com
                </a>
              }
            />
            <KeyValue label="Established" value={INSTITUTION.established} />
            <KeyValue label="Approval body" value={INSTITUTION.approval} />
            <KeyValue label="Affiliated university" value={NOT_PUBLISHED} />
            <KeyValue label="Hostel & transport" value={NOT_PUBLISHED} />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink3">Programmes offered</p>
          <ul className="space-y-2">
            {PROGRAMMES.map((programme) => (
              <li
                key={programme.code}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{programme.name}</p>
                  <p className="mt-0.5 text-[11px] text-ink3">
                    {programme.level} · {programme.eligibility}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-ink">{programme.duration}</p>
                  <p className="text-[11px] text-ink3">{programme.seats} seats</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xs leading-5 text-ink3">
            Institutional facts are referenced from {INSTITUTION.website}. Fields the official website does not
            publish are marked “{NOT_PUBLISHED}”.
          </p>
        </CardBody>
      </Card>

      {/* ------------------------------ policy ------------------------------- */}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">Privacy &amp; data</p>
            <p className="mt-0.5 text-xs text-ink2">How simulated records are stored, used and cleared on this device.</p>
          </div>
          <Link
            to="/privacy"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-royal transition hover:bg-muted"
          >
            Demonstration data policy
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardBody>
      </Card>
    </div>
  )
}

export default SettingsModule
