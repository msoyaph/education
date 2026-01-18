/**
 * Teacher Dashboard
 * 
 * Role: Teacher
 * 
 * TODO: Backend must validate:
 * - User has 'classes:read' and 'attendance:mark' capabilities
 * - Teacher can only see their own classes
 */

import { CheckSquare, BookOpen, Clock, Users, Calendar } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useTeacherOverview } from '../../domains/academic/hooks/useTeacherOverview';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { Link, useNavigate } from 'react-router-dom';

function TeacherDashboardContent() {
  const { profile } = useUser();
  const navigate = useNavigate();
  const { data: overview, loading: overviewLoading } = useTeacherOverview();

  // TODO: Fetch real notifications from API
  const recentNotifications: Array<{
    id: string;
    title: string;
    timestamp: string;
  }> = [];

  const loading = overviewLoading;

  const handleMarkAttendance = (classId: string) => {
    navigate(`/teacher/attendance/${classId}`);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.first_name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Classes</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.today_classes.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.total_students || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.attendance_rate ? `${overview.attendance_rate}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.pending_tasks || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
        {overview?.today_classes && overview.today_classes.length > 0 ? (
          <div className="space-y-4">
            {overview.today_classes.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{cls.name}</h3>
                    <p className="text-sm text-gray-600">
                      {cls.room} • {cls.students} students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">{cls.time}</span>
                  <button
                    onClick={() => handleMarkAttendance(cls.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No classes scheduled for today</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/teacher/attendance"
              className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <CheckSquare className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Mark Attendance</p>
            </Link>
            <Link
              to="/teacher/classes"
              className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <BookOpen className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Classes</p>
            </Link>
            <Link
              to="/teacher/gradebook"
              className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <CheckSquare className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Gradebook</p>
            </Link>
            <Link
              to="/teacher/schedule"
              className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <Calendar className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Schedule</p>
            </Link>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <Link
              to="/teacher/notifications"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeacherDashboard() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={['classes:read', 'attendance:mark']}>
        <TeacherDashboardContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
