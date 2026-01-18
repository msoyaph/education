/**
 * Profile Page
 * 
 * User profile dashboard - accessible to all roles
 * Shows role-specific information
 * School-scoped and respects multi-tenancy
 */

import { User, Mail, Phone, Calendar, MapPin, Briefcase, Award, BookOpen, Edit, Save, X, Upload, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { supabase } from '../../shared/lib/supabase';
import { uploadAvatar } from '../../shared/services/avatarService';

interface TeacherInfo {
  id: string;
  employee_code: string;
  hire_date?: string;
  specialization?: string;
  qualification?: string;
  status: 'active' | 'inactive' | 'on_leave';
}

function ProfilePageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editedProfile, setEditedProfile] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });

  const schoolId = school?.id || profile?.school_id;

  useEffect(() => {
    if (!schoolId || !profile?.id) return;

    const loadTeacherInfo = async () => {
      // If user is a teacher, load additional teacher info
      if (profile.user_type === 'teacher') {
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('id, employee_code, hire_date, specialization, qualification, status')
            .eq('school_id', schoolId)
            .eq('user_id', profile.id)
            .maybeSingle();

          if (!error && data) {
            setTeacherInfo(data);
          }
        } catch (error) {
          console.error('Error loading teacher info:', error);
        }
      }
      setLoading(false);
    };

    loadTeacherInfo();
  }, [schoolId, profile?.id, profile?.user_type]);

  const handleSave = async () => {
    if (!profile?.id || !schoolId) return;

    try {
      setUploading(true);

      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if file is selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadAvatar(selectedFile, profile.id, schoolId);
          avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          alert(`Failed to upload avatar: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setUploading(false);
          return;
        }
      }

      // Update profile with new data and avatar URL
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          email: editedProfile.email,
          phone: editedProfile.phone || null,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      // Reload profile (context will update automatically)
      window.location.reload(); // Simple reload for now
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">View and manage your profile information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="relative inline-block">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-blue-600">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </span>
                </div>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md"
                    type="button"
                    title="Upload photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
            {selectedFile && isEditing && (
              <p className="text-xs text-gray-500 mb-2">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">{profile?.full_name}</h2>
            <p className="text-sm text-gray-600 capitalize mb-4">{profile?.user_type}</p>
            {school && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{school.name}</p>
                <p className="text-xs text-gray-500">{school.code}</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              {isEditing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.first_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.last_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  profile?.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Teacher-Specific Information */}
          {profile?.user_type === 'teacher' && teacherInfo && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Teacher Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                  <p className="text-gray-900">{teacherInfo.employee_code}</p>
                </div>
                {teacherInfo.hire_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Hire Date
                    </label>
                    <p className="text-gray-900">
                      {new Date(teacherInfo.hire_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {teacherInfo.specialization && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Specialization
                    </label>
                    <p className="text-gray-900">{teacherInfo.specialization}</p>
                  </div>
                )}
                {teacherInfo.qualification && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Qualification
                    </label>
                    <p className="text-gray-900">{teacherInfo.qualification}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    teacherInfo.status === 'active' ? 'bg-green-100 text-green-800' :
                    teacherInfo.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {teacherInfo.status === 'active' ? 'Active' :
                     teacherInfo.status === 'on_leave' ? 'On Leave' :
                     'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {profile?.last_login_at && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(profile.last_login_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  return (
    <RoleGuard allowedRoles={['admin', 'teacher', 'parent', 'student', 'staff', 'it_admin', 'super_admin']}>
      <ProfilePageContent />
    </RoleGuard>
  );
}
