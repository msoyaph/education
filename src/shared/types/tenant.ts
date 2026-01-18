export interface School {
  id: string;
  slug: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  timezone: string;
  logo_url?: string;
  is_active: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_renews_at?: string;
  max_students: number;
  max_teachers: number;
  max_admins: number;
  max_storage_gb: number;
  branding: SchoolBranding;
  features: FeatureFlags;
  settings: SchoolSettings;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'basic' | 'standard' | 'premium' | 'enterprise';

export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled';

export interface SchoolBranding {
  logo?: {
    url?: string;
    dark_mode_url?: string;
    width?: number;
    height?: number;
  };
  favicon?: {
    url?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text_primary?: string;
    text_secondary?: string;
    background?: string;
    surface?: string;
  };
  typography: {
    font_family: string;
    heading_font?: string;
  };
  theme?: {
    border_radius?: string;
    shadow_style?: 'soft' | 'sharp' | 'none';
  };
  custom_css?: string;
}

export interface FeatureFlags {
  attendance?: {
    enabled: boolean;
    period_tracking?: boolean;
    daily_tracking?: boolean;
    qr_code_scanning?: boolean;
  };
  grading?: {
    enabled: boolean;
    grade_book?: boolean;
    rubrics?: boolean;
    weighted_categories?: boolean;
  };
  messaging?: {
    enabled: boolean;
    teacher_parent?: boolean;
    teacher_student?: boolean;
    broadcast?: boolean;
  };
  parent_portal?: {
    enabled: boolean;
    attendance_view?: boolean;
    grade_view?: boolean;
    message_teachers?: boolean;
  };
  reports?: {
    enabled: boolean;
    basic_reports?: boolean;
    advanced_reports?: boolean;
    custom_reports?: boolean;
  };
  mobile_app?: {
    enabled: boolean;
    ios?: boolean;
    android?: boolean;
  };
  integrations?: {
    google_classroom?: boolean;
    microsoft_teams?: boolean;
    zoom?: boolean;
  };
}

export interface SchoolSettings {
  academic_year_start?: string;
  grading_system?: 'letter' | 'percentage' | 'gpa';
  attendance_tracking?: 'period' | 'daily';
  time_format?: '12h' | '24h';
  date_format?: string;
  language?: string;
  [key: string]: any;
}

export interface SchoolDomain {
  id: string;
  school_id: string;
  domain: string;
  is_primary: boolean;
  is_verified: boolean;
  verification_token?: string;
  verified_at?: string;
  ssl_enabled: boolean;
  ssl_certificate?: any;
  created_at: string;
  updated_at: string;
}
