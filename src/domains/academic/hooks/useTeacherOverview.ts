/**
 * Hook for fetching teacher overview data
 * 
 * TODO: Backend must implement GET /teachers/{id}/overview
 */

import { useState, useEffect } from 'react';
import { useUser } from '../../../domains/auth/contexts/UserContext';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';
import { ApiClientError } from '../../../shared/services/apiClient';

export interface TeacherOverview {
  total_classes: number;
  total_students: number;
  attendance_rate: number;
  pending_tasks: number;
  today_classes: Array<{
    id: string;
    name: string;
    time: string;
    room: string;
    students: number;
  }>;
}

export function useTeacherOverview() {
  const { profile } = useUser();
  const { get } = useApiRequest();
  const [data, setData] = useState<TeacherOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    async function fetchOverview() {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API endpoint
        // const result = await get<TeacherOverview>(`/teachers/${profile.id}/overview`);
        // setData(result);
        
        // Temporary mock data - REMOVE when backend is ready
        setData({
          total_classes: 0,
          total_students: 0,
          attendance_rate: 0,
          pending_tasks: 0,
          today_classes: [],
        });
      } catch (err) {
        const message = err instanceof ApiClientError 
          ? err.message 
          : 'Failed to load teacher overview';
        setError(message);
        console.error('Error fetching teacher overview:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [profile?.id, get]);

  return { data, loading, error };
}
