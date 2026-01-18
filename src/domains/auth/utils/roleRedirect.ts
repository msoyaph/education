import { UserRole } from '../contexts/UserContext';

export function getRoleBasedRoute(role: UserRole | null): string {
  if (!role) return '/login';

  const roleRoutes: Record<UserRole, string> = {
    admin: '/admin',
    super_admin: '/superadmin',
    it_admin: '/it',
    teacher: '/teacher',
    parent: '/parent',
    student: '/student',
    staff: '/admin',
  };

  return roleRoutes[role] || '/';
}
