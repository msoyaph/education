/**
 * Student Attendance Page
 * 
 * View own attendance records
 * School-scoped and respects multi-tenancy
 */

import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { StudentAttendanceView } from '../../domains/academic/components/attendance/StudentAttendanceView';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';

function StudentAttendancePageContent() {
  const { profile } = useUser();

  if (!profile) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600">View your attendance records</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <StudentAttendanceView
          studentId={profile.id}
          studentName={profile.full_name || `${profile.first_name} ${profile.last_name}`}
          viewMode="student"
        />
      </div>
    </div>
  );
}

export function StudentAttendancePage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <PermissionGuard requiredCapabilities={['attendance:view']}>
        <StudentAttendancePageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}