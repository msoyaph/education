/**
 * Student Classes Page
 * 
 * View enrolled classes
 * School-scoped and respects multi-tenancy
 */

import { BookOpen, User, Calendar, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { supabase } from '../../shared/lib/supabase';
import { useTenant } from '../../shared/contexts/TenantContext';

function StudentClassesPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const schoolId = school?.id || profile?.school_id;
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!profile || !schoolId) {
      setLoading(false);
      return;
    }

    const loadClasses = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual classes API call
        // GET /classes?student_id={profile.id}&school_id={schoolId}
        
        // Placeholder: Fetch from class_enrollments
        const { data: enrollments, error } = await supabase
          .from('class_enrollments')
          .select(`
            id,
            class_id,
            classes (
              id,
              name,
              subject,
              section,
              schedule,
              teachers (
                id,
                first_name,
                last_name
              )
            )
          `)
          .eq('student_id', profile.id)
          .eq('school_id', schoolId);

        if (error) {
          console.error('Error loading classes:', error);
          setClasses([]);
        } else {
          const formattedClasses = enrollments?.map(enrollment => {
            const classData = Array.isArray(enrollment.classes) ? enrollment.classes[0] : enrollment.classes;
            const teacher = Array.isArray(classData?.teachers) ? classData?.teachers[0] : classData?.teachers;
            return {
              id: classData?.id,
              enrollmentId: enrollment.id,
              name: classData?.name,
              subject: classData?.subject,
              section: classData?.section,
              schedule: classData?.schedule,
              teacher: teacher
                ? `${teacher.first_name} ${teacher.last_name}`
                : 'TBA',
            };
          }).filter(c => c.id) || [];
          setClasses(formattedClasses);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [profile, schoolId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600">View your enrolled classes</p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes</h3>
          <p className="text-gray-600">You are not enrolled in any classes yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Link
              key={classItem.id}
              to={`/student/classes/${classItem.id}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{classItem.name}</h3>
                  <p className="text-sm text-gray-600">{classItem.subject}</p>
                  {classItem.section && (
                    <p className="text-xs text-gray-500 mt-1">Section {classItem.section}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{classItem.teacher}</span>
                </div>
                {classItem.schedule && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{classItem.schedule}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-xs text-blue-600 font-medium">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentClassesPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <PermissionGuard requiredCapabilities={['classes:read']}>
        <StudentClassesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}