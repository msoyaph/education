/**
 * Teacher Attendance Page
 * 
 * List of classes for marking attendance
 * School-scoped and respects multi-tenancy
 */

import { CheckSquare, BookOpen, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { TeacherAttendanceMarking } from '../../domains/academic/components/attendance/TeacherAttendanceMarking';

function TeacherAttendancePageContent() {
  const { classId } = useParams<{ classId: string }>();

  // If classId is provided, show attendance marking interface
  if (classId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/teacher/attendance"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="text-gray-600">Record attendance for your class</p>
          </div>
        </div>
        <TeacherAttendanceMarking
          classId={classId}
          className="Class Attendance"
        />
      </div>
    );
  }

  // Otherwise show list of classes to select from
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Select a class to mark attendance</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
        <p className="text-gray-600 mb-4">Go to My Classes to mark attendance for a specific class</p>
        <Link
          to="/teacher/classes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          <span>View My Classes</span>
        </Link>
      </div>
    </div>
  );
}

export function TeacherAttendancePage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={['attendance:mark']}>
        <TeacherAttendancePageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
