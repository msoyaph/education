/**
 * Hook for fetching attendance summary
 * 
 * TODO: Backend must implement GET /attendance/summary?school_id={id}
 */

import { useState, useEffect } from 'react';
import { useTenant } from '../../../shared/contexts/TenantContext';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';
import { ApiClientError } from '../../../shared/services/apiClient';

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
  const { get } = useApiRequest();
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
        
        // TODO: Replace with actual API endpoint
        // const result = await get<AttendanceSummary>(`/attendance/summary?school_id=${school.id}`);
        // setData(result);
        
        // Temporary mock data - REMOVE when backend is ready
        setData({
          today: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          },
          week: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            rate: 0,
          },
        });
      } catch (err) {
        const message = err instanceof ApiClientError 
          ? err.message 
          : 'Failed to load attendance summary';
        setError(message);
        console.error('Error fetching attendance summary:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [school?.id, get]);

  return { data, loading, error };
}
