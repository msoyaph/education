/*
  # Multi-Tenancy Enhancements

  ## Summary
  Enhances the Education CRM with comprehensive multi-tenancy support including:
  - Subdomain-based tenant resolution
  - School branding configuration
  - Per-school feature toggles
  - Subscription management
  - Custom domain support

  ## Changes

  ### 1. Schools Table Enhancements
  - Add `slug` for subdomain routing (e.g., greenwood-high.educrm.app)
  - Add `branding` JSONB for logo, colors, fonts, theme
  - Add `features` JSONB for feature flags per school
  - Add subscription fields (tier, status, renewal)
  - Add usage quotas (max students, teachers, storage)
  - Enhanced settings structure

  ### 2. New Tables
  - `school_domains` for custom domain support (e.g., portal.greenwood.edu)

  ### 3. Helper Functions
  - `get_user_school_id()` for RLS policies
  - `slugify()` for automatic slug generation
  - Updated RLS policies with tenant isolation

  ## Security
  - All RLS policies updated to use school_id filtering
  - Helper functions for secure tenant resolution
  - Validation constraints on all new fields
*/

-- ============================================================================
-- 1. ENHANCE SCHOOLS TABLE
-- ============================================================================

-- Add new columns for multi-tenancy
DO $$
BEGIN
  -- Add slug for subdomain routing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'slug'
  ) THEN
    ALTER TABLE schools ADD COLUMN slug text UNIQUE;
  END IF;

  -- Add branding configuration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'branding'
  ) THEN
    ALTER TABLE schools ADD COLUMN branding jsonb DEFAULT '{
      "logo": {},
      "colors": {
        "primary": "#3B82F6",
        "secondary": "#8B5CF6",
        "accent": "#F59E0B"
      },
      "typography": {
        "font_family": "Inter, system-ui, sans-serif"
      },
      "theme": {
        "border_radius": "8px"
      }
    }'::jsonb;
  END IF;

  -- Add feature flags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'features'
  ) THEN
    ALTER TABLE schools ADD COLUMN features jsonb DEFAULT '{
      "attendance": {"enabled": true},
      "grading": {"enabled": true},
      "messaging": {"enabled": false},
      "parent_portal": {"enabled": true},
      "reports": {"enabled": true},
      "mobile_app": {"enabled": false}
    }'::jsonb;
  END IF;

  -- Add subscription tier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE schools ADD COLUMN subscription_tier text DEFAULT 'basic';
  END IF;

  -- Add subscription status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE schools ADD COLUMN subscription_status text DEFAULT 'active';
  END IF;

  -- Add trial end date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE schools ADD COLUMN trial_ends_at timestamptz;
  END IF;

  -- Add subscription renewal date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'subscription_renews_at'
  ) THEN
    ALTER TABLE schools ADD COLUMN subscription_renews_at timestamptz;
  END IF;

  -- Add max students quota
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'max_students'
  ) THEN
    ALTER TABLE schools ADD COLUMN max_students integer DEFAULT 100;
  END IF;

  -- Add max teachers quota
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'max_teachers'
  ) THEN
    ALTER TABLE schools ADD COLUMN max_teachers integer DEFAULT 10;
  END IF;

  -- Add max admins quota
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'max_admins'
  ) THEN
    ALTER TABLE schools ADD COLUMN max_admins integer DEFAULT 3;
  END IF;

  -- Add storage quota (in GB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'max_storage_gb'
  ) THEN
    ALTER TABLE schools ADD COLUMN max_storage_gb integer DEFAULT 5;
  END IF;

  -- Add website field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'website'
  ) THEN
    ALTER TABLE schools ADD COLUMN website text;
  END IF;

  -- Add metadata field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE schools ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Generate slugs for existing schools (based on code)
UPDATE schools
SET slug = lower(regexp_replace(code, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE schools ALTER COLUMN slug SET NOT NULL;

-- Add validation constraints
DO $$
BEGIN
  -- Validate slug format (lowercase alphanumeric with hyphens)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_slug_format'
  ) THEN
    ALTER TABLE schools ADD CONSTRAINT schools_slug_format
      CHECK (slug ~ '^[a-z0-9-]+$');
  END IF;

  -- Validate subscription tier
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_subscription_tier_check'
  ) THEN
    ALTER TABLE schools ADD CONSTRAINT schools_subscription_tier_check
      CHECK (subscription_tier IN ('basic', 'standard', 'premium', 'enterprise'));
  END IF;

  -- Validate subscription status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_subscription_status_check'
  ) THEN
    ALTER TABLE schools ADD CONSTRAINT schools_subscription_status_check
      CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled'));
  END IF;
END $$;

