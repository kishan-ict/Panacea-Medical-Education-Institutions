import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { TimetableModule } from '@/components/modules/TimetableModule'

export default function TimetablePage() {
  return (
    <Guard permission="timetable.view">
      <>
        <PageHeader
          title="Timetable Overview"
          description="Weekly teaching grid for every class — pick a class to review periods, subjects and the teachers timetabled against them."
        />
        <TimetableModule />
      </>
    </Guard>
  )
}
