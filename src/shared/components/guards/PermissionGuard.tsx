/**
 * PermissionGuard - Protects routes/components based on capabilities
 * 
 * IMPORTANT: UI permissions are NOT authoritative.
 * Backend must validate all capabilities server-side.
 * 
 * This component only controls UI visibility and routing.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../../domains/auth/contexts/UserContext';
import type { Capability } from '../../../domains/auth/utils/capabilities';
import { roleHasAnyCapability } from '../../../domains/auth/utils/capabilities';

interface PermissionGuardProps {
  /**
   * Required capabilities - user must have at least one
   */
  requiredCapabilities: Capability[];
  
  /**
   * Content to render if user has required capability
   */
  children: ReactNode;
  
  /**
   * Fallback route if user lacks required capability
   * @default '/unauthorized'
   */
  fallbackRoute?: string;
  
  /**
   * Show loading state while checking permissions
   */
  loadingComponent?: ReactNode;
  
  /**
   * If true, user must have ALL capabilities (not just one)
   * @default false
   */
  requireAll?: boolean;
}

export function PermissionGuard({
  requiredCapabilities,
  children,
  fallbackRoute = '/unauthorized',
  loadingComponent,
  requireAll = false,
}: PermissionGuardProps) {
  const { profile, loading, hasPermission } = useUser();

  if (loading) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Check capabilities using UserContext (which loads from backend)
  let hasCapability = false;
  
  if (requireAll) {
    hasCapability = requiredCapabilities.every(cap => {
      const [resource, action] = cap.split(':');
      return hasPermission(resource, action);
    });
  } else {
    hasCapability = requiredCapabilities.some(cap => {
      const [resource, action] = cap.split(':');
      return hasPermission(resource, action);
    });
  }

  // Fallback to role-based check if UserContext permissions not loaded
  // TODO: Remove this fallback once backend always provides capabilities
  if (!hasCapability) {
    const hasCapabilityByRole = roleHasAnyCapability(profile.user_type, requiredCapabilities);
    if (!hasCapabilityByRole) {
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return <>{children}</>;
}
