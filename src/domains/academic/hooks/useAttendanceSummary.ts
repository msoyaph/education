/**
 * Hook for fetching attendance summary
 */

import { useState, useEffect } from 'react';
import { useTenant } from '../../../shared/contexts/TenantContext';
import { supabase } from '../../../shared/lib/supabase';

export interface AttendanceSummary {
  today: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  };
  week: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    rate: number; // percentage
  };
}

export function useAttendanceSummary() {
  const { school } = useTenant();
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!school?.id) {
      setLoading(false);
      return;
    }

    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);
        
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStart = weekAgo.toISOString().split('T')[0];

        // Get today's attendance
        const { data: todayData, error: todayError } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('school_id', school.id)
          .eq('attendance_date', today);

        if (todayError) throw todayError;

        // Get this week's attendance
        const { data: weekData, error: weekError } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('school_id', school.id)
          .gte('attendance_date', weekStart)
          .lte('attendance_date', today);

        if (weekError) throw weekError;

        // Calculate today's stats
        const todayStats = {
          present: (todayData || []).filter((r: any) => r.status === 'present').length,
          absent: (todayData || []).filter((r: any) => r.status === 'absent').length,
          late: (todayData || []).filter((r: any) => r.status === 'late').length,
          excused: (todayData || []).filter((r: any) => r.status === 'excused').length,
          total: (todayData || []).length,
        };

        // Calculate week's stats
        const weekStats = {
          present: (weekData || []).filter((r: any) => r.status === 'present').length,
          absent: (weekData || []).filter((r: any) => r.status === 'absent').length,
          late: (weekData || []).filter((r: any) => r.status === 'late').length,
          excused: (weekData || []).filter((r: any) => r.status === 'excused').length,
          total: (weekData || []).length,
        };

        const weekRate = weekStats.total > 0
          ? Math.round((weekStats.present / weekStats.total) * 100)
          : 0;

        setData({
          today: todayStats,
          week: {
            ...weekStats,
            rate: weekRate,
          },
        });
      } catch (err) {
        const message = err instanceof Error 
          ? err.message 
          : 'Failed to load attendance summary';
        setError(message);
        console.error('Error fetching attendance summary:', err);
        // Set default empty data on error
        setData({
          today: { present: 0, absent: 0, late: 0, excused: 0, total: 0 },
          week: { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0 },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [school?.id]);

  return { data, loading, error };
}
