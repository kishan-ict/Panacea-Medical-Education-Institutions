import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { SettingsModule } from '@/components/modules/SettingsModule'

export default function SettingsPage() {
  return (
    <Guard permission="settings.manage">
      <>
        <PageHeader
          title="Settings"
          description="Portal preferences, demonstration controls and the activity log for this account."
        />
        <SettingsModule />
      </>
    </Guard>
  )
}
