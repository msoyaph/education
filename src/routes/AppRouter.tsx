import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../domains/auth/components/ProtectedRoute';
import { RoleRoute } from '../domains/auth/components/RoleRoute';
import { DashboardLayout } from '../layouts/components/DashboardLayout';

import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { UnauthorizedPage } from '../pages/common/UnauthorizedPage';
import { NotFoundPage } from '../pages/common/NotFoundPage';

import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminSchoolsPage } from '../pages/admin/AdminSchoolsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminRolesPage } from '../pages/admin/AdminRolesPage';
import { AdminClassesPage } from '../pages/admin/AdminClassesPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { TeacherClassesPage } from '../pages/teacher/TeacherClassesPage';
import { TeacherAttendancePage } from '../pages/teacher/TeacherAttendancePage';
import { TeacherGradebookPage } from '../pages/teacher/TeacherGradebookPage';
import { TeacherSchedulePage } from '../pages/teacher/TeacherSchedulePage';
import { TeacherMessagesPage } from '../pages/teacher/TeacherMessagesPage';
import { TeacherSettingsPage } from '../pages/teacher/TeacherSettingsPage';
import { ParentDashboard } from '../pages/parent/ParentDashboard';
import { ParentChildrenPage } from '../pages/parent/ParentChildrenPage';
import { ParentAttendancePage } from '../pages/parent/ParentAttendancePage';
import { ParentGradesPage } from '../pages/parent/ParentGradesPage';
import { ParentAssignmentsPage } from '../pages/parent/ParentAssignmentsPage';
import { ParentFeesPage } from '../pages/parent/ParentFeesPage';
import { ParentMessagesPage } from '../pages/parent/ParentMessagesPage';
import { ParentNotificationsPage } from '../pages/parent/ParentNotificationsPage';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';
import { StudentGradesPage } from '../pages/student/StudentGradesPage';
import { StudentAssignmentsPage } from '../pages/student/StudentAssignmentsPage';
import { StudentSchedulePage } from '../pages/student/StudentSchedulePage';
import { StudentClassesPage } from '../pages/student/StudentClassesPage';
import { ITDashboard } from '../pages/it/ITDashboard';
import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';

import { NotificationSettings } from '../domains/communication/components/notifications/NotificationSettings';
import { ProfilePage } from '../pages/common/ProfilePage';
import { useAuth } from '../domains/auth/contexts/AuthContext';
import { useUser } from '../domains/auth/contexts/UserContext';
import { getRoleBasedRoute } from '../domains/auth/utils/roleRedirect';

function RootRedirect() {
  const { user } = useAuth();
  const { profile, loading } = useUser();

  if (!user) {
    return <HomePage />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const redirectPath = getRoleBasedRoute(profile.user_type);
  return <Navigate to={redirectPath} replace />;
}

function DashboardRedirect() {
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const redirectPath = getRoleBasedRoute(profile.user_type);
  return <Navigate to={redirectPath} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />

            <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['it_admin']} />}>
              <Route path="/it" element={<ITDashboard />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['admin', 'staff']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/schools" element={<AdminSchoolsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/roles" element={<AdminRolesPage />} />
              <Route path="/admin/classes" element={<AdminClassesPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/classes" element={<TeacherClassesPage />} />
              <Route path="/teacher/classes/:id" element={<TeacherClassesPage />} />
              <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
              <Route path="/teacher/attendance/:classId" element={<TeacherAttendancePage />} />
              <Route path="/teacher/gradebook" element={<TeacherGradebookPage />} />
              <Route path="/teacher/gradebook/:classId" element={<TeacherGradebookPage />} />
              <Route path="/teacher/schedule" element={<TeacherSchedulePage />} />
              <Route path="/teacher/messages" element={<TeacherMessagesPage />} />
              <Route path="/teacher/settings" element={<TeacherSettingsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['parent']} />}>
              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/parent/children" element={<ParentChildrenPage />} />
              <Route path="/parent/attendance" element={<ParentAttendancePage />} />
              <Route path="/parent/grades" element={<ParentGradesPage />} />
              <Route path="/parent/assignments" element={<ParentAssignmentsPage />} />
              <Route path="/parent/fees" element={<ParentFeesPage />} />
              <Route path="/parent/messages" element={<ParentMessagesPage />} />
              <Route path="/parent/notifications" element={<ParentNotificationsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/attendance" element={<StudentAttendancePage />} />
              <Route path="/student/grades" element={<StudentGradesPage />} />
              <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
              <Route path="/student/schedule" element={<StudentSchedulePage />} />
              <Route path="/student/classes" element={<StudentClassesPage />} />
              <Route path="/student/classes/:id" element={<StudentClassesPage />} />
            </Route>

            <Route path="/notifications/settings" element={<NotificationSettings />} />
            
            {/* Common Routes - Accessible to all authenticated users */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
