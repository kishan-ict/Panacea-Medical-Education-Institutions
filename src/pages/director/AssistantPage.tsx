import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { AssistantModule } from '@/components/modules/AssistantModule'

export default function AssistantPage() {
  return (
    <Guard permission="assistant.use">
      <>
        <PageHeader
          title="AI Institutional Assistant"
          description="Ask questions across the demonstration dataset — answers are simulated locally and never query live records or external services."
        />
        <AssistantModule />
      </>
    </Guard>
  )
}
