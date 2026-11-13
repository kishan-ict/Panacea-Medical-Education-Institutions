import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { SettingsModule } from '@/components/modules/SettingsModule'

export default function SettingsPage() {
  return (
    <Guard permission="settings.manage">
      <>
        <PageHeader
          title="Settings"
          description="Account profile, demonstration controls, audit activity and session options for the Chairman portal."
        />
        <SettingsModule />
      </>
    </Guard>
  )
}
