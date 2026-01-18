/**
 * SuperAdmin Dashboard
 * 
 * Role: SuperAdmin (platform-level)
 * 
 * TODO: Backend must validate:
 * - User has 'admin:manage' capability
 * - No access to individual student records
 * - Operates strictly at tenant level
 * - Feature flags controlled here only
 */

import { School, Users, TrendingUp, Settings, Flag, Activity, Shield } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { Link } from 'react-router-dom';

function SuperAdminDashboardContent() {
  const { profile } = useUser();

  // TODO: Fetch real data from APIs
  // GET /platform/overview
  const platformOverview = {
    total_schools: 0, // GET /schools?count=true
    active_users: 0, // GET /users?count=true&active=true
    system_uptime: '99.9%',
    feature_usage: {
      attendance: 0,
      notifications: 0,
      reports: 0,
    },
  };

  // GET /schools?limit=10&order=created_at
  const recentSchools: Array<{
    id: string;
    name: string;
    created_at: string;
    status: 'active' | 'inactive';
  }> = [];

  // GET /subscriptions?status=active
  const activeSubscriptions = 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600">Welcome back, {profile?.first_name}!</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 rounded-lg">
              <School className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+0</span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">Total Schools</h3>
            <p className="text-2xl font-bold text-gray-900">{platformOverview.total_schools}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+0</span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
            <p className="text-2xl font-bold text-gray-900">{platformOverview.active_users}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">System Uptime</h3>
            <p className="text-2xl font-bold text-gray-900">{platformOverview.system_uptime}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">Active Subscriptions</h3>
            <p className="text-2xl font-bold text-gray-900">{activeSubscriptions}</p>
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Attendance</p>
            <p className="text-2xl font-bold text-gray-900">
              {platformOverview.feature_usage.attendance}
            </p>
            <p className="text-xs text-gray-500 mt-1">Schools using</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Notifications</p>
            <p className="text-2xl font-bold text-gray-900">
              {platformOverview.feature_usage.notifications}
            </p>
            <p className="text-xs text-gray-500 mt-1">Schools using</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Reports</p>
            <p className="text-2xl font-bold text-gray-900">
              {platformOverview.feature_usage.reports}
            </p>
            <p className="text-xs text-gray-500 mt-1">Schools using</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Schools */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Schools</h2>
            <Link
              to="/superadmin/schools"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentSchools.length > 0 ? (
              recentSchools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{school.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(school.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      school.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {school.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No schools yet</p>
            )}
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">System Status</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">API Status</span>
              </div>
              <span className="text-sm text-blue-600 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Uptime</span>
              </div>
              <span className="text-sm text-purple-600 font-medium">
                {platformOverview.system_uptime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            to="/superadmin/schools"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
          >
            <School className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Schools</p>
          </Link>
          <Link
            to="/superadmin/subscriptions"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center"
          >
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Subscriptions</p>
          </Link>
          <Link
            to="/superadmin/feature-flags"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center"
          >
            <Flag className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Feature Flags</p>
          </Link>
          <Link
            to="/superadmin/logs"
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center"
          >
            <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Logs</p>
          </Link>
          <Link
            to="/superadmin/settings"
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-center"
          >
            <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminDashboard() {
  return (
    <RoleGuard allowedRoles={['super_admin']}>
      <PermissionGuard requiredCapabilities={['admin:manage']}>
        <SuperAdminDashboardContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
