import { School, BarChart3, Settings, Building2, Users, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { supabase } from '../../shared/lib/supabase';
import type { School as SchoolType } from '../../shared/types/tenant';

type TabType = 'dashboard' | 'customization';

function SchoolDashboardTab({ school }: { school: SchoolType | null }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!school) return;

      try {
        // Fetch statistics for the current school
        const [studentsResult, teachersResult, classesResult, usersResult] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
          supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
        ]);

        setStats({
          totalStudents: studentsResult.count || 0,
          totalTeachers: teachersResult.count || 0,
          totalClasses: classesResult.count || 0,
          totalUsers: usersResult.count || 0,
        });
      } catch (error) {
        console.error('Error loading school statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [school]);

  if (!school) {
    return (
      <div className="text-center py-12">
        <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No school information available</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Teachers',
      value: stats.totalTeachers,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      label: 'Active Classes',
      value: stats.totalClasses,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* School Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {school.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="w-24 h-24 rounded-lg object-cover" />
          ) : (
            <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{school.name}</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">School Code</p>
                <p className="text-base font-medium text-gray-900">{school.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900">{school.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-base font-medium text-gray-900">{school.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-base font-medium text-gray-900">
                  {school.city || 'N/A'}
                  {school.state && `, ${school.state}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subscription</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  school.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                  school.subscription_tier === 'premium' ? 'bg-blue-100 text-blue-800' :
                  school.subscription_tier === 'standard' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {school.subscription_tier?.toUpperCase() || 'BASIC'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  school.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {school.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded mt-2 animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Limits & Quotas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Limits & Quotas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Max Students</p>
            <p className="text-2xl font-bold text-gray-900">{school.max_students}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max Teachers</p>
            <p className="text-2xl font-bold text-gray-900">{school.max_teachers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max Admins</p>
            <p className="text-2xl font-bold text-gray-900">{school.max_admins}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Storage (GB)</p>
            <p className="text-2xl font-bold text-gray-900">{school.max_storage_gb}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchoolCustomizationTab({ school }: { school: SchoolType | null }) {
  if (!school) {
    return (
      <div className="text-center py-12">
        <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No school information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                value={school.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
              <input
                type="text"
                value={school.code}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={school.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={school.phone || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={school.city || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={school.state || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={school.country}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Academic Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year Start</label>
            <input
              type="date"
              value={school.settings?.academic_year_start || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
            <input
              type="text"
              value={school.settings?.grading_system || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Tracking</label>
            <input
              type="text"
              value={school.settings?.attendance_tracking || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enabled Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={school.features?.attendance?.enabled || false}
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Attendance</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={school.features?.grading?.enabled || false}
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Grading</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={school.features?.messaging?.enabled || false}
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Messaging</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={school.features?.parent_portal?.enabled || false}
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Parent Portal</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={school.features?.reports?.enabled || false}
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Reports</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={school.features?.mobile_app?.enabled || false}
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label className="text-sm text-gray-700">Mobile App</label>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> School customization settings are read-only for Administrators. 
          Contact your Super Administrator or system administrator to modify these settings.
        </p>
      </div>
    </div>
  );
}

function AdminSchoolsPageContent() {
  const { profile } = useUser();
  const { school, isLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Fallback: If TenantContext doesn't have school, try fetching from user profile
  const [fallbackSchool, setFallbackSchool] = useState<SchoolType | null>(null);
  const [loadingFallback, setLoadingFallback] = useState(false);

  useEffect(() => {
    const fetchSchoolFromProfile = async () => {
      if (school || !profile?.school_id) return;

      try {
        setLoadingFallback(true);
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', profile.school_id)
          .maybeSingle();

        if (!error && data) {
          setFallbackSchool(data);
        }
      } catch (error) {
        console.error('Error fetching school:', error);
      } finally {
        setLoadingFallback(false);
      }
    };

    fetchSchoolFromProfile();
  }, [school, profile]);

  const currentSchool = school || fallbackSchool;

  if (isLoading || loadingFallback) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
          <p className="text-gray-600">View your school dashboard and customization settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('customization')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'customization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <span>Customization</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && <SchoolDashboardTab school={currentSchool} />}
          {activeTab === 'customization' && <SchoolCustomizationTab school={currentSchool} />}
        </div>
      </div>
    </div>
  );
}

export function AdminSchoolsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <AdminSchoolsPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
