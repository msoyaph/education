# Multi-Tenancy Architecture - Education CRM

## Overview

A comprehensive multi-tenancy architecture using the **shared schema with tenant isolation** pattern, providing secure data isolation, custom branding, and per-tenant feature management for an Education CRM serving multiple schools.

---

## Table of Contents

1. [Architecture Pattern](#architecture-pattern)
2. [Tenant Resolution Strategy](#tenant-resolution-strategy)
3. [Schema Design](#schema-design)
4. [Data Isolation & Security](#data-isolation--security)
5. [School Branding](#school-branding)
6. [Feature Toggles](#feature-toggles)
7. [Request Lifecycle](#request-lifecycle)
8. [Implementation Guide](#implementation-guide)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Pattern

### Selected: Shared Schema with Tenant ID

**Why this approach?**
- ✅ Cost-effective (single database, shared resources)
- ✅ Easy maintenance and updates
- ✅ Efficient resource utilization
- ✅ Supabase RLS provides row-level isolation
- ✅ Scalable for hundreds of schools
- ✅ Simplified backup and monitoring

**Alternative patterns considered:**
- ❌ Database per tenant: Too expensive, complex maintenance
- ❌ Schema per tenant: Limited scalability, connection pool issues

### Key Principles

1. **Every tenant-scoped table has `school_id`**
2. **RLS policies enforce school-level isolation**
3. **JWT contains school context**
4. **No cross-tenant queries allowed**
5. **Tenant resolution happens early in request lifecycle**

---

## Tenant Resolution Strategy

### 1. Subdomain-Based Resolution (Primary)

**Format**: `{school-slug}.educrm.app`

**Examples:**
- `greenwood-high.educrm.app` → Greenwood High School
- `demo.educrm.app` → Demo School
- `app.educrm.app` → Super Admin Portal

**Implementation:**
```typescript
// Extract school slug from subdomain
const hostname = window.location.hostname;
const subdomain = hostname.split('.')[0];

// Resolve school from slug
const school = await getSchoolBySlug(subdomain);
```

**Advantages:**
- Clear tenant isolation
- User-friendly URLs
- Easy to understand
- Natural branding opportunity

**Edge Cases:**
- `localhost:5173` → Development mode (bypass tenant check)
- `www.educrm.app` → Marketing site (no tenant)
- IP addresses → Reject (require domain)

---

### 2. JWT Claims-Based Resolution (Secondary)

After authentication, the JWT contains school context:

```json
{
  "sub": "user-uuid",
  "email": "teacher@greenwood.edu",
  "user_metadata": {
    "school_id": "school-uuid",
    "school_slug": "greenwood-high"
  },
  "app_metadata": {
    "school_id": "school-uuid",
    "school_slug": "greenwood-high",
    "school_name": "Greenwood High School",
    "user_type": "teacher"
  }
}
```

**Why both subdomain AND JWT?**
- Subdomain: Tenant resolution before login
- JWT: Tenant verification after login
- Double validation: Extra security layer

---

### 3. Header-Based Resolution (API Requests)

For API requests, especially from mobile apps:

```http
POST /api/attendance/mark
Host: api.educrm.app
X-School-ID: school-uuid
X-School-Slug: greenwood-high
Authorization: Bearer {jwt}
```

**Validation:**
```typescript
// Extract from header
const schoolId = req.headers['x-school-id'];

// Validate against JWT claims
if (schoolId !== jwt.app_metadata.school_id) {
  throw new Error('School ID mismatch');
}
```

---

### 4. Resolution Priority

```
1. Validate subdomain matches user's school
2. Validate JWT school_id matches subdomain
3. Validate user has access to school
4. Load school configuration
5. Apply feature flags
6. Proceed with request
```

---

## Schema Design

### Core Tables

#### 1. Schools Table (Tenant Master)

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  slug TEXT UNIQUE NOT NULL,  -- URL-safe identifier
  name TEXT NOT NULL,
  code TEXT UNIQUE,           -- School code (e.g., "GHS001")

  -- Contact & Location
  email TEXT,
  phone TEXT,
  website TEXT,
  address JSONB,              -- {street, city, state, zip, country}
  timezone TEXT DEFAULT 'UTC',

  -- Subscription & Status
  subscription_tier TEXT DEFAULT 'basic', -- basic, standard, premium, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, suspended, cancelled
  trial_ends_at TIMESTAMPTZ,
  subscription_renews_at TIMESTAMPTZ,

  -- Limits & Quotas
  max_students INTEGER DEFAULT 100,
  max_teachers INTEGER DEFAULT 10,
  max_admins INTEGER DEFAULT 3,
  max_storage_gb INTEGER DEFAULT 5,

  -- Branding
  branding JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "logo_url": "https://...",
  --   "favicon_url": "https://...",
  --   "primary_color": "#3B82F6",
  --   "secondary_color": "#8B5CF6",
  --   "font_family": "Inter"
  -- }

  -- Feature Flags
  features JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "attendance": true,
  --   "grading": true,
  --   "messaging": false,
  --   "parent_portal": true,
  --   "mobile_app": false,
  --   "advanced_reports": false
  -- }

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "academic_year_start": "2024-09-01",
  --   "grading_system": "letter", -- letter, percentage, gpa
  --   "attendance_tracking": "period", -- period, daily
  --   "time_format": "12h",
  --   "date_format": "MM/DD/YYYY",
  --   "language": "en"
  -- }

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_tier CHECK (subscription_tier IN ('basic', 'standard', 'premium', 'enterprise'))
);

-- Indexes
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_schools_active ON schools(is_active) WHERE is_active = true;
CREATE INDEX idx_schools_subscription ON schools(subscription_status);
```

#### 2. School Domains Table (Custom Domain Support)

```sql
CREATE TABLE school_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  domain TEXT UNIQUE NOT NULL, -- e.g., "portal.greenwood.edu"
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,

  ssl_enabled BOOLEAN DEFAULT false,
  ssl_certificate JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT one_primary_per_school UNIQUE (school_id, is_primary)
    WHERE is_primary = true
);

CREATE INDEX idx_school_domains_school ON school_domains(school_id);
CREATE INDEX idx_school_domains_domain ON school_domains(domain);
```

#### 3. Tenant-Scoped Tables

**Every tenant-scoped table must:**
1. Have `school_id UUID NOT NULL REFERENCES schools(id)`
2. Have RLS enabled
3. Have policies that filter by `school_id`
4. Have composite indexes including `school_id`

**Example: User Profiles**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE, -- CRITICAL

  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  -- ... other fields

  CONSTRAINT unique_user_per_school UNIQUE (id, school_id)
);

-- Composite indexes
CREATE INDEX idx_user_profiles_school ON user_profiles(school_id);
CREATE INDEX idx_user_profiles_school_type ON user_profiles(school_id, user_type);
```

---

### Tenant Isolation Patterns

#### Pattern 1: Direct School Reference

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- ...
);
```

#### Pattern 2: Indirect School Reference (via User)

```sql
CREATE TABLE student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id),
  -- school_id inherited from student_id's school
  -- ...
);
```

**RLS Policy:**
```sql
-- Check school via student
CREATE POLICY "Students can view own assignments"
ON student_assignments FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM user_profiles
    WHERE id = auth.uid()
    AND school_id = current_setting('app.current_school_id')::uuid
  )
);
```

---

## Data Isolation & Security

### Row Level Security (RLS) Policies

#### 1. School-Level Isolation

**Every query automatically filtered by school:**

```sql
-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their school's data
CREATE POLICY "Users access own school data"
ON classes FOR ALL
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);
```

#### 2. User-Level Permissions Within School

```sql
-- Teachers can view all classes in their school
CREATE POLICY "Teachers view school classes"
ON classes FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'teacher'
  )
);

