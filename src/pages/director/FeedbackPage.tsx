import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { FeedbackModule } from '@/components/modules/FeedbackModule'

export default function FeedbackPage() {
  return (
    <Guard permission="feedback.view">
      <>
        <PageHeader
          title="Feedback"
          description="Submit feedback on the demonstration platform and review the institutional aggregate across all responses."
        />
        <FeedbackModule canView />
      </>
    </Guard>
  )
}
