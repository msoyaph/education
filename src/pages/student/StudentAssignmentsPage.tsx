/**
 * Student Assignments Page
 * 
 * View own assignments
 * School-scoped and respects multi-tenancy
 */

import { FileText, Calendar, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { supabase } from '../../shared/lib/supabase';
import { useTenant } from '../../shared/contexts/TenantContext';

function StudentAssignmentsPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const schoolId = school?.id || profile?.school_id;
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!profile || !schoolId) {
      setLoading(false);
      return;
    }

    const loadAssignments = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual assignments API call
        // GET /assignments?student_id={profile.id}&school_id={schoolId}
        
        // Placeholder data structure
        const placeholderAssignments: any[] = [];
        setAssignments(placeholderAssignments);
      } catch (error) {
        console.error('Error loading assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [profile, schoolId, filterStatus]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const filteredAssignments = filterStatus === 'all'
    ? assignments
    : assignments.filter(a => a.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-600">View and manage your assignments</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({assignments.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({assignments.filter(a => a.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filterStatus === 'completed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({assignments.filter(a => a.status === 'completed').length})
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments</h3>
            <p className="text-gray-600">
              {filterStatus === 'all'
                ? 'You have no assignments yet.'
                : `You have no ${filterStatus} assignments.`}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <Link
              key={assignment.id}
              to={`/student/assignments/${assignment.id}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    {assignment.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {assignment.class_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.due_date && new Date(assignment.due_date) < new Date() && assignment.status !== 'completed' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Overdue
                    </span>
                  )}
                  {assignment.status === 'pending' && (
                    <Clock className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function StudentAssignmentsPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <PermissionGuard requiredCapabilities={['classes:read']}>
        <StudentAssignmentsPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}