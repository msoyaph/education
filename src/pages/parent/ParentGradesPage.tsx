/**
 * Parent Grades Page
 * 
 * View grades for all children (published only)
 * School-scoped and respects multi-tenancy
 */

import { Award, Users, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useParentStudents } from '../../domains/academic/hooks/useParentStudents';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';

function ParentGradesPageContent() {
  const { profile } = useUser();
  const { data: students, loading: studentsLoading } = useParentStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // TODO: Fetch grades from API
  const grades: Array<{
    id: string;
    subject: string;
    grade: string;
    percentage: number;
    published: boolean;
    date: string;
  }> = [];

  if (studentsLoading) {
    return <DashboardSkeleton />;
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
          <p className="text-gray-600">View grades for your children</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Children Linked</h3>
          <p className="text-gray-600">No children are currently linked to your account.</p>
        </div>
      </div>
    );
  }

  const publishedGrades = grades.filter(g => g.published);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
        <p className="text-gray-600">View published grades for your children</p>
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

      {/* Grades Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedStudent ? `${selectedStudent.full_name}'s Grades` : 'All Grades'}
        </h2>
        
        {publishedGrades.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No published grades available yet</p>
            <p className="text-sm mt-2">Grades will appear here once published by teachers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedGrades.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{grade.subject}</h3>
                    <p className="text-xs text-gray-500">{new Date(grade.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">{grade.grade}</span>
                  {grade.percentage && (
                    <p className="text-xs text-gray-500">{grade.percentage}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ParentGradesPage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['students:view']}>
        <ParentGradesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
