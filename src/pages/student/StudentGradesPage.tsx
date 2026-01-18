/**
 * Student Grades Page
 * 
 * View own grades
 * School-scoped and respects multi-tenancy
 */

import { Award, BookOpen, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { useTenant } from '../../shared/contexts/TenantContext';

function StudentGradesPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const schoolId = school?.id || profile?.school_id;
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');

  useEffect(() => {
    if (!profile || !schoolId) {
      setLoading(false);
      return;
    }

    const loadGrades = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual grades API call
        // GET /grades?student_id={profile.id}&school_id={schoolId}
        
        // Placeholder data structure
        const placeholderGrades: any[] = [];
        setGrades(placeholderGrades);
      } catch (error) {
        console.error('Error loading grades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, [profile, schoolId, filterClass]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
        <p className="text-gray-600">View your grades and academic progress</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Trend</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Grades</h2>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes</option>
            {/* TODO: Add class options */}
          </select>
        </div>

        {grades.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No grades available yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Class</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Assignment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Grade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{grade.class_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{grade.assignment_name}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{grade.grade}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(grade.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentGradesPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <PermissionGuard requiredCapabilities={['grading:read']}>
        <StudentGradesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}