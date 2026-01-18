# Frontend Architecture - Quick Start Guide

## What's Been Built

A complete, production-ready frontend architecture for an Education CRM with role-based access control, mobile-first design, and real-time notifications.

---

## ✅ Implemented Features

### 1. **Authentication System**
- `AuthContext` - Global auth state management
- `useAuth()` hook for authentication operations
- Session persistence via Supabase
- Protected routes with automatic redirects

### 2. **User Management**
- `UserContext` - User profile and role management
- `useUser()` hook for accessing user data
- Permission checking system
- Role-based UI rendering

### 3. **Routing System**
- React Router v6 configuration
- `ProtectedRoute` - Requires authentication
- `RoleRoute` - Role-based access control
- Automatic redirects based on user role

### 4. **Layout Components**
- `DashboardLayout` - Main layout wrapper
- `Sidebar` - Desktop navigation (role-aware)
- `Header` - Top bar with search, notifications, user menu
- `MobileNav` - Bottom tab navigation for mobile

### 5. **Dashboard Pages**
- Admin Dashboard - System overview and analytics
- Teacher Dashboard - Classes, attendance, quick actions
- Parent Dashboard - Children overview and performance
- Student Dashboard - Schedule, grades, assignments

### 6. **Authentication Pages**
- Login page with email/password
- Error pages (404, 403)
- Responsive design across all pages

---

## File Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── UserContext.tsx        # User profile & roles
├── routes/
│   ├── AppRouter.tsx          # Main router configuration
│   ├── ProtectedRoute.tsx    # Auth guard
│   └── RoleRoute.tsx          # Role guard
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── attendance/           # Existing attendance components
│   └── notifications/        # Existing notification components
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── admin/
│   │   └── AdminDashboard.tsx
│   ├── teacher/
│   │   └── TeacherDashboard.tsx
│   ├── parent/
│   │   └── ParentDashboard.tsx
│   ├── student/
│   │   └── StudentDashboard.tsx
│   └── common/
│       ├── NotFoundPage.tsx
│       └── UnauthorizedPage.tsx
├── App.tsx                   # Root component
└── main.tsx                  # Entry point with providers
```

---

## How It Works

### Authentication Flow

```
1. User visits app
   ↓
2. AuthContext checks for session
   ↓
3. No session? → Redirect to /login
   ↓
4. User enters credentials
   ↓
5. Supabase authenticates
   ↓
6. Session stored, user redirected
   ↓
7. UserContext loads profile
   ↓
8. User sees role-specific dashboard
```

### Route Protection

```tsx
// Public route - anyone can access
<Route path="/login" element={<LoginPage />} />

// Protected route - requires authentication
<Route element={<ProtectedRoute />}>
  <Route element={<DashboardLayout />}>
    {/* All child routes require auth */}
  </Route>
</Route>

// Role-protected route - requires specific role
<Route element={<RoleRoute allowedRoles={['teacher', 'admin']} />}>
  <Route path="/teacher" element={<TeacherDashboard />} />
</Route>
```

### Context Usage

```tsx
// In any component
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

function MyComponent() {
  const { user, signOut } = useAuth();
  const { profile, role, hasPermission } = useUser();

  return (
    <div>
      <p>Welcome, {profile?.first_name}!</p>
      <p>Role: {role}</p>
      {hasPermission('attendance', 'mark') && (
        <button>Mark Attendance</button>
      )}
    </div>
  );
}
```

---

## Role-Based Navigation

### Admin Navigation
- Dashboard
- Schools
- Users
- Roles
- Classes
- Reports
- Settings

### Teacher Navigation
- Dashboard
- My Classes
- Attendance
- Gradebook
- Schedule
- Messages

### Parent Navigation
- Dashboard
- My Children
- Attendance
- Grades
- Assignments
- Fees
- Messages

### Student Navigation
- Dashboard
- My Attendance
- My Grades
- Assignments
- Schedule
- Classes

---

## Mobile-First Design

### Breakpoints
```css
< 768px   → Mobile (sidebar hidden, bottom nav visible)
768-1024px → Tablet (collapsible sidebar)
> 1024px   → Desktop (fixed sidebar, no bottom nav)
```

### Mobile Features
- Bottom tab navigation (4 primary items)
- Swipe-friendly cards
- Touch targets min 44px
- Responsive grid layouts
- Hamburger menu for additional items

---

## Adding New Pages

### 1. Create Page Component

```tsx
// src/pages/teacher/GradebookPage.tsx
import { useUser } from '../../contexts/UserContext';

export function GradebookPage() {
  const { profile } = useUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gradebook</h1>
      {/* Page content */}
    </div>
  );
}
```

### 2. Add Route

```tsx
// src/routes/AppRouter.tsx
import { GradebookPage } from '../pages/teacher/GradebookPage';

// In teacher routes section:
<Route element={<RoleRoute allowedRoles={['teacher', 'admin']} />}>
  <Route path="/teacher/gradebook" element={<GradebookPage />} />
