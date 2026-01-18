/**
 * Standardized API client
 * 
 * Provides:
 * - Automatic tenant context injection
 * - Standardized error handling
 * - Request/response interceptors
 * - Loading state management
 */

import { supabase } from '../lib/supabase';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ApiClientError extends Error {
  code?: string;
  status?: number;
  details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  /**
   * School ID to include in request
   * If not provided, will attempt to resolve from tenant context
   */
  schoolId?: string;
  
  /**
   * Skip tenant validation (use with caution)
   */
  skipTenantCheck?: boolean;
}

/**
 * Get authentication headers with session token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiClientError('Not authenticated', 'UNAUTHENTICATED', 401);
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Resolve school ID from tenant context
 * 
 * TODO: Backend must validate school_id matches user's school_id
 * Frontend provides school_id for convenience, but backend is authoritative
 */
async function resolveSchoolId(): Promise<string | null> {
  // Try to get from user profile (fallback)
  // In production, TenantContext should provide this
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('school_id')
    .eq('id', session.user.id)
    .maybeSingle();

  return profile?.school_id || null;
}

/**
 * Get school ID from global tenant context
 * This should be called from React components that have access to TenantContext
 * 
 * NOTE: useApiRequest hook already implements this functionality
 * This function is kept for backward compatibility
 */
export function getSchoolIdFromContext(): string | null {
  // useApiRequest hook already handles tenant context injection
  // This function is deprecated - use useApiRequest hook instead
  return null;
}

/**
 * Standardized fetch wrapper with tenant context
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    schoolId,
    skipTenantCheck = false,
    headers = {},
    body,
    ...fetchOptions
  } = options;

  try {
    // Get auth headers
    const authHeaders = await getAuthHeaders();

    // Resolve school ID if not provided
    let resolvedSchoolId = schoolId;
    if (!resolvedSchoolId && !skipTenantCheck) {
      resolvedSchoolId = await resolveSchoolId() || undefined;
    }

    // Prepare request body with tenant context
    let requestBody = body;
    if (body && resolvedSchoolId && !skipTenantCheck) {
      try {
        const bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
        requestBody = JSON.stringify({
          ...bodyObj,
          school_id: resolvedSchoolId,
        });
      } catch {
        // If body is not JSON, use as-is
        requestBody = body;
      }
    }

    // Merge headers
    const mergedHeaders = {
      ...authHeaders,
      ...headers,
    };

    // Add school_id to headers if not in body
    if (resolvedSchoolId && !skipTenantCheck && !body) {
      (mergedHeaders as any)['X-School-Id'] = resolvedSchoolId;
    }

    // Make request
    const response = await fetch(url, {
      ...fetchOptions,
      headers: mergedHeaders,
      body: requestBody,
    });

    // Parse response
    const data = await response.json().catch(() => ({}));

    // Handle errors
    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      throw new ApiClientError(
        errorMessage,
        data.code || `HTTP_${response.status}`,
        response.status,
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiClientError(
        'Network error: Unable to reach server',
        'NETWORK_ERROR',
        0
      );
    }

    // Re-throw unknown errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      0
    );
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'DELETE',
  });
}