-- Teachers can only modify classes they teach
CREATE POLICY "Teachers modify own classes"
ON classes FOR UPDATE
TO authenticated
USING (
  teacher_id = auth.uid()
  AND school_id IN (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
);
```

#### 3. Super Admin Access

```sql
-- Super admins can access all schools
CREATE POLICY "Super admins access all schools"
ON classes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'super_admin'
  )
);
```

### RLS Policy Template

```sql
-- Template for any tenant-scoped table
CREATE POLICY "policy_name"
ON table_name
FOR {SELECT | INSERT | UPDATE | DELETE | ALL}
TO authenticated
USING (
  -- READ CHECK: Can user read this row?
  school_id = (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
  AND {additional_conditions}
)
WITH CHECK (
  -- WRITE CHECK: Can user write this row?
  school_id = (
    SELECT school_id FROM user_profiles WHERE id = auth.uid()
  )
  AND {additional_conditions}
);
```

---

## School Branding

### Branding Configuration

**Stored in `schools.branding` JSONB:**

```json
{
  "logo": {
    "url": "https://cdn.educrm.app/schools/greenwood/logo.png",
    "dark_mode_url": "https://cdn.educrm.app/schools/greenwood/logo-dark.png",
    "width": 200,
    "height": 60
  },
  "favicon": {
    "url": "https://cdn.educrm.app/schools/greenwood/favicon.ico"
  },
  "colors": {
    "primary": "#047857",      // Greenwood green
    "secondary": "#DC2626",    // School red
    "accent": "#F59E0B",
    "text_primary": "#111827",
    "text_secondary": "#6B7280",
    "background": "#FFFFFF",
    "surface": "#F9FAFB"
  },
  "typography": {
    "font_family": "Inter, system-ui, sans-serif",
    "heading_font": "Poppins, sans-serif"
  },
  "theme": {
    "border_radius": "8px",     // UI rounding
    "shadow_style": "soft"      // soft, sharp, none
  },
  "custom_css": "https://cdn.educrm.app/schools/greenwood/custom.css"
}
```

### Frontend Implementation

```tsx
// contexts/TenantContext.tsx
import { createContext, useContext } from 'react';

interface TenantBranding {
  logo: { url: string; dark_mode_url?: string };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    font_family: string;
    heading_font?: string;
  };
}

