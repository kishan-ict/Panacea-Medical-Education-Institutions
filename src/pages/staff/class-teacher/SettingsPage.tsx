import { PageHeader } from '@/components/common/PageHeader'
import { SettingsModule } from '@/components/modules/SettingsModule'

/** Class teacher portal settings. */
export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Profile and session settings for your staff account."
      />
      <SettingsModule />
    </>
  )
}
