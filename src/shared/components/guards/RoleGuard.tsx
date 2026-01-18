/**
 * RoleGuard - Protects routes/components based on user roles
 * 
 * IMPORTANT: UI permissions are NOT authoritative.
 * Backend must validate all roles server-side.
 * 
 * This component only controls UI visibility and routing.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser, UserRole } from '../../../domains/auth/contexts/UserContext';

interface RoleGuardProps {
  /**
   * Allowed roles - user must have one of these roles
   */
  allowedRoles: UserRole[];
  
  /**
   * Content to render if user has required role
   */
  children: ReactNode;
  
  /**
   * Fallback route if user lacks required role
   * @default '/unauthorized'
   */
  fallbackRoute?: string;
  
  /**
   * Show loading state while checking role
   */
  loadingComponent?: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallbackRoute = '/unauthorized',
  loadingComponent,
}: RoleGuardProps) {
  const { profile, loading } = useUser();

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

  // TODO: Backend must validate this role check server-side
  if (!allowedRoles.includes(profile.user_type)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}
