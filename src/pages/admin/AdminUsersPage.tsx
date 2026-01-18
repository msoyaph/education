/**
 * Admin Users Management Page
 * 
 * Manages Teachers, Parents, and Students for the school
 * Respects school-scope and multi-tenancy
 * 
 * Features:
 * - Tabbed interface (Teachers, Parents, Students)
 * - Create, Read, Update, Delete operations
 * - School-scoped queries (all filtered by school_id)
 * - Search and filter functionality
 */

import { Users, Plus, Search, Filter, BookOpen, GraduationCap, User, Edit, Trash2, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { supabase } from '../../shared/lib/supabase';

type TabType = 'teachers' | 'parents' | 'students';

interface Teacher {
  id: string;
  school_id: string;
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  hire_date?: string;
  specialization?: string;
  qualification?: string;
  status: 'active' | 'inactive' | 'on_leave';
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

interface Parent {
  id: string;
  school_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  relationship?: string;
  occupation?: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  can_pickup: boolean;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  school_id: string;
  user_id?: string;
  student_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  enrollment_date?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  grade_level?: string;
  section?: string;
  created_at: string;
  updated_at: string;
}

// Component placeholders - these will be fully implemented in subsequent messages
function TeachersTab({ schoolId }: { schoolId: string | null }) {
  return (
    <div className="p-4">
      <p className="text-gray-600">Teachers management - Implementation in progress</p>
    </div>
  );
}

function ParentsTab({ schoolId }: { schoolId: string | null }) {
  return (
    <div className="p-4">
      <p className="text-gray-600">Parents management - Implementation in progress</p>
    </div>
  );
}

function StudentsTab({ schoolId }: { schoolId: string | null }) {
  return (
    <div className="p-4">
      <p className="text-gray-600">Students management - Implementation in progress</p>
    </div>
  );
}

function AdminUsersPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'teachers';
  const [searchQuery, setSearchQuery] = useState('');

  // Get school ID from tenant context or user profile
  const schoolId = school?.id || profile?.school_id || null;

  const tabs = [
    { id: 'teachers' as TabType, label: 'Teachers', icon: BookOpen },
    { id: 'parents' as TabType, label: 'Parents', icon: User },
    { id: 'students' as TabType, label: 'Students', icon: GraduationCap },
  ];

  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Unable to load school information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage Teachers, Parents, and Students for your school</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'teachers' && <TeachersTab schoolId={schoolId} />}
          {activeTab === 'parents' && <ParentsTab schoolId={schoolId} />}
          {activeTab === 'students' && <StudentsTab schoolId={schoolId} />}
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <AdminUsersPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
