/**
 * School Admin Dashboard
 * 
 * Role: Admin (school-scoped)
 * 
 * TODO: Backend must validate:
 * - User has 'admin:view' capability
 * - User's school_id matches requested school_id
 * - All data is filtered by school_id
 */

import { Users, School, BookOpen, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useSchoolOverview } from '../../domains/academic/hooks/useSchoolOverview';
import { useAttendanceSummary } from '../../domains/academic/hooks/useAttendanceSummary';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { Link } from 'react-router-dom';

function AdminDashboardContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const { data: overview, loading: overviewLoading } = useSchoolOverview();
  const { data: attendance, loading: attendanceLoading } = useAttendanceSummary();

  const loading = overviewLoading || attendanceLoading;

  const stats = [
    {
      icon: Users,
      label: 'Students',
      value: overview?.student_count?.toString() || '0',
      change: '+0',
      color: 'bg-blue-100 text-blue-600',
      link: '/admin/users?type=student',
    },
    {
      icon: School,
      label: 'Teachers',
      value: overview?.teacher_count?.toString() || '0',
      change: '+0',
      color: 'bg-green-100 text-green-600',
      link: '/admin/users?type=teacher',
    },
    {
      icon: BookOpen,
      label: 'Classes',
      value: '0', // TODO: Get from API
      change: '+0',
      color: 'bg-purple-100 text-purple-600',
      link: '/admin/classes',
    },
    {
      icon: TrendingUp,
      label: 'Attendance Rate',
      value: attendance?.week.rate ? `${attendance.week.rate}%` : '0%',
      change: '+0%',
      color: 'bg-orange-100 text-orange-600',
      link: '/admin/attendance',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'down':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {profile?.first_name}! {school?.name && `Managing ${school.name}`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const StatCard = (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );

          return stat.link ? (
            <Link key={stat.label} to={stat.link} className="block">
              {StatCard}
            </Link>
          ) : (
            <div key={stat.label}>{StatCard}</div>
          );
        })}
      </div>

      {/* Attendance Summary */}
      {attendance && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Today - Present</p>
              <p className="text-2xl font-bold text-green-600">{attendance.today.present}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Today - Absent</p>
              <p className="text-2xl font-bold text-red-600">{attendance.today.absent}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week - Rate</p>
              <p className="text-2xl font-bold text-blue-600">{attendance.week.rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week - Total</p>
              <p className="text-2xl font-bold text-gray-900">{attendance.week.total}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link
              to="/admin/activity"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {overview?.recent_activity && overview.recent_activity.length > 0 ? (
              overview.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-4">
            {overview?.system_status && (
              <div className={`p-4 rounded-lg border ${getStatusColor(overview.system_status.status)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {overview.system_status.status === 'operational' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium capitalize">{overview.system_status.status}</span>
                </div>
                <p className="text-sm">{overview.system_status.message}</p>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Status</span>
                <span className="text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Backup</span>
                <span className="text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
          >
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Manage Users</p>
          </Link>
          <Link
            to="/admin/classes"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center"
          >
            <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Manage Classes</p>
          </Link>
          <Link
            to="/admin/settings"
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-center"
          >
            <School className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">School Settings</p>
          </Link>
          <Link
            to="/admin/reports"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center"
          >
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <AdminDashboardContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
