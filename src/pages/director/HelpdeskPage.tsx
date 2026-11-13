import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { HelpDeskModule } from '@/components/modules/HelpDeskModule'

export default function HelpdeskPage() {
  return (
    <Guard permission="tickets.view">
      <>
        <PageHeader
          title="Developer Help Desk"
          description="Institution-wide support queue — review every ticket raised against the prototype, reply to users and update ticket status."
        />
        <HelpDeskModule scope="institution" />
      </>
    </Guard>
  )
}
