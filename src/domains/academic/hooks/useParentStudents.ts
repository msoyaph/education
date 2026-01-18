/**
 * Hook for fetching parent's linked students
 * 
 * TODO: Backend must implement GET /parents/{id}/students
 * Backend must validate parent can only see their own children
 */

import { useState, useEffect } from 'react';
import { useUser } from '../../../domains/auth/contexts/UserContext';
import { useApiRequest } from '../../../shared/hooks/useApiRequest';
import { ApiClientError } from '../../../shared/services/apiClient';

export interface ParentStudent {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  grade: string;
  class_name?: string;
  avatar_url?: string;
}

export function useParentStudents() {
  const { profile } = useUser();
  const { get } = useApiRequest();
  const [data, setData] = useState<ParentStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API endpoint
        // const result = await get<ParentStudent[]>(`/parents/${profile.id}/students`);
        // setData(result);
        
        // Temporary mock data - REMOVE when backend is ready
        setData([]);
      } catch (err) {
        const message = err instanceof ApiClientError 
          ? err.message 
          : 'Failed to load students';
        setError(message);
        console.error('Error fetching parent students:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [profile?.id, get]);

  return { data, loading, error };
}
