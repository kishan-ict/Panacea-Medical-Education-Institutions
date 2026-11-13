import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { LibraryModule } from '@/components/modules/LibraryModule'

export default function LibraryPage() {
  return (
    <Guard permission="library.view">
      <>
        <PageHeader
          title="Library Overview"
          description="Catalogue, circulation and overdue titles across the institutional library for the current session."
        />
        <LibraryModule scope="institution" />
      </>
    </Guard>
  )
}
