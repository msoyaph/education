import type { AttendanceStatus, StudentAttendance, AttendanceHistoryItem, AttendanceSummary } from '../types/attendance';
import { apiGet, apiPost, apiPut, apiDelete, ApiClientError } from '../../../shared/services/apiClient';

const ATTENDANCE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attendance`;

/**
 * Attendance Service
 * 
 * TODO: Backend must validate:
 * - Tenant isolation (school_id)
 * - User permissions (can user mark attendance for this class?)
 * - Class ownership (does teacher own this class?)
 */

export async function getClassAttendance(classId: string, date?: string): Promise<StudentAttendance[]> {
  const attendanceDate = date || new Date().toISOString().split('T')[0];
  
  try {
    const result = await apiGet<{ data: StudentAttendance[] }>(
      `${ATTENDANCE_FUNCTION_URL}/class/${classId}/${attendanceDate}`
    );
    return result.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError('Failed to fetch attendance', 'ATTENDANCE_FETCH_ERROR');
  }
}

export async function markAttendance(
  classId: string,
  studentId: string,
  date: string,
  status: AttendanceStatus,
  checkInTime?: string,
  notes?: string
): Promise<void> {
  // TODO: Backend must validate user has 'attendance:mark' capability for this class
  await apiPost(
    ATTENDANCE_FUNCTION_URL,
    {
      class_id: classId,
      student_id: studentId,
      attendance_date: date,
      status,
      check_in_time: checkInTime,
      notes,
    }
  );
}

export async function markBulkAttendance(
  records: Array<{
    class_id: string;
    student_id: string;
    attendance_date: string;
    status: AttendanceStatus;
    check_in_time?: string;
    notes?: string;
  }>
): Promise<void> {
  // TODO: Backend must validate all records belong to same class and user has permission
  await apiPost(ATTENDANCE_FUNCTION_URL, records);
}

export async function updateAttendance(
  attendanceId: string,
  updates: {
    status?: AttendanceStatus;
    check_in_time?: string;
    notes?: string;
  }
): Promise<void> {
  // TODO: Backend must validate user has 'attendance:update' capability
  await apiPut(`${ATTENDANCE_FUNCTION_URL}/${attendanceId}`, updates);
}

export async function deleteAttendance(attendanceId: string): Promise<void> {
  // TODO: Backend must validate user has 'attendance:delete' capability
  await apiDelete(`${ATTENDANCE_FUNCTION_URL}/${attendanceId}`);
}

export async function getStudentAttendance(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: AttendanceHistoryItem[]; summary: AttendanceSummary }> {
  // TODO: Backend must validate user has 'attendance:view' capability for this student
  let url = `${ATTENDANCE_FUNCTION_URL}/student/${studentId}`;
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (params.toString()) url += `?${params.toString()}`;

  return apiGet<{ data: AttendanceHistoryItem[]; summary: AttendanceSummary }>(url);
}
