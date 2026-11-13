import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { FeedbackModule } from '@/components/modules/FeedbackModule'

export default function FeedbackPage() {
  return (
    <Guard permission="feedback.view">
      <>
        <PageHeader
          title="Feedback"
          description="Ratings and comments submitted by students and staff across the demonstration dataset."
        />
        <FeedbackModule canView />
      </>
    </Guard>
  )
}
