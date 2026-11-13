import { SettingsModule } from '@/components/modules/SettingsModule'

/**
 * Accountant settings — no permission guard here: the accountant role has no
 * `settings.manage` capability, and PortalGate already role-gates the route.
 */
export default function SettingsPage() {
  return <SettingsModule />
}
