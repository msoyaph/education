/**
 * Capability-based route guard
 * 
 * IMPORTANT: UI permissions are NOT authoritative.
 * Backend must validate all capabilities server-side.
 * 
 * This component only controls UI visibility and routing.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import type { Capability } from '../utils/capabilities';
import { roleHasAnyCapability } from '../utils/capabilities';

interface CapabilityRouteProps {
  /**
   * Required capabilities - user must have at least one
   */
  requiredCapabilities: Capability[];
  
  /**
   * Fallback route if user lacks required capabilities
   * @default '/unauthorized'
   */
  fallbackRoute?: string;
}

export function CapabilityRoute({ 
  requiredCapabilities, 
  fallbackRoute = '/unauthorized' 
}: CapabilityRouteProps) {
  const { profile, loading, hasPermission } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  // Check capabilities using UserContext (which loads from backend)
  const hasCapability = requiredCapabilities.some(cap => {
    const [resource, action] = cap.split(':');
    return hasPermission(resource, action);
  });

  // Fallback to role-based check if UserContext permissions not loaded
  // TODO: Remove this fallback once backend always provides capabilities
  const hasCapabilityByRole = roleHasAnyCapability(profile.user_type, requiredCapabilities);

  if (!hasCapability && !hasCapabilityByRole) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
}
