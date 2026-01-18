/**
 * Parent Dashboard
 * 
 * Role: Parent (linked to one or more students)
 * 
 * TODO: Backend must validate:
 * - User has 'students:view' capability (only for their children)
 * - All data is filtered by parent-student relationship
 * - Grades visible only if published
 */

import { Users, CheckSquare, Award, TrendingUp, Calendar, FileText, MessageSquare } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useParentStudents } from '../../domains/academic/hooks/useParentStudents';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { Link } from 'react-router-dom';

function ParentDashboardContent() {
  const { profile } = useUser();
  const { data: students, loading: studentsLoading } = useParentStudents();

  // TODO: Fetch real data from APIs
  const attendanceToday = 0; // GET /attendance?student_id={id}&date=today
  const recentNotifications: Array<{ id: string; title: string; timestamp: string }> = []; // GET /notifications?parent_id={id}
  const latestGrades: Array<{ subject: string; grade: string; published: boolean }> = []; // GET /grades?student_id={id}&published=true

  const loading = studentsLoading;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.first_name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">My Children</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance Today</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceToday}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Grade</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Children */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Children</h2>
        {students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No children linked to your account</p>
            <p className="text-sm mt-2">Contact your school administrator to link students</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map((student) => (
              <Link
                key={student.id}
                to={`/parent/students/${student.id}`}
                className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {student.first_name[0]}{student.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{student.full_name}</h3>
                    <p className="text-sm text-gray-600">{student.grade}</p>
                    {student.class_name && (
                      <p className="text-xs text-gray-500">{student.class_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">View Details</span>
                  <span className="text-blue-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <Link
              to="/parent/notifications"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">{notification.title || 'Notification'}</p>
                    <p className="text-xs text-gray-500">{notification.timestamp || 'Just now'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent notifications</p>
            )}
          </div>
        </div>

        {/* Latest Grades (Published Only) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Latest Grades</h2>
            <Link
              to="/parent/grades"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {latestGrades.length > 0 ? (
              latestGrades
                .filter(grade => grade.published)
                .map((grade, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{grade.subject}</h3>
                    </div>
                    <span className="text-sm font-bold text-green-600">{grade.grade}</span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No published grades available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/parent/attendance"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
          >
            <CheckSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Attendance</p>
          </Link>
          <Link
            to="/parent/grades"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center"
          >
            <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Grades</p>
          </Link>
          <Link
            to="/parent/notifications"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center"
          >
            <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Notifications</p>
          </Link>
          <Link
            to="/parent/messages"
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center"
          >
            <MessageSquare className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Messages</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ParentDashboard() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['students:view']}>
        <ParentDashboardContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
