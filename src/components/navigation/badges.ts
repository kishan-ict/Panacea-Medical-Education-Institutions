import { useMemo } from 'react'
import { useDemo } from '@/store/DemoStore'
import {
  classTeacherOf,
  openTickets,
  pendingEventApprovals,
  pendingMarks,
  recentNoticeCount,
  unassignedClasses,
} from '@/store/selectors'
import type { Role } from '@/types'

export interface NavBadges {
  pendingEvents?: number
  openTickets?: number
  unreadNotices?: number
  unassignedClasses?: number
  pendingMarks?: number
}

export function useNavBadges(role: Role, linkedId: string | null): NavBadges {
  const { state } = useDemo()

  return useMemo(() => {
    const badges: NavBadges = {}

    if (role === 'classTeacher') {
      const cls = linkedId ? classTeacherOf(state, linkedId) : undefined
      badges.pendingEvents = cls ? pendingEventApprovals(state, [cls.id]).length : 0
      badges.pendingMarks = linkedId ? pendingMarks(state, linkedId) : 0
    } else if (role === 'subjectTeacher') {
      badges.pendingEvents = 0
      badges.pendingMarks = linkedId ? pendingMarks(state, linkedId) : 0
    } else if (role === 'principal') {
      badges.pendingEvents = pendingEventApprovals(state).length
      badges.unassignedClasses = unassignedClasses(state).length
    } else if (role === 'chairman' || role === 'director') {
      badges.pendingEvents = pendingEventApprovals(state).length
    }

    badges.openTickets = openTickets(state)
    badges.unreadNotices = recentNoticeCount(state, 7)

    return badges
  }, [state, role, linkedId])
}
