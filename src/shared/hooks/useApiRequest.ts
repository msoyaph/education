/**
 * React hook for API requests with tenant context
 * 
 * Automatically injects school_id from TenantContext
 */

import { useCallback } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { apiRequest, apiGet, apiPost, apiPut, apiDelete, type RequestOptions } from '../services/apiClient';

/**
 * Hook that provides API methods with automatic tenant context injection
 */
export function useApiRequest() {
  const { school } = useTenant();

  const request = useCallback(
    async <T = any>(url: string, options: RequestOptions = {}): Promise<T> => {
      // Inject school_id from tenant context if available
      const schoolId = school?.id || options.schoolId;
      return apiRequest<T>(url, {
        ...options,
        schoolId,
      });
    },
    [school]
  );

  const get = useCallback(
    async <T = any>(url: string, options?: RequestOptions): Promise<T> => {
      const schoolId = school?.id || options?.schoolId;
      return apiGet<T>(url, {
        ...options,
        schoolId,
      });
    },
    [school]
  );

  const post = useCallback(
    async <T = any>(url: string, data?: any, options?: RequestOptions): Promise<T> => {
      const schoolId = school?.id || options?.schoolId;
      return apiPost<T>(url, data, {
        ...options,
        schoolId,
      });
    },
    [school]
  );

  const put = useCallback(
    async <T = any>(url: string, data?: any, options?: RequestOptions): Promise<T> => {
      const schoolId = school?.id || options?.schoolId;
      return apiPut<T>(url, data, {
        ...options,
        schoolId,
      });
    },
    [school]
  );

  const del = useCallback(
    async <T = any>(url: string, options?: RequestOptions): Promise<T> => {
      const schoolId = school?.id || options?.schoolId;
      return apiDelete<T>(url, {
        ...options,
        schoolId,
      });
    },
    [school]
  );

  return {
    request,
    get,
    post,
    put,
    delete: del,
  };
}
