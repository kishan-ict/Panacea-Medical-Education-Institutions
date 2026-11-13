import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout, PortalGate } from '@/layouts/DashboardLayout'
import { Guard, PublicOnly } from '@/routes/Guard'
import { ROOTS } from '@/routes/navigation'
import LoginPage from '@/pages/auth/LoginPage'
import PrivacyPage from '@/pages/PrivacyPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Chairman
import ChairmanOverview from '@/pages/chairman/OverviewPage'
import ChairmanStudents from '@/pages/chairman/StudentsPage'
import ChairmanStaff from '@/pages/chairman/StaffPage'
import ChairmanDepartments from '@/pages/chairman/DepartmentsPage'
import ChairmanAttendance from '@/pages/chairman/AttendancePage'
import ChairmanPerformance from '@/pages/chairman/PerformancePage'
import ChairmanExaminations from '@/pages/chairman/ExaminationsPage'
import ChairmanFees from '@/pages/chairman/FeesPage'
import ChairmanNotices from '@/pages/chairman/NoticesPage'
import ChairmanTimetable from '@/pages/chairman/TimetablePage'
import ChairmanEvents from '@/pages/chairman/EventsPage'
import ChairmanLibrary from '@/pages/chairman/LibraryPage'
import ChairmanFeedback from '@/pages/chairman/FeedbackPage'
import ChairmanReports from '@/pages/chairman/ReportsPage'
import ChairmanAssistant from '@/pages/chairman/AssistantPage'
import ChairmanHelpdesk from '@/pages/chairman/HelpdeskPage'
import ChairmanSettings from '@/pages/chairman/SettingsPage'

// Director
import DirectorOverview from '@/pages/director/OverviewPage'
import DirectorStudents from '@/pages/director/StudentsPage'
import DirectorFaculty from '@/pages/director/FacultyPage'
import DirectorDepartments from '@/pages/director/DepartmentsPage'
import DirectorAttendance from '@/pages/director/AttendancePage'
import DirectorAcademics from '@/pages/director/AcademicsPage'
import DirectorExaminations from '@/pages/director/ExaminationsPage'
import DirectorFees from '@/pages/director/FeesPage'
import DirectorTimetable from '@/pages/director/TimetablePage'
import DirectorNotices from '@/pages/director/NoticesPage'
import DirectorEvents from '@/pages/director/EventsPage'
import DirectorFeedback from '@/pages/director/FeedbackPage'
import DirectorReports from '@/pages/director/ReportsPage'
import DirectorAssistant from '@/pages/director/AssistantPage'
import DirectorHelpdesk from '@/pages/director/HelpdeskPage'
import DirectorSettings from '@/pages/director/SettingsPage'

// Principal
import PrincipalOverview from '@/pages/staff/principal/OverviewPage'
import PrincipalTeachers from '@/pages/staff/principal/TeachersPage'
import PrincipalClassAssignment from '@/pages/staff/principal/ClassAssignmentPage'
import PrincipalSubjectAssignment from '@/pages/staff/principal/SubjectAssignmentPage'
import PrincipalStudents from '@/pages/staff/principal/StudentsPage'
import PrincipalAttendance from '@/pages/staff/principal/AttendancePage'
import PrincipalTimetable from '@/pages/staff/principal/TimetablePage'
import PrincipalNotices from '@/pages/staff/principal/NoticesPage'
import PrincipalEvents from '@/pages/staff/principal/EventsPage'
import PrincipalLibrary from '@/pages/staff/principal/LibraryPage'
import PrincipalReports from '@/pages/staff/principal/ReportsPage'
import PrincipalSettings from '@/pages/staff/principal/SettingsPage'

