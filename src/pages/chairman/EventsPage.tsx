import { PageHeader } from '@/components/common/PageHeader'
import { EventsModule } from '@/components/modules/EventsModule'

export default function EventsPage() {
  return (
    <>
      <PageHeader
        title="Events & Clubs"
        description="Institution-wide calendar of approved events, pending submissions awaiting approval and participation."
      />
      <EventsModule mode="institution" />
    </>
  )
}
