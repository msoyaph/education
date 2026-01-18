# Multi-Tenancy - Quick Start Guide

## Overview

This guide shows you how to use the multi-tenancy system in the Education CRM to build tenant-aware features with school branding and feature flags.

---

## 🎯 What's Implemented

✅ **Subdomain-based tenant resolution** - Automatic school detection from URL
✅ **School branding system** - Custom logos, colors, fonts per school
✅ **Feature toggles** - Enable/disable features per school
✅ **Secure data isolation** - RLS policies enforce school boundaries
✅ **Custom domains** - Support for school-specific domains
✅ **Subscription management** - Tier-based quotas and limits

---

## Architecture Summary

### Tenant Resolution Flow

```
1. User visits: greenwood.educrm.app
   ↓
2. Extract subdomain: "greenwood"
   ↓
3. Query database: WHERE slug = 'greenwood'
   ↓
4. Load school config (branding, features, settings)
   ↓
5. Apply branding to UI
   ↓
6. Enable/disable features based on flags
   ↓
7. All queries filtered by school_id via RLS
```

### Key Components

```
TenantProvider (React Context)
  ├── Resolves school from subdomain
  ├── Loads school configuration
  ├── Applies branding
  └── Provides feature flags

Database (PostgreSQL + RLS)
  ├── schools table (tenant master)
  ├── school_domains table (custom domains)
  ├── All tenant-scoped tables have school_id
  └── RLS policies enforce isolation
```

---

## Using Tenant Context

### Basic Usage

```tsx
import { useTenant } from '../contexts/TenantContext';

function MyComponent() {
  const { school, isLoading, error } = useTenant();

  if (isLoading) {
    return <div>Loading school configuration...</div>;
  }

  if (error || !school) {
    return <div>Error: Unable to load school</div>;
  }

  return (
    <div>
      <h1>Welcome to {school.name}</h1>
      <p>School Code: {school.code}</p>
      <p>Subscription: {school.subscription_tier}</p>
    </div>
  );
}
```

### Access School Information

```tsx
const { school } = useTenant();

// Basic info
console.log(school.name);        // "Greenwood High School"
console.log(school.slug);        // "greenwood-high"
console.log(school.timezone);    // "America/New_York"

// Branding
console.log(school.branding.colors.primary);  // "#047857"
console.log(school.branding.logo?.url);       // Logo URL

// Subscription
console.log(school.subscription_tier);   // "premium"
console.log(school.max_students);        // 500

// Settings
console.log(school.settings.grading_system);  // "letter"
console.log(school.settings.time_format);     // "12h"
```

---

## Using Feature Flags

### Check if Feature is Enabled

```tsx
import { useFeature } from '../hooks/useFeature';

function AttendancePage() {
  const hasAttendance = useFeature('attendance');
  const hasQRCode = useFeature('attendance', 'qr_code_scanning');

  if (!hasAttendance) {
    return <UpgradePrompt feature="Attendance Tracking" />;
  }

  return (
    <div>
      <h1>Attendance</h1>
      <AttendanceTable />
      {hasQRCode && <QRCodeScanner />}
    </div>
  );
}
```

### Conditional Rendering

```tsx
function DashboardWidgets() {
  const hasGrading = useFeature('grading');
  const hasReports = useFeature('reports');
  const hasAdvancedReports = useFeature('reports', 'advanced_reports');

  return (
    <div className="grid grid-cols-3 gap-4">
      <AttendanceWidget />

      {hasGrading && <GradingWidget />}

      {hasReports && (
        <ReportsWidget showAdvanced={hasAdvancedReports} />
      )}
    </div>
  );
}
```

### Conditional Routes

```tsx
import { useFeature } from '../hooks/useFeature';

function AppRouter() {
  const hasMessaging = useFeature('messaging');
  const hasReports = useFeature('reports');

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/attendance" element={<AttendancePage />} />

      {hasMessaging && (
        <Route path="/messages" element={<MessagesPage />} />
      )}

      {hasReports && (
        <Route path="/reports" element={<ReportsPage />} />
      )}
    </Routes>
  );
}
```

### Check Multiple Features

```tsx
import { useFeatures, useAnyFeature } from '../hooks/useFeature';

function AdminPanel() {
  // Require ALL features
  const hasAllFeatures = useFeatures('grading', 'reports', 'messaging');

  // Require ANY feature
  const hasAnyFeature = useAnyFeature('grading', 'reports');

  if (!hasAnyFeature) {
    return <div>No features available</div>;
  }

  return <div>Admin Panel</div>;
}
```

### Get Feature Configuration

