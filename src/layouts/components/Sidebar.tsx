import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CheckSquare,
  Award,
  Calendar,
  MessageSquare,
  Settings,
  Shield,
  BarChart,
  School,
  FileText,
  DollarSign,
  X,
  GraduationCap,
  Activity,
  Flag,
  TrendingUp,
} from 'lucide-react';
import { useUser, UserRole } from '../../domains/auth/contexts/UserContext';

interface NavItem {
  icon: any;
  label: string;
  path: string;
}

const navigationByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: School, label: 'Schools', path: '/admin/schools' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Shield, label: 'Roles', path: '/admin/roles' },
    { icon: BookOpen, label: 'Classes', path: '/admin/classes' },
    { icon: BarChart, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
    { icon: BookOpen, label: 'My Classes', path: '/teacher/classes' },
    { icon: CheckSquare, label: 'Attendance', path: '/teacher/attendance' },
    { icon: Award, label: 'Gradebook', path: '/teacher/gradebook' },
    { icon: Calendar, label: 'Schedule', path: '/teacher/schedule' },
    { icon: MessageSquare, label: 'Messages', path: '/teacher/messages' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/parent' },
    { icon: Users, label: 'My Children', path: '/parent/children' },
    { icon: CheckSquare, label: 'Attendance', path: '/parent/attendance' },
    { icon: Award, label: 'Grades', path: '/parent/grades' },
    { icon: FileText, label: 'Assignments', path: '/parent/assignments' },
    { icon: DollarSign, label: 'Fees', path: '/parent/fees' },
    { icon: MessageSquare, label: 'Messages', path: '/parent/messages' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
    { icon: CheckSquare, label: 'My Attendance', path: '/student/attendance' },
    { icon: Award, label: 'My Grades', path: '/student/grades' },
    { icon: FileText, label: 'Assignments', path: '/student/assignments' },
    { icon: Calendar, label: 'Schedule', path: '/student/schedule' },
    { icon: BookOpen, label: 'Classes', path: '/student/classes' },
  ],
  staff: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/staff' },
    { icon: Users, label: 'Students', path: '/staff/students' },
    { icon: MessageSquare, label: 'Messages', path: '/staff/messages' },
  ],
  it_admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/it' },
    { icon: Settings, label: 'Integrations', path: '/it/integrations' },
    { icon: Shield, label: 'API Keys', path: '/it/api-keys' },
    { icon: Activity, label: 'Logs', path: '/it/logs' },
    { icon: Settings, label: 'Updates', path: '/it/updates' },
  ],
  super_admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin' },
    { icon: School, label: 'Schools', path: '/superadmin/schools' },
    { icon: Users, label: 'Users', path: '/superadmin/users' },
    { icon: TrendingUp, label: 'Subscriptions', path: '/superadmin/subscriptions' },
    { icon: Flag, label: 'Feature Flags', path: '/superadmin/feature-flags' },
    { icon: Activity, label: 'Logs', path: '/superadmin/logs' },
    { icon: Settings, label: 'Settings', path: '/superadmin/settings' },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { profile, role } = useUser();

  const navItems = role ? navigationByRole[role] : [];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:transform-none lg:h-screen`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">EduCRM</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {profile?.first_name?.[0]}
                  {profile?.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
