import { LibraryModule } from '@/components/modules/LibraryModule'
import { useAuth } from '@/store/auth'
export default function LibraryPage(){ const {session}=useAuth(); return <LibraryModule scope="student" studentId={session?.linkedId??undefined} /> }
