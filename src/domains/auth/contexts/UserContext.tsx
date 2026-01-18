import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from './AuthContext';

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'staff' | 'it_admin' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_type: UserRole;
  school_id: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface UserContextType {
  profile: UserProfile | null;
  role: UserRole | null;
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = async () => {
    if (!user) {
      setProfile(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Database error loading user profile:', profileError);
        throw new Error(`Failed to load user profile: ${profileError.message}`);
      }

      if (!profileData) {
        console.warn('User profile not found for user:', user.id);
        // Don't throw - allow user to continue (they might need to complete profile setup)
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Load user roles and permissions (optional - user might not have roles assigned)
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            roles (
              id,
              name,
              role_capabilities (
                capabilities (
                  id,
                  name,
                  resource,
                  action
                )
              )
            )
          `)
          .eq('user_id', user.id);

        if (rolesError) {
          console.warn('Error loading user roles (non-critical):', rolesError);
          // Continue without roles - user might not have roles assigned yet
        } else if (rolesData && rolesData.length > 0) {
          const allPermissions: Permission[] = [];
          rolesData.forEach((userRole: any) => {
            if (userRole.roles?.role_capabilities) {
              userRole.roles.role_capabilities.forEach((rc: any) => {
                if (rc.capabilities) {
                  allPermissions.push(rc.capabilities);
                }
              });
            }
          });
          setPermissions(allPermissions);
        }
      } catch (rolesErr) {
        // Non-critical error - user can still function without roles
        console.warn('Error loading user roles (non-critical):', rolesErr);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const hasPermission = (resource: string, action: string): boolean => {
    if (profile?.user_type === 'super_admin' || profile?.user_type === 'admin') {
      return true;
    }

    return permissions.some(
      (p) => p.resource === resource && p.action === action
    );
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!profile) return false;
    return roles.includes(profile.user_type);
  };

  const value = {
    profile,
    role: profile?.user_type ?? null,
    permissions,
    loading,
    error,
    refreshProfile: loadUserProfile,
    hasPermission,
    hasRole,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
