/**
 * Hook for fetching teacher's classes
 * 
 * TODO: Backend must implement GET /teachers/{id}/classes
 * Backend must validate teacher can only see their own classes
 */

import { useState, useEffect } from 'react';
import { useUser } from '../../../domains/auth/contexts/UserContext';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';
import { ApiClientError } from '../../../shared/services/apiClient';

export interface TeacherClass {
  id: string;
  name: string;
  code: string;
  subject: string;
  room: string;
  time: string;
  student_count: number;
  schedule: Array<{
    day: string;
    time: string;
    room: string;
  }>;
}

export function useTeacherClasses() {
  const { profile } = useUser();
  const { get } = useApiRequest();
  const [data, setData] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    async function fetchClasses() {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API endpoint
        // const result = await get<TeacherClass[]>(`/teachers/${profile.id}/classes`);
        // setData(result);
        
        // Temporary mock data - REMOVE when backend is ready
        setData([]);
      } catch (err) {
        const message = err instanceof ApiClientError 
          ? err.message 
          : 'Failed to load classes';
        setError(message);
        console.error('Error fetching teacher classes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
  }, [profile?.id, get]);

  return { data, loading, error };
}
