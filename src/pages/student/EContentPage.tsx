import { EContentModule } from '@/components/modules/EContentModule'
import { useAuth } from '@/store/auth'

export default function EContentPage() {
  const { session } = useAuth()
  return <EContentModule mode="browse" studentId={session?.linkedId ?? undefined} />
}