interface TenantContextType {
  school: {
    id: string;
    slug: string;
    name: string;
    branding: TenantBranding;
    features: Record<string, boolean>;
    settings: Record<string, any>;
  };
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      // Extract subdomain
      const subdomain = window.location.hostname.split('.')[0];

      // Fetch school config
      const { data } = await supabase
        .from('schools')
        .select('id, slug, name, branding, features, settings')
        .eq('slug', subdomain)
        .single();

      if (data) {
        setSchool(data);
        applyBranding(data.branding);
      }

      setLoading(false);
    }

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ school, isLoading: loading }}>
      {children}
    </TenantContext.Provider>
  );
}

// Apply branding to DOM
function applyBranding(branding: TenantBranding) {
  const root = document.documentElement;

  // CSS variables
  root.style.setProperty('--color-primary', branding.colors.primary);
  root.style.setProperty('--color-secondary', branding.colors.secondary);
  root.style.setProperty('--color-accent', branding.colors.accent);
  root.style.setProperty('--font-family', branding.typography.font_family);

  // Favicon
  if (branding.favicon) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) link.href = branding.favicon.url;
  }

  // Page title
  document.title = `${school.name} - Education CRM`;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

### Dynamic Theme Application

```tsx
// components/ThemedButton.tsx
import { useTenant } from '../contexts/TenantContext';

export function ThemedButton({ children, ...props }) {
  const { school } = useTenant();

  return (
    <button
      style={{
        backgroundColor: school.branding.colors.primary,
        borderRadius: school.branding.theme.border_radius,
      }}
      className="px-4 py-2 text-white hover:opacity-90"
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## Feature Toggles

### Feature Flag System

**Stored in `schools.features` JSONB:**

```json
{
  "attendance": {
    "enabled": true,
    "period_tracking": true,
    "daily_tracking": false,
    "qr_code_scanning": false
  },
  "grading": {
    "enabled": true,
    "grade_book": true,
    "rubrics": false,
    "weighted_categories": true
  },
  "messaging": {
    "enabled": false,
    "teacher_parent": false,
    "teacher_student": false,
    "broadcast": false
  },
  "parent_portal": {
    "enabled": true,
    "attendance_view": true,
    "grade_view": true,
    "message_teachers": false
  },
  "reports": {
    "enabled": true,
    "basic_reports": true,
    "advanced_reports": false,
    "custom_reports": false
  },
  "mobile_app": {
    "enabled": false,
    "ios": false,
    "android": false
  },
  "integrations": {
    "google_classroom": false,
    "microsoft_teams": false,
    "zoom": false
  }
}
```

### Feature Flag Utilities

```typescript
// utils/featureFlags.ts
export type FeatureKey =
  | 'attendance'
  | 'grading'
  | 'messaging'
  | 'parent_portal'
  | 'reports'
  | 'mobile_app';

export class FeatureFlagService {
  private features: Record<string, any>;

  constructor(features: Record<string, any>) {
    this.features = features;
  }

  // Check if feature is enabled
  isEnabled(feature: FeatureKey, subFeature?: string): boolean {
    if (!this.features[feature]) return false;

    if (subFeature) {
      return this.features[feature]?.[subFeature] === true;
    }

    return this.features[feature]?.enabled === true;
  }

