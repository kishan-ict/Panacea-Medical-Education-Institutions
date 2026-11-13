import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { FeeOverviewModule } from '@/components/modules/FeeOverviewModule'

export default function FeesPage() {
  return (
    <Guard permission="fees.overview">
      <>
        <PageHeader
          title="Fee Overview"
          description="Institutional demand, collection and outstanding balances across programmes — read-only for the Chairman."
        />
        <FeeOverviewModule />
      </>
    </Guard>
  )
}
