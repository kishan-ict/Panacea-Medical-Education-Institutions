import { PageHeader } from '@/components/common/PageHeader'
import { Guard } from '@/routes/Guard'
import { TimetableModule } from '@/components/modules/TimetableModule'

export default function TimetablePage() {
  return (
    <Guard permission="timetable.view">
      <>
        <PageHeader
          title="Timetable"
          description="Weekly teaching grid for every class — six periods, Monday to Saturday, with today's schedule highlighted."
        />
        <TimetableModule />
      </>
    </Guard>
  )
}
