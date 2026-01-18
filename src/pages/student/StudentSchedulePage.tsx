/**
 * Student Schedule Page
 * 
 * View own class schedule
 * School-scoped and respects multi-tenancy
 */

import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';
import { useTenant } from '../../shared/contexts/TenantContext';

function StudentSchedulePageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const schoolId = school?.id || profile?.school_id;
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!profile || !schoolId) {
      setLoading(false);
      return;
    }

    const loadSchedule = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual schedule API call
        // GET /schedule?student_id={profile.id}&school_id={schoolId}&date={selectedDate}
        
        // Placeholder data structure
        const placeholderSchedule: any[] = [];
        setSchedule(placeholderSchedule);
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [profile, schoolId, selectedDate]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const todaySchedule = schedule.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-600">View your class schedule</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        
        {todaySchedule.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No classes scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaySchedule.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.class_name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {item.start_time} - {item.end_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {item.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {item.teacher_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly View (Future Enhancement) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h2>
        <p className="text-sm text-gray-600">
          Weekly schedule view coming soon. For now, use the date selector above to view specific days.
        </p>
      </div>
    </div>
  );
}

export function StudentSchedulePage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <PermissionGuard requiredCapabilities={['classes:read']}>
        <StudentSchedulePageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}