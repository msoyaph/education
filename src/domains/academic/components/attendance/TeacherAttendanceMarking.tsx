import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Save, Calendar, Users } from 'lucide-react';
import type { AttendanceStatus, StudentAttendance } from '../../types/attendance';
import { getClassAttendance, markBulkAttendance } from '../../services/attendanceService';

interface TeacherAttendanceMarkingProps {
  classId: string;
  className: string;
}

export function TeacherAttendanceMarking({ classId, className }: TeacherAttendanceMarkingProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<Map<string, AttendanceStatus>>(new Map());

  useEffect(() => {
    loadAttendance();
  }, [classId, date]);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError(null);
      const data = await getClassAttendance(classId, date);
      setStudents(data);
      setChanges(new Map());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(studentId: string, status: AttendanceStatus) {
    setChanges(prev => new Map(prev).set(studentId, status));
    setSuccessMessage(null);
  }

  function handleQuickMarkAll(status: AttendanceStatus) {
    const newChanges = new Map<string, AttendanceStatus>();
    students.forEach(student => {
      newChanges.set(student.student_id, status);
    });
    setChanges(newChanges);
    setSuccessMessage(null);
  }

  async function handleSave() {
    if (changes.size === 0) {
      setError('No changes to save');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const records = Array.from(changes.entries()).map(([studentId, status]) => ({
        class_id: classId,
        student_id: studentId,
        attendance_date: date,
        status,
        check_in_time: status === 'present' || status === 'late' ? new Date().toTimeString().split(' ')[0] : undefined,
      }));

      await markBulkAttendance(records);
      setSuccessMessage(`Attendance saved for ${records.length} student${records.length > 1 ? 's' : ''}`);
      await loadAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  function getDisplayStatus(student: StudentAttendance): AttendanceStatus | null {
    return changes.get(student.student_id) || student.status || null;
  }

  const statusConfig = {
    present: { icon: CheckCircle, label: 'Present', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-600' },
    absent: { icon: XCircle, label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-600' },
    late: { icon: Clock, label: 'Late', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-600' },
    excused: { icon: AlertCircle, label: 'Excused', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-600' },
  };

  const summary = students.reduce((acc, student) => {
    const status = getDisplayStatus(student);
    if (status) {
      acc[status] = (acc[status] || 0) + 1;
    } else {
      acc.unmarked = (acc.unmarked || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Mark Attendance</h1>
            <p className="text-gray-600 mt-1">{className}</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Present</span>
            </div>
            <p className="text-2xl font-semibold text-green-700">{summary.present || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">Absent</span>
            </div>
            <p className="text-2xl font-semibold text-red-700">{summary.absent || 0}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">Late</span>
            </div>
            <p className="text-2xl font-semibold text-yellow-700">{summary.late || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">Excused</span>
            </div>
            <p className="text-2xl font-semibold text-blue-700">{summary.excused || 0}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700 self-center">Quick Mark All:</span>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => handleQuickMarkAll(status as AttendanceStatus)}
                className={`px-4 py-2 rounded-lg border-2 ${config.bg} ${config.border} ${config.color} font-medium text-sm hover:opacity-80 transition-opacity flex items-center gap-2`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student) => {
              const currentStatus = getDisplayStatus(student);
              const hasChange = changes.has(student.student_id);

              return (
                <div
                  key={student.student_id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    hasChange ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {student.student_photo ? (
                      <img
                        src={student.student_photo}
                        alt={student.student_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-lg">
                          {student.student_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{student.student_name}</p>
                      <p className="text-sm text-gray-500">{student.student_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const Icon = config.icon;
                      const isSelected = currentStatus === status;

                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.student_id, status as AttendanceStatus)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? `${config.bg} ${config.border} ${config.color}`
                              : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                          }`}
                          title={config.label}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && students.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No students enrolled in this class</p>
          </div>
        )}

        {students.length > 0 && (
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={loadAttendance}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || changes.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Attendance ({changes.size})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
