import type { FeatureFlags } from '../types/tenant';

export type FeatureKey =
  | 'attendance'
  | 'grading'
  | 'messaging'
  | 'parent_portal'
  | 'reports'
  | 'mobile_app'
  | 'integrations';

export class FeatureFlagService {
  private features: FeatureFlags;

  constructor(features: FeatureFlags) {
    this.features = features || {};
  }

  isEnabled(feature: FeatureKey, subFeature?: string): boolean {
    const featureConfig = this.features[feature];

    if (!featureConfig) {
      return false;
    }

    if (subFeature) {
      return (featureConfig as any)[subFeature] === true;
    }

    // Check if featureConfig has enabled property (some features may not have it)
    return (featureConfig as any)?.enabled === true;
  }

  getConfig(feature: FeatureKey): any {
    return this.features[feature] || null;
  }

  hasAll(...features: FeatureKey[]): boolean {
    return features.every((f) => this.isEnabled(f));
  }

  hasAny(...features: FeatureKey[]): boolean {
    return features.some((f) => this.isEnabled(f));
  }

  getFeatureConfig<T = any>(feature: FeatureKey): T | null {
    return (this.features[feature] as T) || null;
  }

  getAllEnabledFeatures(): FeatureKey[] {
    return (Object.keys(this.features) as FeatureKey[]).filter((key) =>
      this.isEnabled(key)
    );
  }
}
