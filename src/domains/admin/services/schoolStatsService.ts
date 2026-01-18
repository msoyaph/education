import { supabase } from '../../../shared/lib/supabase';

export interface SchoolStats {
  student_count: number;
  teacher_count: number;
  class_count: number;
  parent_count: number;
}

export async function getSchoolStats(schoolId: string): Promise<SchoolStats> {
  try {
    // Get student count
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'active');

    // Get teacher count
    const { count: teacherCount } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true);

    // Get class count
    const { count: classCount } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'active');

    // Get parent count
    const { count: parentCount } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    return {
      student_count: studentCount || 0,
      teacher_count: teacherCount || 0,
      class_count: classCount || 0,
      parent_count: parentCount || 0,
    };
  } catch (error) {
    console.error('Error fetching school stats:', error);
    return {
      student_count: 0,
      teacher_count: 0,
      class_count: 0,
      parent_count: 0,
    };
  }
}
