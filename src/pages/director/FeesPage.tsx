import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { FeeOverviewModule } from '@/components/modules/FeeOverviewModule'

export default function FeesPage() {
  return (
    <Guard permission="fees.overview">
      <>
        <PageHeader
          title="Fee Overview"
          description="Institutional fee collection, outstanding demand and the monthly receipt trend — read-only for the Director portal."
        />
        <FeeOverviewModule />
      </>
    </Guard>
  )
}
