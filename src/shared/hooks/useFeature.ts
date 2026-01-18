import { useTenant } from '../contexts/TenantContext';
import type { FeatureKey } from '../utils/featureFlags';

export function useFeature(feature: FeatureKey, subFeature?: string): boolean {
  const { featureFlags } = useTenant();

  if (!featureFlags) {
    return false;
  }

  return featureFlags.isEnabled(feature, subFeature);
}

export function useFeatures(...features: FeatureKey[]): boolean {
  const { featureFlags } = useTenant();

  if (!featureFlags) {
    return false;
  }

  return featureFlags.hasAll(...features);
}

export function useAnyFeature(...features: FeatureKey[]): boolean {
  const { featureFlags } = useTenant();

  if (!featureFlags) {
    return false;
  }

  return featureFlags.hasAny(...features);
}

export function useFeatureConfig<T = any>(feature: FeatureKey): T | null {
  const { featureFlags } = useTenant();

  if (!featureFlags) {
    return null;
  }

  return featureFlags.getFeatureConfig<T>(feature);
}
