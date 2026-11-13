import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { LibraryModule } from '@/components/modules/LibraryModule'

export default function LibraryPage() {
  return (
    <Guard permission="library.view">
      <>
        <PageHeader
          title="Library"
          description="Institutional catalogue and circulating loan register — titles, availability, active loans and overdue returns."
        />
        <LibraryModule scope="institution" />
      </>
    </Guard>
  )
}
