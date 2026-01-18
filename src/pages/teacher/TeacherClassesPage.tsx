/**
 * Teacher Classes Page
 * 
 * Shows all classes assigned to the teacher
 * School-scoped and respects multi-tenancy
 */

import { BookOpen, Users, Calendar, Clock, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { supabase } from '../../shared/lib/supabase';

interface TeacherClass {
  id: string;
  name: string;
  code: string;
  course_name?: string;
  grade_level?: string;
  section?: string;
  student_count?: number;
  schedule?: string;
}

function TeacherClassesPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const schoolId = school?.id || profile?.school_id;

  useEffect(() => {
    if (!schoolId || !profile?.id) return;

    const loadClasses = async () => {
      try {
        setLoading(true);
        // Fetch classes assigned to this teacher, scoped by school
        const { data, error } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            code,
            grade_level,
            section,
            courses(name)
          `)
          .eq('school_id', schoolId)
          .eq('teacher_id', profile.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        // Fetch student counts separately
        let enrollmentCounts: Record<string, number> = {};
        if (data && data.length > 0) {
          const classIds = data.map((cls: any) => cls.id);
          const { data: enrollments } = await supabase
            .from('class_enrollments')
            .select('class_id')
            .in('class_id', classIds);

          enrollmentCounts = (enrollments || []).reduce((acc: Record<string, number>, enrollment: any) => {
            acc[enrollment.class_id] = (acc[enrollment.class_id] || 0) + 1;
            return acc;
          }, {});
        }

        const formattedClasses: TeacherClass[] = (data || []).map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          code: cls.code,
          course_name: cls.courses?.name,
          grade_level: cls.grade_level,
          section: cls.section,
          student_count: enrollmentCounts[cls.id] || 0,
        }));

        setClasses(formattedClasses);
      } catch (error) {
        console.error('Error loading classes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [schoolId, profile?.id]);

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600">View all classes assigned to you</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No classes found' : 'No classes assigned'}
          </h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search' : 'You don\'t have any classes assigned yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <Link
              key={cls.id}
              to={`/teacher/classes/${cls.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    {cls.code && <p className="text-sm text-gray-600">{cls.code}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {cls.course_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{cls.course_name}</span>
                  </div>
                )}
                {cls.grade_level && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Grade {cls.grade_level}</span>
                    {cls.section && <span>• Section {cls.section}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{cls.student_count || 0} students</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm">
                  <Link
                    to={`/teacher/attendance/${cls.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark Attendance
                  </Link>
                  <Link
                    to={`/teacher/gradebook/${cls.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    Gradebook
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeacherClassesPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={['classes:read']}>
        <TeacherClassesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
