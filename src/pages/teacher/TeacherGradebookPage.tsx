/**
 * Teacher Gradebook Page
 * 
 * Gradebook for managing student grades by class
 * School-scoped and respects multi-tenancy
 */

import { Award, BookOpen, Users, Search, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
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
}

function GradebookClassList({ onSelectClass }: { onSelectClass: (classId: string) => void }) {
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

        // Get student counts
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
        <p className="text-gray-600">Select a class to manage grades</p>
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
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    {cls.code && <p className="text-sm text-gray-600">{cls.code}</p>}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GradebookClassView({ classId }: { classId: string }) {
  const [className, setClassName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClassName = async () => {
      try {
        const { data } = await supabase
          .from('classes')
          .select('name')
          .eq('id', classId)
          .maybeSingle();

        if (data) {
          setClassName(data.name);
        }
      } catch (error) {
        console.error('Error loading class:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClassName();
  }, [classId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/teacher/gradebook"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Loading...' : className || 'Gradebook'}
          </h1>
          <p className="text-gray-600">Manage grades for this class</p>
        </div>
      </div>

      {/* Gradebook Table Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Gradebook Coming Soon</h3>
        <p className="text-gray-600 mb-4">
          The gradebook interface is under development. You'll be able to:
        </p>
        <ul className="text-left max-w-md mx-auto text-gray-600 space-y-2">
          <li>• View all students in the class</li>
          <li>• Record grades for assignments</li>
          <li>• Calculate average grades</li>
          <li>• Generate grade reports</li>
        </ul>
      </div>
    </div>
  );
}

function TeacherGradebookPageContent() {
  const { classId } = useParams<{ classId?: string }>();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classId || null);

  // If classId is in URL params, use it
  useEffect(() => {
    if (classId) {
      setSelectedClassId(classId);
    }
  }, [classId]);

  if (selectedClassId) {
    return <GradebookClassView classId={selectedClassId} />;
  }

  return <GradebookClassList onSelectClass={setSelectedClassId} />;
}

export function TeacherGradebookPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={['grading:read']}>
        <TeacherGradebookPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
