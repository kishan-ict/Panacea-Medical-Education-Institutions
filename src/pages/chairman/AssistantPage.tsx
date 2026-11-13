import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { AssistantModule } from '@/components/modules/AssistantModule'

export default function AssistantPage() {
  return (
    <Guard permission="assistant.use">
      <>
        <PageHeader
          title="AI Institutional Assistant"
          description="Ask questions about students, attendance, examinations and fees — answered from the demonstration dataset only."
        />
        <AssistantModule />
      </>
    </Guard>
  )
}
