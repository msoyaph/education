/**
 * Hook for fetching school overview data
 * 
 * TODO: Backend must implement GET /schools/{id}/overview
 */

import { useState, useEffect } from 'react';
import { useTenant } from '../../../shared/contexts/TenantContext';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';
import { ApiClientError } from '../../../shared/services/apiClient';

export interface SchoolOverview {
  attendance_today: number;
  attendance_week: number;
  student_count: number;
  teacher_count: number;
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
  const { get } = useApiRequest();
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
        
        // TODO: Replace with actual API endpoint
        // const result = await get<SchoolOverview>(`/schools/${school.id}/overview`);
        // setData(result);
        
        // Temporary mock data - REMOVE when backend is ready
        setData({
          attendance_today: 0,
          attendance_week: 0,
          student_count: 0,
          teacher_count: 0,
          recent_activity: [],
          system_status: {
            status: 'operational',
            message: 'All systems operational',
          },
        });
      } catch (err) {
        const message = err instanceof ApiClientError 
          ? err.message 
          : 'Failed to load school overview';
        setError(message);
        console.error('Error fetching school overview:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [school?.id, get]);

  return { data, loading, error };
}
