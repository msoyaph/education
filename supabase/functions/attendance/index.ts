import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AttendanceRecord {
  class_id: string;
  student_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*, school_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'GET' && path.includes('/class/')) {
      const pathParts = path.split('/');
      const classIdIndex = pathParts.indexOf('class') + 1;
      const classId = pathParts[classIdIndex];
      const date = pathParts[classIdIndex + 1] || new Date().toISOString().split('T')[0];

      const { data: classData } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .maybeSingle();

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isTeacherOfClass = teacher && classData?.teacher_id === teacher.id;
      const isAdmin = userProfile.user_type === 'admin' || userProfile.user_type === 'it_admin';

      if (!isTeacherOfClass && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Not the teacher of this class' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, students(id, student_code, first_name, last_name, photo_url)')
        .eq('class_id', classId)
        .eq('status', 'active');

      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('class_id', classId)
        .eq('attendance_date', date);

      const attendanceMap = new Map(
        (attendanceRecords || []).map(record => [record.student_id, record])
      );

      const response = (enrollments || []).map(enrollment => {
        const student = enrollment.students;
        const attendance = attendanceMap.get(enrollment.student_id);

        return {
          student_id: enrollment.student_id,
          student_code: student.student_code,
          student_name: `${student.first_name} ${student.last_name}`,
          student_photo: student.photo_url,
          attendance_id: attendance?.id || null,
          status: attendance?.status || null,
          check_in_time: attendance?.check_in_time || null,
          notes: attendance?.notes || null,
          marked_at: attendance?.marked_at || null,
        };
      });

      return new Response(
        JSON.stringify({ data: response }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET' && path.includes('/student/')) {
      const studentId = path.split('/student/')[1];

      const { data: student } = await supabase
        .from('students')
        .select('user_id, school_id')
        .eq('id', studentId)
        .maybeSingle();

      if (!student) {
        return new Response(
          JSON.stringify({ error: 'Student not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const isStudent = student.user_id === user.id;

      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let isParent = false;
      if (parent) {
        const { data: relationship } = await supabase
          .from('student_parents')
          .select('id')
          .eq('student_id', studentId)
          .eq('parent_id', parent.id)
          .maybeSingle();

        isParent = !!relationship;
      }

      const isAdmin = userProfile.user_type === 'admin' || userProfile.user_type === 'it_admin';

      if (!isStudent && !isParent && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Cannot view this student\'s attendance' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      let query = supabase
        .from('attendance_records')
        .select('*, classes(name, code)')
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false })
        .limit(50);

      if (startDate) {
        query = query.gte('attendance_date', startDate);
      }
      if (endDate) {
        query = query.lte('attendance_date', endDate);
      }

      const { data: records } = await query;

      const summary = {
        present: records?.filter(r => r.status === 'present').length || 0,
        absent: records?.filter(r => r.status === 'absent').length || 0,
        late: records?.filter(r => r.status === 'late').length || 0,
        excused: records?.filter(r => r.status === 'excused').length || 0,
        total: records?.length || 0,
      };

      return new Response(
        JSON.stringify({ data: records, summary }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'POST') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = userProfile.user_type === 'admin' || userProfile.user_type === 'it_admin';

      if (!teacher && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Only teachers can mark attendance' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const body = await req.json();
      const records: AttendanceRecord[] = Array.isArray(body) ? body : [body];

      const validStatuses = ['present', 'absent', 'late', 'excused'];
      for (const record of records) {
        if (!record.class_id || !record.student_id || !record.attendance_date || !record.status) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: class_id, student_id, attendance_date, status' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (!validStatuses.includes(record.status)) {
          return new Response(
            JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      if (teacher) {
        for (const record of records) {
          const { data: classData } = await supabase
            .from('classes')
            .select('teacher_id, school_id')
            .eq('id', record.class_id)
            .maybeSingle();

          if (!classData || classData.teacher_id !== teacher.id) {
            return new Response(
              JSON.stringify({ error: 'Unauthorized: Not the teacher of this class' }),
              {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      }

      const insertRecords = records.map(record => ({
        school_id: userProfile.school_id,
        class_id: record.class_id,
        student_id: record.student_id,
        attendance_date: record.attendance_date,
        status: record.status,
        check_in_time: record.check_in_time || null,
        notes: record.notes || null,
        marked_by: user.id,
        marked_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(insertRecords, {
          onConflict: 'class_id,student_id,attendance_date',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ data, message: 'Attendance marked successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'PUT') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = userProfile.user_type === 'admin' || userProfile.user_type === 'it_admin';

      if (!teacher && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Only teachers can update attendance' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const attendanceId = path.split('/').pop();
      const body = await req.json();

      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*, classes(teacher_id)')
        .eq('id', attendanceId)
        .maybeSingle();

      if (!existingRecord) {
        return new Response(
          JSON.stringify({ error: 'Attendance record not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (teacher && existingRecord.classes.teacher_id !== teacher.id && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Not the teacher of this class' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const validStatuses = ['present', 'absent', 'late', 'excused'];
      if (body.status && !validStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const updateData: any = {
        marked_by: user.id,
        marked_at: new Date().toISOString(),
      };

      if (body.status) updateData.status = body.status;
      if (body.check_in_time !== undefined) updateData.check_in_time = body.check_in_time;
      if (body.notes !== undefined) updateData.notes = body.notes;

      const { data, error } = await supabase
        .from('attendance_records')
        .update(updateData)
        .eq('id', attendanceId)
        .select();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ data, message: 'Attendance updated successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'DELETE') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = userProfile.user_type === 'admin' || userProfile.user_type === 'it_admin';

      if (!teacher && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Only teachers can delete attendance' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const attendanceId = path.split('/').pop();

      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*, classes(teacher_id)')
        .eq('id', attendanceId)
        .maybeSingle();

      if (!existingRecord) {
        return new Response(
          JSON.stringify({ error: 'Attendance record not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (teacher && existingRecord.classes.teacher_id !== teacher.id && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Not the teacher of this class' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', attendanceId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Attendance deleted successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
