import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { NoticesModule } from '@/components/modules/NoticesModule'

export default function NoticesPage() {
  return (
    <Guard permission="notices.view">
      <>
        <PageHeader
          title="Notices"
          description="Publish, pin and retire institutional circulars for the selected audience. Your account holds notices.create, so new notices can be issued from this portal."
        />
        <NoticesModule mode="manage" />
      </>
    </Guard>
  )
}