// Class Teacher
import ClassTeacherOverview from '@/pages/staff/class-teacher/OverviewPage'
import ClassTeacherStudents from '@/pages/staff/class-teacher/StudentsPage'
import ClassTeacherSubjects from '@/pages/staff/class-teacher/SubjectsPage'
import ClassTeacherAttendance from '@/pages/staff/class-teacher/AttendancePage'
import ClassTeacherMarks from '@/pages/staff/class-teacher/MarksPage'
import ClassTeacherEContent from '@/pages/staff/class-teacher/EContentPage'
import ClassTeacherEvents from '@/pages/staff/class-teacher/EventsPage'
import ClassTeacherTimetable from '@/pages/staff/class-teacher/TimetablePage'
import ClassTeacherNotices from '@/pages/staff/class-teacher/NoticesPage'
import ClassTeacherSettings from '@/pages/staff/class-teacher/SettingsPage'

// Subject Teacher
import SubjectTeacherOverview from '@/pages/staff/subject-teacher/OverviewPage'
import SubjectTeacherSession from '@/pages/staff/subject-teacher/SessionPage'
import SubjectTeacherAttendance from '@/pages/staff/subject-teacher/AttendancePage'
import SubjectTeacherMarks from '@/pages/staff/subject-teacher/MarksPage'
import SubjectTeacherEContent from '@/pages/staff/subject-teacher/EContentPage'
import SubjectTeacherStudents from '@/pages/staff/subject-teacher/StudentsPage'
import SubjectTeacherTimetable from '@/pages/staff/subject-teacher/TimetablePage'
import SubjectTeacherNotices from '@/pages/staff/subject-teacher/NoticesPage'
import SubjectTeacherSettings from '@/pages/staff/subject-teacher/SettingsPage'

// Student
import StudentOverview from '@/pages/student/OverviewPage'
import StudentAttendance from '@/pages/student/AttendancePage'
import StudentSubjects from '@/pages/student/SubjectsPage'
import StudentEContent from '@/pages/student/EContentPage'
import StudentTimetable from '@/pages/student/TimetablePage'
import StudentExaminations from '@/pages/student/ExaminationsPage'
import StudentNotices from '@/pages/student/NoticesPage'
import StudentEvents from '@/pages/student/EventsPage'
import StudentLibrary from '@/pages/student/LibraryPage'
import StudentFees from '@/pages/student/FeesPage'
import StudentHelpdesk from '@/pages/student/HelpdeskPage'
import StudentFeedback from '@/pages/student/FeedbackPage'
import StudentSettings from '@/pages/student/SettingsPage'

