/**
 * Parent Children Page
 * 
 * List all children linked to parent account
 * School-scoped and respects multi-tenancy
 */

import { Users, Mail, Phone, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useParentStudents } from '../../domains/academic/hooks/useParentStudents';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';

function ParentChildrenPageContent() {
  const { profile } = useUser();
  const { data: students, loading, error } = useParentStudents();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-600">Please contact your school administrator if the problem persists.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-600">View and manage information for your children</p>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Linked</h3>
          <p className="text-gray-600 mb-2">No children are currently linked to your account.</p>
          <p className="text-sm text-gray-500">Contact your school administrator to link student accounts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Link
              key={student.id}
              to={`/parent/students/${student.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {student.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-semibold text-blue-600">
                      {student.first_name[0]}{student.last_name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{student.full_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {student.grade}
                    </span>
                  </p>
                  {student.class_name && (
                    <p className="text-xs text-gray-500 mb-3">{student.class_name}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ParentChildrenPage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['students:view']}>
        <ParentChildrenPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
