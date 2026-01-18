/**
 * IT Dashboard
 * 
 * Role: IT Admin / System Admin (school-scoped or global)
 * 
 * TODO: Backend must validate:
 * - User has 'admin:view' capability
 * - No access to academic data editing
 * - Mostly read-only access
 */

import { Server, Shield, Key, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { Link } from 'react-router-dom';

function ITDashboardContent() {
  const { profile } = useUser();
  const { school } = useTenant();

  // TODO: Fetch real data from APIs
  // GET /system/health
  const systemHealth = {
    status: 'operational' as 'operational' | 'degraded' | 'down',
    api_status: 'operational',
    database_status: 'connected',
    app_version: '1.0.0',
    uptime: '99.9%',
  };

  // GET /security/alerts
  const securityAlerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }> = [];

  // GET /integrations
  const integrations: Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'error';
    last_sync: string;
  }> = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'active':
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'down':
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IT Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {profile?.first_name}! {school?.name && `Managing ${school.name}`}
        </p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(systemHealth.status)}`}>
              {systemHealth.status}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">System Status</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{systemHealth.status}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(systemHealth.api_status)}`}>
              {systemHealth.api_status}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">API Status</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{systemHealth.api_status}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(systemHealth.database_status)}`}>
              {systemHealth.database_status}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">Database</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{systemHealth.database_status}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">Uptime</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{systemHealth.uptime}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Security Alerts</h2>
            <Link
              to="/it/security"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {securityAlerts.length > 0 ? (
              securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="text-sm text-gray-500">No security alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
            <Link
              to="/it/integrations"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {integrations.length > 0 ? (
              integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                    <p className="text-xs text-gray-500">
                      Last sync: {new Date(integration.last_sync).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No integrations configured</p>
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">App Version</p>
            <p className="text-lg font-semibold text-gray-900">{systemHealth.app_version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">{systemHealth.uptime}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">API Status</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{systemHealth.api_status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{systemHealth.database_status}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/it/integrations"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
          >
            <Key className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Integrations</p>
          </Link>
          <Link
            to="/it/api-keys"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-center"
          >
            <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">API Keys</p>
          </Link>
          <Link
            to="/it/logs"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-center"
          >
            <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Logs</p>
          </Link>
          <Link
            to="/it/updates"
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-center"
          >
            <Server className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Updates</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ITDashboard() {
  return (
    <RoleGuard allowedRoles={['it_admin']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <ITDashboardContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
