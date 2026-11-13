import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { DISCLAIMER, INSTITUTION } from '@/data/constants/institution'

const POINTS: [string, string][] = [
  ['Demonstration dataset only', 'Every student, teacher, fee, receipt, event, notice and support ticket inside PMEl Login is fictional sample data created for product evaluation.'],
  ['No backend services', 'This prototype does not connect to Supabase, PostgreSQL, payment gateways, e-mail or SMS providers. State is held in your browser using localStorage.'],
  ['No real authentication', 'Demo accounts and role switching simulate access boundaries for presentation purposes. Production authorisation must be implemented server-side.'],
  ['Official information source', `Institutional identity, programme details and published academic information are referenced only from ${INSTITUTION.website}`],
  ['Access logging simulation', 'Where an authorised officer opens an identifiable student record, a simulated audit entry is recorded in the activity log to demonstrate governed access.'],
  ['Reset at any time', 'Settings → Reset demonstration data restores the original seeded dataset and clears local changes.'],
]

export function PrivacyPage() {
  return (
    <AuthLayout>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-ink">Demonstration data policy</h1>
            <p className="mt-1 text-[13px] leading-6 text-ink2">
              {DISCLAIMER.body}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader title="How this prototype handles information" />
          <CardBody className="divide-y divide-line">
            {POINTS.map(([title, body]) => (
              <div key={title} className="py-3 first:pt-0 last:pb-0">
                <p className="text-[13px] font-semibold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-5 text-ink2">{body}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Link to="/login" className="inline-block text-[13px] font-medium text-royal hover:underline">
          ← Back to PMEl Login
        </Link>
      </div>
    </AuthLayout>
  )
}

export default PrivacyPage
