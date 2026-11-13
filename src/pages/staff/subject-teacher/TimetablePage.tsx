import { Guard } from '@/routes/Guard'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoTag } from '@/components/common/EmptyState'
import { TimetableModule } from '@/components/modules/TimetableModule'
import { useAuth } from '@/store/auth'

/** This teacher's period timetable across allocated classes. */
export default function TimetablePage() {
  const { session } = useAuth()

  return (
    <Guard permission="timetable.view">
      <>
        <PageHeader
          title="Timetable"
          description="Your period allotments across the classes you teach."
          actions={<DemoTag />}
        />
        <TimetableModule teacherId={session?.linkedId ?? undefined} showClassPicker={false} />
      </>
    </Guard>
  )
}