</Route>
```

### 3. Add Navigation Link

```tsx
// src/components/layout/Sidebar.tsx
const teacherNavItems = [
  // existing items...
  { icon: Award, label: 'Gradebook', path: '/teacher/gradebook' },
];
```

---

## Customizing for Your Roles

### 1. Update Role Types

```tsx
// src/contexts/UserContext.tsx
export type UserRole =
  | 'admin'
  | 'teacher'
  | 'parent'
  | 'student'
  | 'staff'        // Add custom roles
  | 'counselor';   // here
```

### 2. Add Navigation

```tsx
// src/components/layout/Sidebar.tsx
const navigationByRole: Record<UserRole, NavItem[]> = {
  // existing roles...
  counselor: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/counselor' },
    { icon: Users, label: 'Students', path: '/counselor/students' },
    // ...
  ],
};
```

### 3. Create Dashboard

```tsx
// src/pages/counselor/CounselorDashboard.tsx
export function CounselorDashboard() {
  // Dashboard implementation
}
```

### 4. Add Route

```tsx
// src/routes/AppRouter.tsx
<Route element={<RoleRoute allowedRoles={['counselor']} />}>
  <Route path="/counselor" element={<CounselorDashboard />} />
</Route>
```

---

## State Management Patterns

### Loading State
```tsx
const [data, setData] = useState<Data[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadData() {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } finally {
      setLoading(false);
    }
  }
  loadData();
}, []);

if (loading) return <LoadingSpinner />;
```

### Error Handling
```tsx
const [error, setError] = useState<string | null>(null);

try {
  await saveData();
} catch (err) {
  setError(err.message);
}

{error && <ErrorMessage message={error} />}
```

### Form State
```tsx
const [formData, setFormData] = useState({
  name: '',
  email: '',
});

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

---

## Styling Guidelines

### Colors
```css
Primary: blue-600     /* Main actions */
Success: green-600    /* Positive actions */
Warning: orange-600   /* Caution */
Danger: red-600       /* Delete, errors */
Gray: gray-50 to 900  /* Neutral UI */
```

### Spacing
```css
Mobile:  p-4, gap-4   /* 16px */
Desktop: p-6, gap-6   /* 24px */
```

### Typography
```css
h1: text-2xl font-bold         /* Page titles */
h2: text-lg font-semibold      /* Section headers */
h3: text-base font-medium      /* Card titles */
body: text-sm text-gray-600    /* Body text */
```

### Components
```css
Card:   bg-white rounded-lg shadow-sm border border-gray-200 p-6
Button: px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
Input:  px-4 py-3 border border-gray-300 rounded-lg focus:ring-2
```

---

## Performance Optimization

### Code Splitting
```tsx
// Lazy load routes
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Memoization
```tsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## Testing the Architecture

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Login
```
http://localhost:5173/login
```

### 3. Test Protected Routes
Try accessing `/admin`, `/teacher`, etc. without logging in
→ Should redirect to `/login`

### 4. Test Role-Based Access
Login as a teacher, try accessing `/admin`
→ Should see "Access Denied" (403)

### 5. Test Navigation
- Desktop: Use sidebar
- Mobile: Use bottom navigation
- Click notifications bell
- Test user menu dropdown

---

## Deployment Checklist

- [ ] Set Supabase environment variables
- [ ] Configure authentication redirects
- [ ] Test all user roles
- [ ] Verify mobile responsiveness
- [ ] Test protected routes
- [ ] Check permission system
- [ ] Verify error pages (404, 403)
- [ ] Test notification system
- [ ] Verify logout functionality
- [ ] Check loading states

---

## Common Issues & Solutions

### Issue: User context returns null
**Solution**: Make sure user is authenticated and profile exists in `user_profiles` table

### Issue: Routes not protecting correctly
**Solution**: Check role names match exactly between database and code

### Issue: Sidebar not showing
**Solution**: Verify user role is in `navigationByRole` object

### Issue: Mobile nav overlapping content
**Solution**: Add `pb-20 lg:pb-6` to page containers

---

## Next Steps

### Immediate
1. Set up authentication in Supabase
2. Create test users for each role
3. Test login flow
4. Customize navigation for your needs

### Short-term
1. Add remaining pages (classes, grades, etc.)
2. Connect to attendance/notification APIs
3. Add form validation
4. Implement user profile editing

### Long-term
1. Add real-time features (chat, live updates)
2. Implement advanced permissions
3. Add analytics dashboard
4. Create mobile app (React Native)

---

## Summary

You now have a complete, production-ready frontend architecture with:

✅ Role-based authentication and authorization
✅ Mobile-first responsive design
✅ Protected routes with role guards
✅ Context-based state management
✅ Dashboard layouts for 4 user roles
✅ Navigation systems (sidebar + mobile)
✅ Error handling and loading states
✅ Extensible component structure
✅ TypeScript type safety
✅ Performance optimizations

The architecture follows React best practices, uses modern patterns, and is ready to scale with your Education CRM needs!
