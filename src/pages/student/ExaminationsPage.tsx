import { MarksModule } from '@/components/modules/MarksModule'
import { useAuth } from '@/store/auth'
export default function ExaminationsPage(){ const {session}=useAuth(); return <MarksModule mode="student" studentId={session?.linkedId??undefined} /> }
