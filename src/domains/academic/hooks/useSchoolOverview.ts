/**
 * Hook for fetching school overview data
 */

import { useState, useEffect } from 'react';
import { useTenant } from '../../../shared/contexts/TenantContext';
import { getSchoolStats } from '../../admin/services/schoolStatsService';
import { getRecentActivity } from '../../admin/services/activityService';

export interface SchoolOverview {
  attendance_today: number;
  attendance_week: number;
  student_count: number;
  teacher_count: number;
  class_count: number;
  recent_activity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  system_status: {
    status: 'operational' | 'degraded' | 'down';
    message: string;
  };
}

export function useSchoolOverview() {
  const { school } = useTenant();
  const [data, setData] = useState<SchoolOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!school?.id) {
      setLoading(false);
      return;
    }

    async function fetchOverview() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch stats and activity in parallel
        const [stats, activity] = await Promise.all([
          getSchoolStats(school.id),
          getRecentActivity(school.id, 10),
        ]);
        
        setData({
          attendance_today: 0, // Will be calculated from attendance data
          attendance_week: 0,
          student_count: stats.student_count,
          teacher_count: stats.teacher_count,
          class_count: stats.class_count,
          recent_activity: activity,
          system_status: {
            status: 'operational',
            message: 'All systems operational',
          },
        });
      } catch (err) {
        const message = err instanceof Error 
          ? err.message 
          : 'Failed to load school overview';
        setError(message);
        console.error('Error fetching school overview:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [school?.id]);

  return { data, loading, error };
}
