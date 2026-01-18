/**
 * Teacher Schedule Page
 * 
 * Weekly teaching schedule
 * School-scoped and respects multi-tenancy
 */

import { Calendar, Clock, MapPin } from 'lucide-react';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';

function TeacherSchedulePageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600">View your weekly teaching schedule</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Coming Soon</h3>
        <p className="text-gray-600">
          The schedule feature is under development. You'll be able to view your 
          weekly timetable, class locations, and meeting times.
        </p>
      </div>
    </div>
  );
}

export function TeacherSchedulePage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={['classes:read']}>
        <TeacherSchedulePageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
