export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  marked_by?: string;
  marked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendance {
  student_id: string;
  student_code: string;
  student_name: string;
  student_photo?: string;
  attendance_id?: string;
  status?: AttendanceStatus;
  check_in_time?: string;
  notes?: string;
  marked_at?: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface AttendanceHistoryItem extends AttendanceRecord {
  classes: {
    name: string;
    code: string;
  };
}
