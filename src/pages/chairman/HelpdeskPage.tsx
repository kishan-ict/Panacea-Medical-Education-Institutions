import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { HelpDeskModule } from '@/components/modules/HelpDeskModule'

export default function HelpdeskPage() {
  return (
    <Guard permission="tickets.view">
      <>
        <PageHeader
          title="Developer Help Desk"
          description="Tickets raised across the prototype — track, reply and follow their resolution status."
        />
        <HelpDeskModule scope="institution" />
      </>
    </Guard>
  )
}