  // Get feature config
  getConfig(feature: FeatureKey): any {
    return this.features[feature] || null;
  }

  // Check multiple features (AND)
  hasAll(...features: FeatureKey[]): boolean {
    return features.every(f => this.isEnabled(f));
  }

  // Check multiple features (OR)
  hasAny(...features: FeatureKey[]): boolean {
    return features.some(f => this.isEnabled(f));
  }
}

// React Hook
export function useFeature(feature: FeatureKey, subFeature?: string): boolean {
  const { school } = useTenant();
  const service = new FeatureFlagService(school.features);
  return service.isEnabled(feature, subFeature);
}
```

### Usage in Components

```tsx
// Conditional rendering
function AttendanceSection() {
  const hasAttendance = useFeature('attendance');
  const hasQRCode = useFeature('attendance', 'qr_code_scanning');

  if (!hasAttendance) {
    return <UpgradePrompt feature="Attendance Tracking" />;
  }

  return (
    <div>
      <AttendanceTable />
      {hasQRCode && <QRCodeScanner />}
    </div>
  );
}

// Conditional routes
function AppRouter() {
  const { school } = useTenant();
  const features = new FeatureFlagService(school.features);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />

      {features.isEnabled('attendance') && (
        <Route path="/attendance" element={<AttendancePage />} />
      )}

      {features.isEnabled('grading') && (
        <Route path="/grades" element={<GradesPage />} />
      )}

      {features.isEnabled('messaging') && (
        <Route path="/messages" element={<MessagesPage />} />
      )}
    </Routes>
  );
}
```

### Backend Feature Checks

```typescript
// Edge function or API endpoint
export async function markAttendance(req: Request) {
  const schoolId = req.headers.get('x-school-id');

  // Load school config
  const { data: school } = await supabase
    .from('schools')
    .select('features')
    .eq('id', schoolId)
    .single();

  // Check feature access
  if (!school.features.attendance?.enabled) {
    return new Response(
      JSON.stringify({ error: 'Attendance feature not enabled' }),
      { status: 403 }
    );
  }

  // Proceed with attendance marking
  // ...
}
```

---

## Request Lifecycle

### Complete Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    1. REQUEST INITIATED                      │
│   User: teacher@greenwood.edu visits greenwood.educrm.app   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 2. SUBDOMAIN RESOLUTION                      │
│   • Extract subdomain: "greenwood"                           │
│   • DNS resolution                                           │
│   • SSL termination                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  3. TENANT IDENTIFICATION                    │
│   • Query: SELECT * FROM schools WHERE slug = 'greenwood'   │
│   • Validate school is active                                │
│   • Load school config (branding, features, settings)        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  4. AUTHENTICATION CHECK                     │
│   • Check for valid session                                  │
│   • If no session → Redirect to /login                       │
│   • If session exists → Verify JWT                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 5. TENANT BOUNDARY VALIDATION                │
│   • Extract school_id from JWT claims                        │
│   • Compare JWT school_id with subdomain school_id           │
│   • If mismatch → Reject (403 Forbidden)                     │
│   • If match → Proceed                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   6. USER AUTHORIZATION                      │
│   • Load user profile (with school_id)                       │
│   • Load user roles and permissions                          │
│   • Verify user has access to requested resource            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   7. FEATURE FLAG CHECK                      │
│   • Check if requested feature is enabled for school         │
│   • If disabled → Show upgrade prompt or 403                 │
│   • If enabled → Proceed                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    8. DATABASE QUERY                         │
│   • Supabase RLS automatically filters by school_id          │
│   • Query: SELECT * FROM classes WHERE school_id = ?         │
│   • RLS Policy: USING (school_id = user's school_id)         │
│   • Only school's data returned                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   9. RESPONSE RENDERING                      │
│   • Apply school branding (colors, logo, theme)              │
│   • Inject tenant context into UI                            │
│   • Return response                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     10. CLIENT RECEIVES                      │
│   • Page rendered with school branding                       │
│   • Tenant context available in React                        │
│   • Feature flags control UI elements                        │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Flow Diagrams

#### Authentication Flow

```
User Visits → Check Session → Session Valid?
                                    ↓ No
                          Redirect to /login
                                    ↓
                          Show login form (with school branding)
                                    ↓
                          Submit credentials
                                    ↓
                          Supabase Auth
                                    ↓
                     Generate JWT with school_id in claims
                                    ↓
                          Store session
                                    ↓
                     Redirect to dashboard
                                    ↓ Yes
                     Load User Profile
                                    ↓
                   Validate school_id matches subdomain
                                    ↓
                     Proceed to app
