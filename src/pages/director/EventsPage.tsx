import { PageHeader } from '@/components/common/PageHeader'
import { EventsModule } from '@/components/modules/EventsModule'

export default function EventsPage() {
  return (
    <>
      <PageHeader
        title="Events & Clubs"
        description="Institutional event directory, proposals submitted for review and club activities across the campus."
      />
      <EventsModule mode="institution" />
    </>
  )
}