// Accountant
import AccountantOverview from '@/pages/accountant/OverviewPage'
import AccountantStudents from '@/pages/accountant/StudentsPage'
import AccountantNewReceipt from '@/pages/accountant/NewReceiptPage'
import AccountantReceipts from '@/pages/accountant/ReceiptsPage'
import AccountantNotices from '@/pages/accountant/NoticesPage'
import AccountantSettings from '@/pages/accountant/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Chairman */}
      <Route element={<DashboardLayout role="chairman" />}>
        <Route path={ROOTS.chairman} element={<PortalGate role="chairman" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Guard permission="institutional.overview"><ChairmanOverview /></Guard>} />
          <Route path="students" element={<Guard permission="students.directory"><ChairmanStudents /></Guard>} />
          <Route path="staff" element={<Guard permission="staff.view"><ChairmanStaff /></Guard>} />
          <Route path="departments" element={<Guard permission="staff.view"><ChairmanDepartments /></Guard>} />
          <Route path="attendance" element={<Guard permission="attendance.analytics"><ChairmanAttendance /></Guard>} />
          <Route path="performance" element={<Guard permission="reports.view"><ChairmanPerformance /></Guard>} />
          <Route path="examinations" element={<Guard permission="reports.view"><ChairmanExaminations /></Guard>} />
          <Route path="fees" element={<Guard permission="fees.overview"><ChairmanFees /></Guard>} />
          <Route path="notices" element={<Guard permission="notices.view"><ChairmanNotices /></Guard>} />
          <Route path="timetable" element={<Guard permission="timetable.view"><ChairmanTimetable /></Guard>} />
          <Route path="events" element={<ChairmanEvents />} />
          <Route path="library" element={<Guard permission="library.view"><ChairmanLibrary /></Guard>} />
          <Route path="feedback" element={<Guard permission="feedback.view"><ChairmanFeedback /></Guard>} />
          <Route path="reports" element={<Guard permission="reports.view"><ChairmanReports /></Guard>} />
          <Route path="assistant" element={<Guard permission="assistant.use"><ChairmanAssistant /></Guard>} />
          <Route path="helpdesk" element={<Guard permission="tickets.view"><ChairmanHelpdesk /></Guard>} />
          <Route path="settings" element={<Guard permission="settings.manage"><ChairmanSettings /></Guard>} />
        </Route>
      </Route>

      {/* Director */}
      <Route element={<DashboardLayout role="director" />}>
        <Route path={ROOTS.director} element={<PortalGate role="director" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Guard permission="institutional.overview"><DirectorOverview /></Guard>} />
          <Route path="students" element={<Guard permission="students.directory"><DirectorStudents /></Guard>} />
          <Route path="faculty" element={<Guard permission="staff.view"><DirectorFaculty /></Guard>} />
          <Route path="departments" element={<Guard permission="staff.view"><DirectorDepartments /></Guard>} />
          <Route path="attendance" element={<Guard permission="attendance.analytics"><DirectorAttendance /></Guard>} />
          <Route path="academics" element={<Guard permission="reports.view"><DirectorAcademics /></Guard>} />
          <Route path="examinations" element={<Guard permission="reports.view"><DirectorExaminations /></Guard>} />
          <Route path="fees" element={<Guard permission="fees.overview"><DirectorFees /></Guard>} />
          <Route path="timetable" element={<Guard permission="timetable.view"><DirectorTimetable /></Guard>} />
          <Route path="notices" element={<Guard permission="notices.view"><DirectorNotices /></Guard>} />
          <Route path="events" element={<DirectorEvents />} />
          <Route path="feedback" element={<Guard permission="feedback.view"><DirectorFeedback /></Guard>} />
          <Route path="reports" element={<Guard permission="reports.view"><DirectorReports /></Guard>} />
          <Route path="assistant" element={<Guard permission="assistant.use"><DirectorAssistant /></Guard>} />
          <Route path="helpdesk" element={<Guard permission="tickets.view"><DirectorHelpdesk /></Guard>} />
          <Route path="settings" element={<Guard permission="settings.manage"><DirectorSettings /></Guard>} />
        </Route>
      </Route>

      {/* Principal */}
      <Route element={<DashboardLayout role="principal" />}>
        <Route path={ROOTS.principal} element={<PortalGate role="principal" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Guard permission="institutional.overview"><PrincipalOverview /></Guard>} />
          <Route path="teachers" element={<Guard permission="staff.manage"><PrincipalTeachers /></Guard>} />
          <Route path="class-assignment" element={<Guard permission="staff.assign"><PrincipalClassAssignment /></Guard>} />
          <Route path="subject-assignment" element={<Guard permission="academics.manage"><PrincipalSubjectAssignment /></Guard>} />
          <Route path="students" element={<Guard permission="students.directory"><PrincipalStudents /></Guard>} />
          <Route path="attendance" element={<Guard permission="attendance.analytics"><PrincipalAttendance /></Guard>} />
          <Route path="timetable" element={<Guard permission="timetable.view"><PrincipalTimetable /></Guard>} />
          <Route path="notices" element={<Guard permission="notices.view"><PrincipalNotices /></Guard>} />
          <Route path="events" element={<Guard permission="events.approve"><PrincipalEvents /></Guard>} />
          <Route path="library" element={<Guard permission="library.view"><PrincipalLibrary /></Guard>} />
          <Route path="reports" element={<Guard permission="reports.view"><PrincipalReports /></Guard>} />
          <Route path="settings" element={<Guard permission="settings.manage"><PrincipalSettings /></Guard>} />
        </Route>
      </Route>

      {/* Class Teacher */}
      <Route element={<DashboardLayout role="classTeacher" />}>
        <Route path={ROOTS.classTeacher} element={<PortalGate role="classTeacher" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ClassTeacherOverview />} />
          <Route path="students" element={<Guard permission="students.directory"><ClassTeacherStudents /></Guard>} />
          <Route path="subjects" element={<ClassTeacherSubjects />} />
          <Route path="attendance" element={<Guard permission="attendance.mark"><ClassTeacherAttendance /></Guard>} />
          <Route path="marks" element={<Guard permission="marks.enter"><ClassTeacherMarks /></Guard>} />
          <Route path="econtent" element={<Guard permission="econtent.manage"><ClassTeacherEContent /></Guard>} />
          <Route path="events" element={<Guard permission="events.approve"><ClassTeacherEvents /></Guard>} />
          <Route path="timetable" element={<Guard permission="timetable.view"><ClassTeacherTimetable /></Guard>} />
          <Route path="notices" element={<Guard permission="notices.view"><ClassTeacherNotices /></Guard>} />
          <Route path="settings" element={<ClassTeacherSettings />} />
        </Route>
      </Route>

      {/* Subject Teacher */}
      <Route element={<DashboardLayout role="subjectTeacher" />}>
        <Route path={ROOTS.subjectTeacher} element={<PortalGate role="subjectTeacher" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SubjectTeacherOverview />} />
          <Route path="session" element={<Guard permission="attendance.mark"><SubjectTeacherSession /></Guard>} />
          <Route path="attendance" element={<Guard permission="attendance.mark"><SubjectTeacherAttendance /></Guard>} />
          <Route path="marks" element={<Guard permission="marks.enter"><SubjectTeacherMarks /></Guard>} />
          <Route path="econtent" element={<Guard permission="econtent.manage"><SubjectTeacherEContent /></Guard>} />
          <Route path="students" element={<Guard permission="students.directory"><SubjectTeacherStudents /></Guard>} />
          <Route path="timetable" element={<Guard permission="timetable.view"><SubjectTeacherTimetable /></Guard>} />
          <Route path="notices" element={<Guard permission="notices.view"><SubjectTeacherNotices /></Guard>} />
          <Route path="settings" element={<SubjectTeacherSettings />} />
        </Route>
      </Route>

      {/* Student */}
      <Route element={<DashboardLayout role="student" />}>
        <Route path={ROOTS.student} element={<PortalGate role="student" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<StudentOverview />} />
          <Route path="attendance" element={<Guard permission="attendance.analytics"><StudentAttendance /></Guard>} />
          <Route path="subjects" element={<Guard permission="students.insight"><StudentSubjects /></Guard>} />
          <Route path="econtent" element={<StudentEContent />} />
          <Route path="timetable" element={<Guard permission="timetable.view"><StudentTimetable /></Guard>} />
          <Route path="examinations" element={<Guard permission="students.insight"><StudentExaminations /></Guard>} />
          <Route path="notices" element={<Guard permission="notices.view"><StudentNotices /></Guard>} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="library" element={<Guard permission="library.view"><StudentLibrary /></Guard>} />
          <Route path="fees" element={<Guard permission="fees.own"><StudentFees /></Guard>} />
          <Route path="helpdesk" element={<Guard permission="tickets.view"><StudentHelpdesk /></Guard>} />
          <Route path="feedback" element={<Guard permission="feedback.submit"><StudentFeedback /></Guard>} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>
      </Route>

      {/* Accountant */}
      <Route element={<DashboardLayout role="accountant" />}>
        <Route path={ROOTS.accountant} element={<PortalGate role="accountant" />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AccountantOverview />} />
          <Route path="students" element={<AccountantStudents />} />
          <Route path="new-receipt" element={<AccountantNewReceipt />} />
          <Route path="receipts" element={<AccountantReceipts />} />
          <Route path="notices" element={<AccountantNotices />} />
          <Route path="settings" element={<AccountantSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
