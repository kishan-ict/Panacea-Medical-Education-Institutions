import { DemoTag } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { SettingsModule } from '@/components/modules/SettingsModule'

/**
 * Profile & preferences. No `Guard`: subject-teacher holds no
 * `settings.manage` permission — this scope stays read-only, and the
 * module itself only exposes actions the signed-in role can perform.
 */
export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile and personal preferences."
        actions={<DemoTag />}
      />
      <SettingsModule />
    </>
  )
}