```

#### Data Access Flow

```
API Request → Extract JWT → Extract school_id from claims
                                    ↓
                   Set RLS context: SET app.current_school_id = ?
                                    ↓
                   Execute query with RLS
                                    ↓
           RLS Policy: Filter WHERE school_id = app.current_school_id
                                    ↓
                   Return filtered results
                                    ↓
                   Response to client
```

---

## Implementation Guide

### Step 1: Database Setup

```sql
-- Run migration to add multi-tenancy support
-- See migration file: 20260118_add_multi_tenancy_support.sql

-- Key additions:
-- 1. schools table with branding, features, settings
-- 2. school_domains for custom domains
-- 3. Update all tenant-scoped tables with school_id
-- 4. RLS policies for tenant isolation
```

### Step 2: Frontend Tenant Context

```tsx
// src/contexts/TenantContext.tsx
// Manages school config, branding, feature flags
// Loads on app initialization
// Provides useTenant() hook
```

### Step 3: Tenant Middleware

```typescript
// src/lib/tenantMiddleware.ts
export async function resolveTenant(): Promise<School> {
  // 1. Extract subdomain
  const subdomain = getSubdomain();

  // 2. Fetch school config
  const school = await getSchoolBySlug(subdomain);

  // 3. Validate school is active
  if (!school.is_active) {
    throw new Error('School account is inactive');
  }

  // 4. Return school config
  return school;
}

export function validateTenantBoundary(
  jwtSchoolId: string,
  subdomainSchoolId: string
): void {
  if (jwtSchoolId !== subdomainSchoolId) {
    throw new Error('School ID mismatch - potential security violation');
  }
}
```

### Step 4: RLS Helper Functions

```sql
-- PostgreSQL function to get current user's school
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Use in RLS policies
CREATE POLICY "Users access own school data"
ON any_table FOR ALL
TO authenticated
USING (school_id = get_user_school_id());
```

### Step 5: Feature Flag Integration

```tsx
// Update AppRouter with feature flags
function AppRouter() {
  const { school } = useTenant();
  const features = new FeatureFlagService(school.features);

  return (
    <Routes>
      {/* Always available */}
      <Route path="/" element={<Dashboard />} />

      {/* Feature-gated routes */}
      {features.isEnabled('attendance') && (
        <Route path="/attendance/*" element={<AttendanceRoutes />} />
      )}
    </Routes>
  );
}
```

---

## Security Considerations

### 1. Tenant Boundary Violations

**Threat**: User tries to access another school's data

**Protection**:
- RLS policies filter by school_id automatically
- JWT school_id validation
- Subdomain validation
- Audit logging of all cross-tenant attempts

### 2. JWT Token Manipulation

**Threat**: User modifies JWT to change school_id

**Protection**:
- JWT signed by Supabase (cannot be modified)
- Server-side validation
- Short token expiration (1 hour)
- Token refresh flow

### 3. Subdomain Spoofing

**Threat**: User tries to access via different subdomain

**Protection**:
- HTTPS only (no HTTP)
- HSTS headers
- DNS CAA records
- Subdomain validation against user's school

### 4. SQL Injection via school_id

**Threat**: Malicious school_id in query

**Protection**:
- Parameterized queries
- UUID validation
- RLS policies use trusted functions
- Input sanitization

### 5. Feature Flag Bypass

**Threat**: User tries to access disabled feature

**Protection**:
- Backend feature checks (not just frontend)
- API endpoints validate feature access
- Edge functions check feature flags
- UI elements hidden + routes blocked

### 6. Data Leakage via Errors

**Threat**: Error messages reveal other tenants' data

**Protection**:
- Generic error messages
- No stack traces in production
- Sanitize error responses
- Separate logging per tenant

---

## Testing Strategy

### 1. Unit Tests

```typescript
describe('TenantService', () => {
  it('should resolve tenant from subdomain', async () => {
    const tenant = await resolveTenant('greenwood');
    expect(tenant.slug).toBe('greenwood');
  });

  it('should reject inactive schools', async () => {
    await expect(resolveTenant('inactive-school')).rejects.toThrow();
  });

  it('should validate tenant boundary', () => {
    const jwtSchoolId = 'school-1';
    const subdomainSchoolId = 'school-2';

    expect(() => {
      validateTenantBoundary(jwtSchoolId, subdomainSchoolId);
    }).toThrow('School ID mismatch');
  });
});
```

### 2. Integration Tests

```typescript
describe('Multi-Tenancy', () => {
  it('should isolate data between schools', async () => {
    // Login as School A user
    const schoolA = await loginAs('teacher@schoola.com');
    const classesA = await getClasses();

    // Login as School B user
    const schoolB = await loginAs('teacher@schoolb.com');
    const classesB = await getClasses();

    // Verify no overlap
    expect(classesA).not.toContainAny(classesB);
  });

  it('should apply school branding', async () => {
    const branding = await getTenantBranding('greenwood');
    expect(branding.colors.primary).toBe('#047857');
  });
});
```

### 3. Security Tests

```typescript
describe('Tenant Security', () => {
  it('should reject cross-tenant access attempts', async () => {
    // Login to School A
    const user = await loginAs('teacher@schoola.com');

    // Try to access School B data
    const response = await fetch('/api/schools/school-b-id/classes', {
      headers: { Authorization: `Bearer ${user.jwt}` }
    });

    expect(response.status).toBe(403);
  });

  it('should validate JWT school_id matches subdomain', async () => {
    // JWT from School A
    const jwt = await getJWT('schoola');

    // Try to access School B subdomain
    const response = await fetch('https://schoolb.educrm.app/dashboard', {
      headers: { Authorization: `Bearer ${jwt}` }
    });

    expect(response.status).toBe(403);
  });
});
```

### 4. Load Tests

```typescript
describe('Multi-Tenancy Performance', () => {
  it('should handle 100 schools with 1000 requests each', async () => {
    const results = await Promise.all(
      schools.map(school =>
        loadTest(school, { requests: 1000, concurrent: 50 })
      )
    );

    // All schools should have < 200ms P95
    results.forEach(r => {
      expect(r.p95).toBeLessThan(200);
    });
  });
});
```

---

## Monitoring & Observability

### Metrics to Track

1. **Per-Tenant Metrics**
   - Active users per school
   - Request rate per school
   - Error rate per school
   - Storage usage per school
   - Feature usage per school

2. **Security Metrics**
   - Cross-tenant access attempts
   - Failed authentication attempts
   - JWT validation failures
   - RLS policy violations

3. **Performance Metrics**
   - Query latency by school
   - API response times
   - Database connection pool per school
   - Cache hit rates

### Logging

```typescript
// Structured logging with tenant context
logger.info('attendance_marked', {
  school_id: school.id,
  school_slug: school.slug,
  user_id: user.id,
  user_type: user.type,
  class_id: classId,
  timestamp: new Date().toISOString(),
});

