import { Guard } from '@/routes/Guard'
import { NoticesModule } from '@/components/modules/NoticesModule'

/** Read-only institutional notice board for the accountant portal. */
export default function NoticesPage() {
  return (
    <Guard permission="notices.view">
      <NoticesModule mode="view" />
    </Guard>
  )
}