```tsx
import { useFeatureConfig } from '../hooks/useFeature';

function AttendanceSettings() {
  const attendanceConfig = useFeatureConfig('attendance');

  return (
    <div>
      <h2>Attendance Settings</h2>
      {attendanceConfig?.period_tracking && (
        <PeriodTrackingSettings />
      )}
      {attendanceConfig?.daily_tracking && (
        <DailyTrackingSettings />
      )}
      {attendanceConfig?.qr_code_scanning && (
        <QRCodeSettings />
      )}
    </div>
  );
}
```

---

## Applying School Branding

### Branding is Applied Automatically

When the app loads, `TenantProvider` automatically:
1. Loads school branding configuration
2. Applies CSS variables to `:root`
3. Updates favicon
4. Sets page title

### CSS Variables Available

The following CSS variables are set automatically:

```css
:root {
  --color-primary: #047857;        /* school.branding.colors.primary */
  --color-secondary: #DC2626;      /* school.branding.colors.secondary */
  --color-accent: #F59E0B;         /* school.branding.colors.accent */
  --font-family: 'Inter, ...';     /* school.branding.typography.font_family */
  --border-radius: 8px;            /* school.branding.theme.border_radius */
}
```

### Using Branded Colors in Components

```tsx
function ThemedButton({ children }: { children: React.ReactNode }) {
  const { school } = useTenant();

  return (
    <button
      style={{
        backgroundColor: school.branding.colors.primary,
        color: 'white',
      }}
      className="px-4 py-2 rounded hover:opacity-90"
    >
      {children}
    </button>
  );
}
```

### Using CSS Variables

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderColor: 'var(--color-primary)',
        borderRadius: 'var(--border-radius)',
      }}
      className="border-2 p-4"
    >
      {children}
    </div>
  );
}
```

### Display School Logo

```tsx
function Header() {
  const { school } = useTenant();

  return (
    <header className="flex items-center gap-4">
      {school.branding.logo?.url && (
        <img
          src={school.branding.logo.url}
          alt={`${school.name} logo`}
          style={{
            width: school.branding.logo.width || 200,
            height: school.branding.logo.height || 60,
          }}
        />
      )}
      <h1>{school.name}</h1>
    </header>
  );
}
```

---

## Querying Data with Tenant Isolation

### Automatic Filtering via RLS

All queries are automatically filtered by `school_id` thanks to Row Level Security:

```tsx
// Frontend - just query normally
const { data: classes } = await supabase
  .from('classes')
  .select('*');

// RLS automatically adds: WHERE school_id = user's school_id
// Returns only classes for the current school
```

### Manual School ID Filtering (when needed)

```tsx
import { useTenant } from '../contexts/TenantContext';

