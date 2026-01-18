/**
 * Parent Assignments Page
 * 
 * View assignments for all children
 * School-scoped and respects multi-tenancy
 */

import { FileText, Users, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useParentStudents } from '../../domains/academic/hooks/useParentStudents';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';

function ParentAssignmentsPageContent() {
  const { profile } = useUser();
  const { data: students, loading: studentsLoading } = useParentStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // TODO: Fetch assignments from API
  const assignments: Array<{
    id: string;
    student_id: string;
    title: string;
    subject: string;
    due_date: string;
    status: 'pending' | 'submitted' | 'graded';
  }> = [];

  if (studentsLoading) {
    return <DashboardSkeleton />;
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600">View assignments for your children</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Linked</h3>
          <p className="text-gray-600">No children are currently linked to your account.</p>
        </div>
      </div>
    );
  }

  const filteredAssignments = selectedStudentId
    ? assignments.filter(a => a.student_id === selectedStudentId)
    : assignments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600">View assignments for your children</p>
      </div>

      {students.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Child</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(selectedStudentId === student.id ? null : student.id)}
                className={`p-4 rounded-lg border transition-colors text-left ${
                  selectedStudentId === student.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {student.first_name[0]}{student.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{student.full_name}</h3>
                    <p className="text-xs text-gray-600">{student.grade}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assignments Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Assignments</h2>
        
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No assignments available yet</p>
            <p className="text-sm mt-2">Assignments will appear here when teachers post them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{assignment.subject}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    assignment.status === 'graded'
                      ? 'bg-green-100 text-green-800'
                      : assignment.status === 'submitted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ParentAssignmentsPage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['students:view']}>
        <ParentAssignmentsPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
