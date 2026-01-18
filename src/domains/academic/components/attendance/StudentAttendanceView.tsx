import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, TrendingUp, User } from 'lucide-react';
import type { AttendanceHistoryItem, AttendanceSummary } from '../../types/attendance';
import { getStudentAttendance } from '../../services/attendanceService';

interface StudentAttendanceViewProps {
  studentId: string;
  studentName: string;
  viewMode: 'student' | 'parent';
}

export function StudentAttendanceView({ studentId, studentName, viewMode }: StudentAttendanceViewProps) {
  const [records, setRecords] = useState<AttendanceHistoryItem[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadAttendance();
  }, [studentId, startDate, endDate]);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentAttendance(studentId, startDate, endDate);
      setRecords(data.data);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = {
    present: { icon: CheckCircle, label: 'Present', color: 'text-green-600', bg: 'bg-green-100' },
    absent: { icon: XCircle, label: 'Absent', color: 'text-red-600', bg: 'bg-red-100' },
    late: { icon: Clock, label: 'Late', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    excused: { icon: AlertCircle, label: 'Excused', color: 'text-blue-600', bg: 'bg-blue-100' },
  };

  const attendanceRate = summary
    ? Math.round(((summary.present + summary.late) / summary.total) * 100)
    : 0;

  function getRateColor(rate: number) {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(timeString?: string) {
    if (!timeString) return '-';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {viewMode === 'parent' ? 'Child Attendance' : 'My Attendance'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-gray-600">{studentName}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Attendance Rate</span>
              </div>
              <p className={`text-2xl font-semibold ${getRateColor(attendanceRate)}`}>
                {attendanceRate}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Total Days</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{summary.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Present</span>
              </div>
              <p className="text-2xl font-semibold text-green-700">{summary.present}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">Absent</span>
              </div>
              <p className="text-2xl font-semibold text-red-700">{summary.absent}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">Late</span>
              </div>
              <p className="text-2xl font-semibold text-yellow-700">{summary.late}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Excused</span>
              </div>
              <p className="text-2xl font-semibold text-blue-700">{summary.excused}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Attendance History</h2>
            {records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No attendance records found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => {
                  const config = statusConfig[record.status];
                  const Icon = config.icon;

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${config.bg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.classes.name}</p>
                          <p className="text-sm text-gray-500">{record.classes.code}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(record.attendance_date)}
                          </p>
                          {record.check_in_time && (
                            <p className="text-xs text-gray-500">
                              Check-in: {formatTime(record.check_in_time)}
                            </p>
                          )}
                        </div>
                        <div className={`px-4 py-2 rounded-full ${config.bg} flex items-center gap-2`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className={`font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
