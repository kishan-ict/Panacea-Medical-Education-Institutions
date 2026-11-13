import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { EventsModule } from '@/components/modules/EventsModule'

export default function EventsPage() {
  return (
    <Guard permission="events.approve">
      <>
        <PageHeader
          title="Event Approvals"
          description="Review student and club event submissions, record an approval decision with a note, and keep an auditable trail of every outcome."
        />
        <EventsModule mode="review" />
      </>
    </Guard>
  )
}
