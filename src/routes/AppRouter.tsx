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
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { ParentDashboard } from '../pages/parent/ParentDashboard';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { ITDashboard } from '../pages/it/ITDashboard';
import { SuperAdminDashboard } from '../pages/superadmin/SuperAdminDashboard';

import { NotificationSettings } from '../domains/communication/components/notifications/NotificationSettings';
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
            </Route>

            <Route element={<RoleRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['parent']} />}>
              <Route path="/parent" element={<ParentDashboard />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>

            <Route path="/notifications/settings" element={<NotificationSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
