import { StudentFeesModule } from '@/components/modules/StudentFeesModule'
import { useAuth } from '@/store/auth'
export default function FeesPage(){ const {session}=useAuth(); return <StudentFeesModule studentId={session?.linkedId??''} /> }
