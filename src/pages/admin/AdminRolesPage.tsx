import { Shield, Plus, Users, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';

function AdminRolesPageContent() {
  const { profile } = useUser();

  // TODO: Fetch roles from API
  const roles = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600">Manage roles and their capabilities</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first role</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create Role
            </button>
          </div>
        ) : (
          roles.map((role: any) => (
            <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description || 'No description'}</p>
                  </div>
                </div>
                {role.is_system_role && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    System
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{role.user_count || 0} users assigned</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{role.capability_count || 0} capabilities</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Edit
                  </button>
                  {!role.is_system_role && (
                    <button className="flex-1 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminRolesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <AdminRolesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
