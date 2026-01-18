/**
 * Parent Attendance Page
 * 
 * View attendance records for all children
 * School-scoped and respects multi-tenancy
 */

import { CheckSquare, Users, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useParentStudents } from '../../domains/academic/hooks/useParentStudents';
import { StudentAttendanceView } from '../../domains/academic/components/attendance/StudentAttendanceView';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';

function ParentAttendancePageContent() {
  const { profile } = useUser();
  const { data: students, loading: studentsLoading } = useParentStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (studentsLoading) {
    return <DashboardSkeleton />;
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">View attendance records for your children</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Linked</h3>
          <p className="text-gray-600">No children are currently linked to your account.</p>
        </div>
      </div>
    );
  }

  // If only one child, show their attendance directly
  if (students.length === 1 && !selectedStudentId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">View attendance records for your children</p>
        </div>
        <StudentAttendanceView
          studentId={students[0].id}
          studentName={students[0].full_name}
          viewMode="parent"
        />
      </div>
    );
  }

  // If multiple children, let them select
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">View attendance records for your children</p>
      </div>

      {!selectedStudentId ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Child</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-4">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {student.first_name[0]}{student.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                    <p className="text-sm text-gray-600">{student.grade}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : selectedStudent ? (
        <div>
          <button
            onClick={() => setSelectedStudentId(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Back to Children List
          </button>
          <StudentAttendanceView
            studentId={selectedStudent.id}
            studentName={selectedStudent.full_name}
            viewMode="parent"
          />
        </div>
      ) : null}
    </div>
  );
}

export function ParentAttendancePage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['attendance:view']}>
        <ParentAttendancePageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
