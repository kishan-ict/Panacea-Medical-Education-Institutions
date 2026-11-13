import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { TimetableModule } from '@/components/modules/TimetableModule'

export default function TimetablePage() {
  return (
    <Guard permission="timetable.view">
      <>
        <PageHeader
          title="Timetable Overview"
          description="Master timetable for every class — periods, subjects, teachers and rooms for the current week."
        />
        <TimetableModule />
      </>
    </Guard>
  )
}