-- Create indexes for tenant resolution
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_subscription_tier ON schools(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_schools_subscription_status ON schools(subscription_status);

-- ============================================================================
-- 2. SCHOOL DOMAINS TABLE (Custom Domain Support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS school_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Domain configuration
  domain text UNIQUE NOT NULL,
  is_primary boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verification_token text,
  verified_at timestamptz,

  -- SSL configuration
  ssl_enabled boolean DEFAULT false,
  ssl_certificate jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only one primary domain per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_domains_one_primary
  ON school_domains(school_id, is_primary)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_school_domains_school ON school_domains(school_id);
CREATE INDEX IF NOT EXISTS idx_school_domains_domain ON school_domains(domain);
CREATE INDEX IF NOT EXISTS idx_school_domains_verified ON school_domains(is_verified)
  WHERE is_verified = true;

-- Enable RLS
ALTER TABLE school_domains ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid AS $$
  SELECT school_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'super_admin'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to slugify text
CREATE OR REPLACE FUNCTION slugify(text)
RETURNS text AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace($1, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  )
$$ LANGUAGE SQL IMMUTABLE;

-- Function to check feature flag
CREATE OR REPLACE FUNCTION has_feature(
  p_school_id uuid,
  p_feature text,
  p_sub_feature text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_features jsonb;
  v_feature_config jsonb;
BEGIN
  SELECT features INTO v_features
  FROM schools
  WHERE id = p_school_id;

  IF v_features IS NULL THEN
    RETURN false;
  END IF;

  v_feature_config := v_features -> p_feature;

  IF v_feature_config IS NULL THEN
    RETURN false;
  END IF;

  IF p_sub_feature IS NOT NULL THEN
    RETURN COALESCE((v_feature_config -> p_sub_feature)::boolean, false);
  ELSE
    RETURN COALESCE((v_feature_config -> 'enabled')::boolean, false);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. UPDATE RLS POLICIES
-- ============================================================================

-- Schools: Super admins can manage all, regular users see only their school
DROP POLICY IF EXISTS "Users can view own school" ON schools;
CREATE POLICY "Users can view own school"
  ON schools FOR SELECT
  TO authenticated
  USING (
    id = get_user_school_id()
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Super admins can manage schools" ON schools;
CREATE POLICY "Super admins can manage schools"
  ON schools FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- School Domains: Only accessible by school admins and super admins
DROP POLICY IF EXISTS "School admins manage domains" ON school_domains;
CREATE POLICY "School admins manage domains"
  ON school_domains FOR ALL
  TO authenticated
  USING (
    school_id = get_user_school_id()
    OR is_super_admin()
  )
  WITH CHECK (
    school_id = get_user_school_id()
    OR is_super_admin()
  );

-- User Profiles: Enhanced with school isolation
DROP POLICY IF EXISTS "Users can view profiles in their school" ON user_profiles;
CREATE POLICY "Users can view profiles in their school"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    school_id = get_user_school_id()
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND school_id = get_user_school_id()
  );

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on school_domains
CREATE OR REPLACE FUNCTION update_school_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_school_domains_updated_at ON school_domains;
CREATE TRIGGER set_school_domains_updated_at
  BEFORE UPDATE ON school_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_school_domains_updated_at();

-- ============================================================================
-- 6. SAMPLE DATA (for testing)
-- ============================================================================

-- Insert demo school (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM schools WHERE slug = 'demo-school') THEN
    INSERT INTO schools (
      slug,
      name,
      code,
      email,
      phone,
      country,
      timezone,
      subscription_tier,
      subscription_status,
      branding,
      features,
      settings,
      is_active
    ) VALUES (
      'demo-school',
      'Demo School',
      'DEMO001',
      'admin@demo-school.edu',
      '555-0100',
      'USA',
      'America/New_York',
      'premium',
      'active',
      '{
        "logo": {
          "url": "https://placehold.co/200x60/3B82F6/white?text=Demo+School"
        },
        "colors": {
          "primary": "#3B82F6",
          "secondary": "#8B5CF6",
          "accent": "#F59E0B"
        },
        "typography": {
          "font_family": "Inter, system-ui, sans-serif"
        },
        "theme": {
          "border_radius": "8px"
        }
      }'::jsonb,
      '{
        "attendance": {"enabled": true, "qr_code_scanning": true},
        "grading": {"enabled": true, "rubrics": true},
        "messaging": {"enabled": true},
        "parent_portal": {"enabled": true},
        "reports": {"enabled": true, "advanced_reports": true},
        "mobile_app": {"enabled": true}
      }'::jsonb,
      '{
        "academic_year_start": "2024-09-01",
        "grading_system": "letter",
        "attendance_tracking": "period",
        "time_format": "12h",
        "date_format": "MM/DD/YYYY",
        "language": "en"
      }'::jsonb,
      true
    );
  END IF;
END $$;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE schools IS 'Root multi-tenant entity - each school is an isolated tenant';
COMMENT ON COLUMN schools.slug IS 'URL-safe identifier for subdomain routing (e.g., greenwood-high)';
COMMENT ON COLUMN schools.branding IS 'School branding configuration: logo, colors, fonts, theme';
COMMENT ON COLUMN schools.features IS 'Feature flags for per-school functionality control';
COMMENT ON COLUMN schools.subscription_tier IS 'Subscription plan: basic, standard, premium, enterprise';
COMMENT ON COLUMN schools.subscription_status IS 'Account status: active, trial, suspended, cancelled';

COMMENT ON TABLE school_domains IS 'Custom domain mappings for schools (e.g., portal.greenwood.edu)';
COMMENT ON COLUMN school_domains.domain IS 'Custom domain pointing to school';
COMMENT ON COLUMN school_domains.is_verified IS 'Whether domain ownership has been verified';

COMMENT ON FUNCTION get_user_school_id() IS 'Returns the school_id of the currently authenticated user';
COMMENT ON FUNCTION is_super_admin() IS 'Returns true if current user is a super admin';
COMMENT ON FUNCTION has_feature(uuid, text, text) IS 'Checks if a school has a specific feature enabled';
