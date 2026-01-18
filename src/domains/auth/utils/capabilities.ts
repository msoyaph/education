/**
 * Capability-based access control system
 * 
 * Replaces hardcoded role checks with capability checks.
 * Backend must validate all capabilities server-side.
 */

import { UserRole } from '../contexts/UserContext';

export type Resource = 
  | 'attendance'
  | 'classes'
  | 'students'
  | 'teachers'
  | 'parents'
  | 'admin'
  | 'notifications'
  | 'reports'
  | 'settings'
  | 'users';

export type Action = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'view'
  | 'mark'
  | 'approve';

export type Capability = `${Resource}:${Action}`;

/**
 * Role-to-capability mapping
 * TODO: Backend should provide this mapping via API
 * This is a fallback for frontend-only checks (UI permissions are NOT authoritative)
 */
const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  super_admin: [
    // Super admin has all capabilities
    'admin:manage',
    'users:manage',
    'attendance:manage',
    'classes:manage',
    'students:manage',
    'teachers:manage',
    'parents:manage',
    'notifications:manage',
    'reports:manage',
    'settings:manage',
  ],
  admin: [
    'admin:view',
    'users:read',
    'users:create',
    'users:update',
    'attendance:read',
    'attendance:view',
    'classes:read',
    'classes:create',
    'classes:update',
    'students:read',
    'students:create',
    'students:update',
    'teachers:read',
    'teachers:create',
    'teachers:update',
    'parents:read',
    'parents:create',
    'parents:update',
    'notifications:read',
    'notifications:create',
    'reports:read',
    'reports:view',
    'settings:read',
    'settings:update',
  ],
  it_admin: [
    'admin:view',
    'users:read',
    'users:update',
    'settings:read',
    'settings:update',
    'reports:read',
    'reports:view',
  ],
  staff: [
    'attendance:read',
    'attendance:view',
    'classes:read',
    'students:read',
    'teachers:read',
    'parents:read',
    'notifications:read',
    'reports:read',
    'reports:view',
  ],
  teacher: [
    'attendance:read',
    'attendance:mark',
    'attendance:view',
    'classes:read',
    'classes:view',
    'students:read',
    'students:view',
    'notifications:read',
    'notifications:create',
    'reports:read',
    'reports:view',
  ],
  parent: [
    'attendance:view',
    'students:view', // Only their children
    'notifications:read',
    'notifications:view',
  ],
  student: [
    'attendance:view', // Only their own
    'notifications:read',
    'notifications:view',
  ],
};

/**
 * Get capabilities for a role
 * TODO: Replace with API call to backend
 */
export function getCapabilitiesForRole(role: UserRole | null): Capability[] {
  if (!role) return [];
  return ROLE_CAPABILITIES[role] || [];
}

/**
 * Check if a role has a specific capability
 * TODO: Replace with API call to backend
 */
export function roleHasCapability(role: UserRole | null, capability: Capability): boolean {
  if (!role) return false;
  const capabilities = getCapabilitiesForRole(role);
  return capabilities.includes(capability);
}

/**
 * Check if a role has any of the specified capabilities
 */
export function roleHasAnyCapability(role: UserRole | null, capabilities: Capability[]): boolean {
  if (!role) return false;
  return capabilities.some(cap => roleHasCapability(role, cap));
}

/**
 * Check if a role has all of the specified capabilities
 */
export function roleHasAllCapabilities(role: UserRole | null, capabilities: Capability[]): boolean {
  if (!role) return false;
  return capabilities.every(cap => roleHasCapability(role, cap));
}
