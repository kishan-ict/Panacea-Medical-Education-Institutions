import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/common/Badge'
import { Guard } from '@/routes/Guard'
import { NoticesModule } from '@/components/modules/NoticesModule'

export default function NoticesPage() {
  return (
    <Guard permission="notices.view">
      <>
        <PageHeader
          title="Notices"
          description="Publish and manage institutional circulars for programmes, classes and examination audiences."
          actions={<Badge tone="brand">You can create notices</Badge>}
        />
        <NoticesModule mode="manage" />
      </>
    </Guard>
  )
}
