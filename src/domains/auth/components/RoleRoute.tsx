/**
 * Role-based route guard (legacy)
 * 
 * IMPORTANT: UI permissions are NOT authoritative.
 * Backend must validate all roles server-side.
 * 
 * This component only controls UI visibility and routing.
 * 
 * @deprecated Prefer CapabilityRoute for new routes
 * TODO: Migrate all routes to use CapabilityRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useUser, UserRole } from '../contexts/UserContext';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  
  /**
   * Fallback route if user lacks required role
   * @default '/unauthorized'
   */
  fallbackRoute?: string;
}

export function RoleRoute({ allowedRoles, fallbackRoute = '/unauthorized' }: RoleRouteProps) {
  const { profile, loading } = useUser();

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

  // TODO: Backend must validate this role check server-side
  if (!allowedRoles.includes(profile.user_type)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
}