function ClassList() {
  const { school } = useTenant();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    async function loadClasses() {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', school.id)  // Explicit filter (redundant with RLS)
        .order('name');

      setClasses(data || []);
    }

    loadClasses();
  }, [school.id]);

  return <div>{/* Render classes */}</div>;
}
```

### Inserting Tenant-Scoped Data

```tsx
async function createClass(name: string) {
  const { school } = useTenant();

  const { data, error } = await supabase
    .from('classes')
    .insert({
      school_id: school.id,  // Always include school_id
      name: name,
      // ... other fields
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## Checking Subscription Limits

### Get Current Usage

```tsx
function QuotaStatus() {
  const { school } = useTenant();
  const [currentStudents, setCurrentStudents] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school.id);

      setCurrentStudents(count || 0);
    }

    loadCounts();
  }, [school.id]);

  const percentage = (currentStudents / school.max_students) * 100;

  return (
    <div>
      <h3>Student Quota</h3>
      <p>
        {currentStudents} / {school.max_students} students
      </p>
      <progress value={currentStudents} max={school.max_students} />
      {percentage > 90 && (
        <p className="text-red-600">
          Approaching quota limit. Upgrade your plan.
        </p>
      )}
    </div>
  );
}
```

### Enforce Limits Before Creating Records

```tsx
async function addStudent(studentData: any) {
  const { school } = useTenant();

  // Check current count
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school.id);

  if (count >= school.max_students) {
    throw new Error(
      `Student limit reached. Current plan allows ${school.max_students} students.`
    );
  }

  // Proceed with creation
  const { data, error } = await supabase
    .from('students')
    .insert({
      ...studentData,
      school_id: school.id,
    });

  return data;
}
```

---

## Development & Testing

### Local Development

For local development (`localhost:5173`), the system automatically uses the `demo-school`:

```typescript
// src/services/tenantService.ts
if (hostname === 'localhost' || hostname.startsWith('192.168')) {
  return 'demo-school';  // Uses demo school
}
```

### Testing with Different Schools

To test with different schools locally:

1. **Option A: Use `/etc/hosts`**
   ```
   # Add to /etc/hosts
   127.0.0.1  greenwood.local
   127.0.0.1  demo.local
   ```

   Then visit: `http://greenwood.local:5173`

2. **Option B: Modify tenant service temporarily**
   ```typescript
   // For testing only
   private static resolveSubdomain(): string | null {
     return 'greenwood-high';  // Hardcode for testing
   }
   ```

### Creating Test Schools

```sql
-- Insert a test school
INSERT INTO schools (
  slug,
  name,
  code,
  subscription_tier,
  branding,
  features
) VALUES (
  'test-school',
  'Test School',
  'TEST001',
  'premium',
  '{"colors": {"primary": "#3B82F6"}}'::jsonb,
  '{"attendance": {"enabled": true}}'::jsonb
);
```

---

## Common Patterns

### Loading Screen While Resolving Tenant

```tsx
import { useTenant } from '../contexts/TenantContext';

function App() {
  const { school, isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">School Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <AppRouter />;
}
```

### Feature-Gated Component

```tsx
function FeatureGate({
  feature,
  fallback,
  children,
}: {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasFeature = useFeature(feature as any);

  if (!hasFeature) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Usage
<FeatureGate
  feature="messaging"
  fallback={<UpgradePrompt />}
>
  <MessagesPanel />
</FeatureGate>
```

### Upgrade Prompt

```tsx
function UpgradePrompt({ feature }: { feature: string }) {
  const { school } = useTenant();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">
        {feature} Not Available
      </h3>
      <p className="text-gray-600 mb-4">
        This feature is not included in your {school.subscription_tier} plan.
      </p>
      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Upgrade Plan
      </button>
    </div>
  );
}
```

---

## Best Practices

### ✅ DO

1. **Always use tenant context for school info**
   ```tsx
   const { school } = useTenant();
   ```

2. **Use feature flags for conditional features**
   ```tsx
   const hasFeature = useFeature('messaging');
   ```

3. **Include school_id when creating records**
   ```tsx
   .insert({ school_id: school.id, ...data })
   ```

4. **Check subscription limits before operations**
   ```tsx
   if (count >= school.max_students) { throw error }
   ```

5. **Apply school branding in UI**
   ```tsx
   style={{ backgroundColor: school.branding.colors.primary }}
   ```

### ❌ DON'T

1. **Don't hardcode school IDs**
   ```tsx
   // Bad
   const schoolId = 'some-uuid';

   // Good
   const { school } = useTenant();
   const schoolId = school.id;
   ```

2. **Don't bypass feature flags**
   ```tsx
   // Bad - always show regardless of flag
   <MessagesPage />

   // Good - check flag first
   {hasMessaging && <MessagesPage />}
   ```

3. **Don't query across tenants**
   ```tsx
   // RLS prevents this, but don't try
   .select('*')  // Only returns current school's data
   ```

4. **Don't skip school_id in inserts**
   ```tsx
   // Bad - will fail RLS check
   .insert({ name: 'Class' })

   // Good
   .insert({ school_id: school.id, name: 'Class' })
   ```

---

## Troubleshooting

### Issue: "Unable to resolve school from subdomain"

**Cause**: No school found with the subdomain slug

**Solution**:
1. Check the URL - is the subdomain correct?
2. Verify the school exists: `SELECT * FROM schools WHERE slug = 'your-slug'`
3. Ensure school is active: `is_active = true`

### Issue: Feature not showing despite being enabled

**Cause**: Feature flag not properly configured

**Solution**:
```sql
-- Check feature flags
SELECT features FROM schools WHERE slug = 'your-school';

-- Update feature
UPDATE schools
SET features = jsonb_set(
  features,
  '{attendance,enabled}',
  'true'
)
WHERE slug = 'your-school';
```

### Issue: School branding not applied

**Cause**: Branding JSONB structure incorrect

**Solution**:
```sql
-- Verify branding structure
SELECT branding FROM schools WHERE slug = 'your-school';

-- Branding must have this structure:
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6"
  },
  "typography": {
    "font_family": "Inter"
  }
}
```

### Issue: Can't access data from database

**Cause**: RLS policies blocking access

**Solution**:
1. Verify user has `school_id` in `user_profiles`
2. Check RLS policies are enabled on table
3. Ensure JWT contains correct school_id

---

## Next Steps

1. **Set up production subdomains**
   - Configure DNS for `*.educrm.app`
   - Set up wildcard SSL certificate

2. **Create onboarding flow**
   - New school registration
   - Admin user creation
   - Initial configuration

3. **Build admin panel**
   - Manage schools
   - Configure features
   - View usage metrics

4. **Add custom domains**
   - Domain verification flow
   - SSL certificate provisioning
   - DNS configuration UI

---

## Summary

The multi-tenancy system provides:

✅ **Automatic tenant resolution** via subdomain
✅ **Secure data isolation** via RLS policies
✅ **Custom branding** per school
✅ **Feature toggles** for flexible subscriptions
✅ **Usage quotas** and limits
✅ **Easy-to-use hooks** for tenant context

All the heavy lifting is done for you - just use `useTenant()` and `useFeature()` in your components!