// Security event logging
logger.warn('cross_tenant_access_attempt', {
  school_id: attemptedSchoolId,
  user_id: userId,
  user_school_id: userSchoolId,
  resource: requestedResource,
  ip: ipAddress,
});
```

---

## Migration Path

### Onboarding New School

```sql
-- 1. Create school record
INSERT INTO schools (slug, name, subscription_tier)
VALUES ('newschool', 'New School', 'basic');

-- 2. Create admin user
INSERT INTO user_profiles (id, school_id, email, user_type, ...)
VALUES (...);

-- 3. Assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT new_user_id, id FROM roles WHERE name = 'School Admin';

-- 4. Set up default classes, periods, etc.
-- (via onboarding API)
```

### School Data Export

```typescript
async function exportSchoolData(schoolId: string) {
  // Export all school data for backup or migration
  const data = {
    school: await getSchool(schoolId),
    users: await getUsers(schoolId),
    classes: await getClasses(schoolId),
    attendance: await getAttendance(schoolId),
    // ... all other data
  };

  return JSON.stringify(data, null, 2);
}
```

---

## Summary

This multi-tenancy architecture provides:

✅ **Secure Data Isolation** - RLS policies enforce school boundaries
✅ **Flexible Branding** - Each school has custom look & feel
✅ **Feature Management** - Per-school feature toggles
✅ **Scalable Design** - Shared schema supports hundreds of schools
✅ **Cost Effective** - Single database, shared resources
✅ **Easy Maintenance** - Update once, deploy to all tenants
✅ **Strong Security** - Multiple validation layers
✅ **Audit Ready** - Complete tenant activity logging

The architecture is production-ready and follows SaaS best practices for multi-tenant applications.
