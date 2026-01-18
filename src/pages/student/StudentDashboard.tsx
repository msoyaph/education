/**
 * Student Dashboard
 * 
 * Role: Student
 * 
 * TODO: Backend must validate:
 * - User has 'attendance:view' capability (only for their own attendance)
 * - Assignments visible only for enrolled classes
 * - No access to sibling or parent data
 */

import { CheckSquare, Award, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { Link } from 'react-router-dom';

function StudentDashboardContent() {
  const { profile } = useUser();

  // TODO: Fetch real data from APIs
  // GET /students/{id}/overview
  const todaySchedule: Array<{
    id: string;
    name: string;
    time: string;
    room: string;
    teacher: string;
  }> = []; // TODO: GET /students/{id}/schedule?date=today

  const attendanceStatus = {
    rate: 0, // TODO: GET /attendance?student_id={id}&summary=true
    present: 0,
    absent: 0,
  };

  const assignmentsDue: Array<{
    id: string;
    name: string;
    due: string;
    subject: string;
    class_id: string;
  }> = []; // TODO: GET /assignments?student_id={id}&status=pending

  const recentNotifications: Array<{
    id: string;
    title: string;
    timestamp: string;
  }> = []; // TODO: GET /notifications?student_id={id}

  const progress = {
    level: 1, // Gamified progress
    points: 0,
    nextLevel: 100,
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.first_name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-2">
            <div className="p-2 bg-blue-100 rounded-lg w-fit">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Attendance</p>
              <p className="text-xl font-bold text-gray-900">
                {attendanceStatus.rate > 0 ? `${attendanceStatus.rate}%` : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-2">
            <div className="p-2 bg-green-100 rounded-lg w-fit">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Grade</p>
              <p className="text-xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-2">
            <div className="p-2 bg-purple-100 rounded-lg w-fit">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Assignments</p>
              <p className="text-xl font-bold text-gray-900">{assignmentsDue.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col gap-2">
            <div className="p-2 bg-orange-100 rounded-lg w-fit">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Level {progress.level}</p>
              <p className="text-xl font-bold text-gray-900">{progress.points} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
        {todaySchedule.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No classes scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{cls.name}</h3>
                    <p className="text-sm text-gray-600">
                      {cls.teacher} • {cls.room}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">{cls.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignments Due */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assignments Due</h2>
            <Link
              to="/student/assignments"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {assignmentsDue.length > 0 ? (
              assignmentsDue.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/student/assignments/${assignment.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{assignment.name}</h3>
                    <p className="text-xs text-gray-600">{assignment.subject}</p>
                  </div>
                  <span className="text-xs font-medium text-orange-600">{assignment.due}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No assignments due</p>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <Link
              to="/student/notifications"
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
              <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/student/attendance"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
          >
            <CheckSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Attendance</p>
          </Link>
          <Link
            to="/student/assignments"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center"
          >
            <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Assignments</p>
          </Link>
          <Link
            to="/student/grades"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center"
          >
            <Award className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Grades</p>
          </Link>
          <Link
            to="/student/profile"
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-center"
          >
            <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StudentDashboard() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <PermissionGuard requiredCapabilities={['attendance:view']}>
        <StudentDashboardContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
