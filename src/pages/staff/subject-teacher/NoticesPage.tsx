import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoTag } from '@/components/common/EmptyState'
import { NoticesModule } from '@/components/modules/NoticesModule'

/**
 * Notices for this role. No audience filter — `NoticesModule` always
 * resolves visibility through `noticesFor`, so only circulars addressed
 * to subject teachers are ever shown.
 */
export default function NoticesPage() {
  return (
    <Guard permission="notices.view">
      <>
        <PageHeader
          title="Notices"
          description="Circulars and announcements relevant to your teaching role."
          actions={<DemoTag />}
        />
        <NoticesModule mode="view" />
      </>
    </Guard>
  )
}
