import { Link, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/common/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <AuthLayout>
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-muted text-ink3">
          <Compass className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink3">404</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">This page is not part of the demo</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-ink2">
          The address you followed does not correspond to a screen in the PMEl Login demonstration.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button onClick={() => navigate(-1)}>Go back</Button>
          <Link to="/login">
            <Button variant="secondary">Open login</Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default NotFoundPage
