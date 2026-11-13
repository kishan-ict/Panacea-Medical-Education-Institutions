import { Guard } from '@/routes/Guard'
import { useAuth } from '@/store/auth'
import { useDemo } from '@/store/DemoStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { subjectsOfClass } from '@/store/selectors'
import { DemoTag } from '@/components/common/EmptyState'
export default function SubjectsPage(){
  const {state}=useDemo(); const {session}=useAuth();
  const sid=session?.linkedId??''; const cls=state.students.find(s=>s.id===sid)?.classId??'';
  const subjects=subjectsOfClass(state,cls);
  return <Guard permission="students.insight"><div className="space-y-6"><PageHeader title="Subjects" description="Subjects for your class." actions={<DemoTag/>} /><Card><CardBody><ul className="space-y-2">{subjects.map(s=><li key={s.id} className="rounded-lg border border-line p-3"><div className="font-medium text-ink">{s.name}</div><div className="text-sm text-ink2">{s.code}</div></li>)}</ul></CardBody></Card></div></Guard>
}
