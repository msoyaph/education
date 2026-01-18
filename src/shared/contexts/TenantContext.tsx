import { createContext, useContext, useEffect, useState } from 'react';
import { TenantService } from '../services/tenantService';
import { FeatureFlagService } from '../utils/featureFlags';
import type { School } from '../types/tenant';
import { useAuth } from '../../domains/auth/contexts/AuthContext';

interface TenantContextType {
  school: School | null;
  isLoading: boolean;
  error: string | null;
  featureFlags: FeatureFlagService | null;
  refreshSchool: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagService | null>(null);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resolvedSchool = await TenantService.resolveCurrentTenant();

      if (!resolvedSchool) {
        setError('Unable to resolve school from subdomain');
        setIsLoading(false);
        return;
      }

      if (!resolvedSchool.is_active) {
        setError('School account is inactive');
        setIsLoading(false);
        return;
      }

      setSchool(resolvedSchool);
      setFeatureFlags(new FeatureFlagService(resolvedSchool.features));

      TenantService.applyBranding(resolvedSchool);
    } catch (err) {
      console.error('Error loading tenant:', err);
      setError(err instanceof Error ? err.message : 'Failed to load school configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

  useEffect(() => {
    if (user && school) {
      console.log('Tenant context loaded:', {
        schoolId: school.id,
        schoolSlug: school.slug,
        userId: user.id,
      });
    }
  }, [user, school]);

  const value: TenantContextType = {
    school,
    isLoading,
    error,
    featureFlags,
    refreshSchool: loadTenant,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
