import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  User,
  Users,
  Settings,
  Award,
  FileText,
} from 'lucide-react';
import { useUser, UserRole } from '../../domains/auth/contexts/UserContext';

interface MobileNavItem {
  icon: any;
  label: string;
  path: string;
}

const mobileNavigationByRole: Record<UserRole, MobileNavItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: 'Home', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BookOpen, label: 'Classes', path: '/admin/classes' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Home', path: '/teacher' },
    { icon: CheckSquare, label: 'Attendance', path: '/teacher/attendance' },
    { icon: BookOpen, label: 'Classes', path: '/teacher/classes' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'Home', path: '/parent' },
    { icon: Users, label: 'Children', path: '/parent/children' },
    { icon: CheckSquare, label: 'Attendance', path: '/parent/attendance' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Home', path: '/student' },
    { icon: CheckSquare, label: 'Attendance', path: '/student/attendance' },
    { icon: Award, label: 'Grades', path: '/student/grades' },
    { icon: FileText, label: 'Assignments', path: '/student/assignments' },
  ],
  staff: [
    { icon: LayoutDashboard, label: 'Home', path: '/staff' },
    { icon: Users, label: 'Students', path: '/staff/students' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  it_admin: [
    { icon: LayoutDashboard, label: 'Home', path: '/admin' },
    { icon: Settings, label: 'System', path: '/admin/system' },
    { icon: User, label: 'Profile', path: '/profile' },
  ],
  super_admin: [
    { icon: LayoutDashboard, label: 'Home', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Settings, label: 'System', path: '/admin/system' },
  ],
};

export function MobileNav() {
  const location = useLocation();
  const { role } = useUser();

  const navItems = role ? mobileNavigationByRole[role] : [];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
