# Education CRM - Package A MVP Completion Criteria

## Document Overview

This document defines the **minimum viable product (MVP)** completion criteria for Education CRM Package A. All criteria must be met before the product is considered ready for production launch.

**Target Market**: Small to medium-sized schools (50-500 students)
**Target Users**: School admins, teachers, students, parents
**Deployment Model**: SaaS multi-tenant
**Timeline**: 3 months from development start
**Success Criterion**: 10 pilot schools using the system successfully for 1 month

---

## 1. Functional Requirements

All functional requirements are **MUST HAVE** for MVP launch. Each requirement includes acceptance criteria that must pass before sign-off.

### 1.1 User Management & Authentication

#### 1.1.1 User Registration & Login
**Requirements:**
- Users can register with email and password
- Users can log in with email and password
- Password must meet minimum security requirements (8+ chars, 1 uppercase, 1 lowercase, 1 number)
- Users can log out
- Session persists across browser refreshes
- Session expires after 7 days of inactivity

**Acceptance Criteria:**
- [ ] New user can create account with valid email and password
- [ ] User receives appropriate error for invalid credentials
- [ ] User receives appropriate error for weak password
- [ ] User can successfully log in with correct credentials
- [ ] User cannot log in with incorrect credentials
- [ ] User can log out and session is cleared
- [ ] User remains logged in after browser refresh (within 7 days)
- [ ] Session expires after 7 days without activity

**Exclusions:**
- ❌ Email verification (Phase 1 enhancement)
- ❌ Password reset via email (Phase 1 enhancement)
- ❌ Social login (OAuth) (Phase 2)
- ❌ Two-factor authentication (Phase 2)
- ❌ Single Sign-On (SSO) (Phase 3)

---

#### 1.1.2 User Roles & Permissions
**Requirements:**
- System supports 4 user types: Admin, Teacher, Student, Parent
- Users can only access features appropriate for their role
- Admins can manage all users in their school
- Teachers can only see their assigned classes
- Students can only see their own data
- Parents can only see their children's data

**Acceptance Criteria:**
- [ ] Admin can create/edit/deactivate users
- [ ] Teacher cannot access admin functions
- [ ] Student cannot access teacher/admin functions
- [ ] Parent cannot access other students' data
- [ ] Unauthorized access attempts return 403 Forbidden
- [ ] Role-based navigation shows only appropriate menu items

**Test Cases:**
```
Test 1: Admin creates a teacher account
  - Admin logs in
  - Navigates to Users > Add User
  - Fills form: email, name, role=Teacher
  - Clicks Save
  - Teacher receives account credentials
  - Teacher can log in successfully

Test 2: Teacher tries to access admin panel
  - Teacher logs in
  - Attempts to navigate to /admin/users
  - Receives "Unauthorized" error
  - Redirected to appropriate dashboard

Test 3: Parent views child's grades
  - Parent logs in
  - Sees list of their children
  - Clicks on child name
  - Sees child's attendance and grades
  - Cannot see other students' data
```

**Exclusions:**
- ❌ Custom role creation (Phase 2)
- ❌ Fine-grained permissions (Phase 2)
- ❌ Role hierarchy (Phase 2)

---

### 1.2 Multi-Tenancy (School Isolation)

#### 1.2.1 School Registration
**Requirements:**
- Schools can self-register via subdomain
- Each school gets a unique subdomain (e.g., `greenwood.educrm.com`)
- School admin account is created during registration
- School profile includes: name, address, phone, logo

**Acceptance Criteria:**
- [ ] New school can register with subdomain
- [ ] Subdomain is validated (alphanumeric, 3-30 chars)
- [ ] Duplicate subdomain is rejected
- [ ] School admin can log in immediately after registration
- [ ] School data is isolated from other schools

**Test Cases:**
```
Test 1: School registration
  - Visit educrm.com/register
  - Enter school name: "Greenwood Academy"
  - Enter desired subdomain: "greenwood"
  - Enter admin email and password
  - Click Register
  - Redirected to greenwood.educrm.com
  - Admin dashboard loads successfully

Test 2: Data isolation
  - Register School A with subdomain "schoola"
  - Register School B with subdomain "schoolb"
  - Create student in School A
  - Log in to School B as admin
  - Verify School B admin cannot see School A student
```

**Exclusions:**
- ❌ Custom domains (Phase 2)
- ❌ Multi-school management (Phase 3)
- ❌ School marketplace/directory (Phase 3)

---

#### 1.2.2 Tenant Resolution
**Requirements:**
- System identifies tenant from subdomain on every request
- All database queries are scoped to current tenant
- Users cannot access data from other tenants
- Tenant context is maintained throughout user session

**Acceptance Criteria:**
- [ ] Subdomain correctly identifies tenant
- [ ] Invalid subdomain shows error page
- [ ] RLS policies enforce tenant isolation
- [ ] No cross-tenant data leakage (verified by security audit)

**Exclusions:**
- ❌ Multi-tenant user accounts (Phase 3)
- ❌ Tenant switching (Phase 3)

---

### 1.3 Class Management

#### 1.3.1 Class Creation & Configuration
**Requirements:**
- Admins can create classes with: name, grade level, academic year
- Admins can assign one teacher per class
- Admins can enroll students in classes
- Classes can be archived (not deleted)
- Teacher can view their assigned classes

**Acceptance Criteria:**
- [ ] Admin can create a new class
- [ ] Admin can assign teacher to class
- [ ] Admin can add/remove students from class
- [ ] Teacher sees only their assigned classes
- [ ] Student sees only their enrolled classes
- [ ] Archived classes are not shown by default

**Test Cases:**
```
Test 1: Create class and enroll students
  - Admin logs in
  - Clicks Classes > Add Class
  - Enters: Name="Math 101", Grade="10", Year="2024"
  - Assigns teacher: John Smith
  - Enrolls students: Alice, Bob, Charlie
  - Clicks Save
  - Class appears in Classes list
  - Teacher John sees "Math 101" in his dashboard
  - Students Alice, Bob, Charlie see "Math 101" in their schedules
```

**Exclusions:**
- ❌ Multiple teachers per class (Phase 2)
- ❌ Class schedules/timetables (Phase 2)
- ❌ Classroom/location management (Phase 2)
- ❌ Subject/curriculum management (Phase 2)

---

### 1.4 Attendance Management

#### 1.4.1 Manual Attendance Marking (Teacher)
**Requirements:**
- Teacher can mark attendance for their classes daily
- Attendance statuses: Present, Absent, Late, Excused
- Teacher can add notes to attendance records
- Teacher can edit attendance within 24 hours
- Historical attendance records are read-only after 24 hours

**Acceptance Criteria:**
- [ ] Teacher can view attendance sheet for their class
- [ ] Teacher can mark each student as Present/Absent/Late/Excused
- [ ] Teacher can add optional notes
- [ ] Attendance is saved successfully
- [ ] Teacher can edit attendance within 24 hours
- [ ] Teacher cannot edit attendance after 24 hours
- [ ] Attendance sheet shows previous day's attendance

**Test Cases:**
```
Test 1: Mark attendance for a class
  - Teacher logs in
  - Goes to Attendance
  - Selects class: "Math 101"
  - Selects date: Today
  - Marks students:
    - Alice: Present
    - Bob: Absent (note: "Sick")
    - Charlie: Late
  - Clicks Save
  - Success message appears
  - Attendance is visible in history

Test 2: Edit recent attendance
  - Teacher marks attendance today
  - Realizes mistake (Bob was present, not absent)
  - Returns to attendance sheet
  - Changes Bob to Present
  - Clicks Save
  - Updated attendance is saved

Test 3: Cannot edit old attendance
  - Teacher tries to edit attendance from 3 days ago
  - Edit controls are disabled
  - Info message: "Attendance older than 24 hours cannot be edited"
```

**Exclusions:**
- ❌ Bulk attendance marking (Phase 1 enhancement)
- ❌ QR code attendance (Phase 4)
- ❌ RFID attendance (Phase 4)
- ❌ Geofencing/GPS validation (Phase 2)
- ❌ Attendance via mobile app (Phase 1)

---

#### 1.4.2 Attendance Viewing (Student & Parent)
**Requirements:**
- Students can view their own attendance history
- Parents can view their children's attendance history
- Attendance is displayed by date with status
- Monthly summary shows: total days, present days, absent days, attendance percentage
- Attendance data is updated in real-time

**Acceptance Criteria:**
- [ ] Student can view their attendance history
- [ ] Parent can view each child's attendance
- [ ] Attendance shows date and status
- [ ] Monthly summary calculates correctly
- [ ] Attendance updates immediately after teacher marks it

**Test Cases:**
```
Test 1: Student views attendance
  - Student logs in
  - Goes to My Attendance
  - Sees list of dates with statuses
  - Sees monthly summary:
    - Total days: 20
    - Present: 18
    - Absent: 1
    - Late: 1
    - Attendance rate: 90%

Test 2: Parent views child's attendance
  - Parent logs in
  - Sees list of children
  - Clicks on child name
  - Clicks Attendance tab
  - Sees attendance history and summary
```

**Exclusions:**
- ❌ Attendance reports/exports (Phase 1 enhancement)
- ❌ Attendance trends/analytics (Phase 2)
- ❌ Attendance notifications (Phase 1 enhancement)
- ❌ Absence leave requests (Phase 2)

---

### 1.5 Notification System

#### 1.5.1 In-App Notifications
**Requirements:**
- Users receive in-app notifications for key events
- Notifications show in header bell icon
- Unread count is displayed
- Users can mark notifications as read
- Users can delete notifications
- Notification types supported:
  - Attendance marked (parent only)
  - Class assignment (teacher, student)
  - System announcements (all users)

**Acceptance Criteria:**
- [ ] User sees notification bell with unread count
- [ ] Clicking bell shows notification dropdown
- [ ] Notifications show type, title, message, timestamp
- [ ] User can mark individual notification as read
- [ ] User can mark all notifications as read
- [ ] User can delete notifications
- [ ] Unread count updates in real-time
- [ ] Notifications are ordered by most recent first

**Test Cases:**
```
Test 1: Teacher marks attendance, parent receives notification
  - Teacher marks student absent
  - Parent's notification bell shows count (1)
  - Parent clicks bell
  - Sees notification: "John was marked absent today"
  - Parent clicks "Mark as read"
  - Unread count decreases to (0)

Test 2: System announcement
  - Admin creates announcement: "School closed tomorrow"
  - All users receive notification
  - Notification type: "Announcement"
  - Users can read and dismiss
```

**Exclusions:**
- ❌ Email notifications (Phase 1 enhancement)
- ❌ SMS notifications (Phase 2)
- ❌ Push notifications (mobile) (Phase 1 enhancement)
- ❌ WhatsApp notifications (Phase 4)
- ❌ Notification preferences (Phase 2)
- ❌ Notification scheduling (Phase 2)

---

### 1.6 Basic Reporting

#### 1.6.1 Attendance Report (Admin & Teacher)
**Requirements:**
- Admin can generate attendance report for entire school
- Teacher can generate attendance report for their classes
- Report shows: student name, total days, present, absent, late, excused, percentage
- Report can be filtered by: date range, class, student
- Report can be viewed on screen (no export required for MVP)

**Acceptance Criteria:**
- [ ] Admin can access Reports section
- [ ] Admin can select report type: Attendance
- [ ] Admin can filter by date range and class
- [ ] Report displays correct data
- [ ] Report calculations are accurate
- [ ] Teacher can only see their class reports

**Test Cases:**
```
Test 1: Generate school-wide attendance report
  - Admin logs in
  - Goes to Reports > Attendance
  - Selects date range: Last 30 days
  - Selects class: All classes
  - Clicks Generate
  - Report shows all students with attendance summary
  - Data matches actual attendance records

Test 2: Teacher generates class report
  - Teacher logs in
  - Goes to Reports > Attendance
  - Sees only their classes in dropdown
  - Selects class: "Math 101"
  - Selects date range: This week
  - Report shows only students in Math 101
```

**Exclusions:**
- ❌ PDF export (Phase 1 enhancement)
- ❌ Excel export (Phase 1 enhancement)
- ❌ Email report delivery (Phase 2)
- ❌ Scheduled reports (Phase 2)
- ❌ Custom report builder (Phase 3)
- ❌ Dashboards with charts (Phase 2)

---

### 1.7 User Interface & Experience

#### 1.7.1 Responsive Design
**Requirements:**
- Application is fully functional on desktop (1920x1080, 1366x768)
- Application is usable on tablet (iPad, 768x1024)
- Mobile view provides core functionality (375x667 minimum)
- Navigation adapts to screen size (hamburger menu on mobile)

**Acceptance Criteria:**
- [ ] All pages render correctly on desktop
- [ ] All pages render correctly on tablet
- [ ] Core features work on mobile
- [ ] No horizontal scrolling required
- [ ] Touch targets are minimum 44x44px
- [ ] Forms are easy to fill on mobile

**Test Devices:**
- Desktop: Chrome, Firefox, Safari (latest versions)
- Tablet: iPad, Android tablet
- Mobile: iPhone, Android phone

**Exclusions:**
- ❌ Native mobile apps (Phase 1 enhancement)
- ❌ Offline mode (Phase 2)
- ❌ Progressive Web App (PWA) (Phase 1 enhancement)

---

#### 1.7.2 Accessibility
**Requirements:**
- Minimum WCAG 2.1 Level A compliance
- Keyboard navigation works for all core features
- Color contrast meets minimum standards (4.5:1 for text)
- Form inputs have proper labels
- Error messages are clear and helpful

**Acceptance Criteria:**
- [ ] User can navigate with keyboard only (Tab, Enter, Esc)
- [ ] Focus indicators are visible
- [ ] Color is not the only means of conveying information
- [ ] All form inputs have associated labels
- [ ] Error messages are descriptive and actionable

**Exclusions:**
- ❌ WCAG 2.1 Level AA (Phase 2)
- ❌ Screen reader optimization (Phase 2)
- ❌ High contrast mode (Phase 2)

---

## 2. Non-Functional Requirements

### 2.1 Performance

#### 2.1.1 Page Load Time
**Requirements:**
- Initial page load: < 3 seconds (P95) on 3G connection
- Subsequent navigation: < 1 second (P95)
- Time to interactive: < 5 seconds (P95)

**Measurement:**
- Lighthouse performance score: > 70
- First Contentful Paint (FCP): < 2 seconds
- Largest Contentful Paint (LCP): < 3 seconds
- Time to Interactive (TTI): < 5 seconds

**Acceptance Criteria:**
- [ ] Homepage loads in < 3s on simulated 3G (Chrome DevTools)
- [ ] Dashboard loads in < 3s after authentication
- [ ] Navigation between pages is < 1s
- [ ] Lighthouse score is 70+ on production

**Test Environment:**
- Network: Simulated 3G (750ms latency, 1.5 Mbps down, 750 Kbps up)
- Device: Mid-tier mobile (Chrome DevTools throttling)

---

#### 2.1.2 API Response Time
**Requirements:**
- Read operations: < 200ms (P95)
- Write operations: < 500ms (P95)
- Bulk operations: < 2 seconds (P95)

**Acceptance Criteria:**
- [ ] GET /api/students response time < 200ms
- [ ] POST /api/attendance response time < 500ms
- [ ] Bulk attendance marking (30 students) < 2s
- [ ] No API endpoint exceeds 5s timeout

**Monitoring:**
- Track API latency in Supabase dashboard
- Set up alerts for P95 > thresholds

---

#### 2.1.3 Database Performance
**Requirements:**
- Database queries: < 100ms (P95)
- Database has proper indexes on frequently queried columns
- N+1 query problems are eliminated
- Connection pooling is configured

**Acceptance Criteria:**
- [ ] All queries execute in < 100ms (checked via Supabase Studio)
- [ ] Indexes exist on all foreign keys
- [ ] Indexes exist on commonly filtered columns (school_id, student_id, date)
- [ ] No query performs full table scan on large tables

**Required Indexes:**
```sql
-- Minimum required indexes for MVP
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_classes_school_teacher ON classes(school_id, teacher_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_attendance_student_date ON attendance_records(student_id, date);
CREATE INDEX idx_attendance_class_date ON attendance_records(class_id, date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_user_profiles_school ON user_profiles(school_id);
```

---

#### 2.1.4 Concurrent Users
**Requirements:**
- System supports 100 concurrent users without degradation
- System supports 500 total users per school
- No resource exhaustion under normal load

**Acceptance Criteria:**
- [ ] Load test with 100 concurrent users passes
- [ ] All operations remain under performance thresholds
- [ ] No database connection pool exhaustion
- [ ] No memory leaks detected

**Load Test Scenario:**
```
Users: 100 concurrent
Duration: 10 minutes
Actions:
  - 40% read operations (view attendance, view grades)
  - 40% navigation (dashboard, profile, classes)
  - 20% write operations (mark attendance, create announcement)

Success Criteria:
  - 99% of requests successful (status 200)
  - P95 response time < 2 seconds
  - No 500 errors
  - No database timeouts
```

**Exclusions:**
- ❌ High-scale load testing (1000+ concurrent users) (Phase 5)
- ❌ Stress testing (beyond normal capacity) (Phase 2)

---

### 2.2 Reliability

#### 2.2.1 Uptime
**Requirements:**
- Target uptime: 99% (7.2 hours downtime per month allowed)
- Planned maintenance windows must be announced 48 hours in advance
- System degrades gracefully under failure

**Acceptance Criteria:**
- [ ] Uptime monitoring is configured (UptimeRobot or similar)
- [ ] Alerts trigger for downtime > 5 minutes
- [ ] Incident response plan is documented
- [ ] Backup restoration procedure is tested

**Exclusions:**
- ❌ 99.9% uptime SLA (Phase 5)
- ❌ Multi-region deployment (Phase 5)
- ❌ Automatic failover (Phase 5)

---

#### 2.2.2 Data Integrity
**Requirements:**
- No data loss under normal operations
- Database transactions are atomic
- Foreign key constraints are enforced
- Daily database backups are configured
- Backups can be restored successfully

**Acceptance Criteria:**
- [ ] Supabase automatic backups are enabled
- [ ] Backup restoration has been tested successfully
- [ ] Foreign key constraints prevent orphaned records
- [ ] Cascade deletes are configured correctly
- [ ] Soft delete is used where historical data is important

**Test Cases:**
```
Test 1: Backup restoration
  - Create test data (school, users, attendance)
  - Trigger backup
  - Restore backup to test environment
  - Verify all data is intact
  - Verify relationships are preserved

Test 2: Transaction atomicity
  - Start attendance marking for 30 students
  - Simulate error after 15 students
  - Verify: Either all 30 saved OR none saved
  - No partial save state

Test 3: Referential integrity
  - Attempt to delete teacher assigned to class
  - Verify: Deletion is blocked OR class is reassigned
  - No orphaned class records
```

---

#### 2.2.3 Error Handling
**Requirements:**
- All errors are logged with context
- Users see helpful error messages (not technical stack traces)
- Critical errors trigger alerts to development team
- System recovers from transient errors automatically

**Acceptance Criteria:**
- [ ] Error tracking is configured (Sentry or similar)
- [ ] 500 errors show user-friendly message
- [ ] Validation errors show specific field issues
- [ ] Network errors show retry option
- [ ] Critical errors (database down) trigger alert

**Error Categories:**
```
Validation Errors:
  - Show field-specific messages
  - Highlight problematic fields
  - Suggest corrections

Network Errors:
  - Show "Connection lost" message
  - Offer retry button
  - Auto-retry for transient failures

Permission Errors:
  - Show "You don't have permission to access this"
  - Provide contact information for help

Server Errors:
  - Show "Something went wrong. Please try again."
  - Log full error details to monitoring
  - Include error ID for support tracking
```

---

### 2.3 Scalability

#### 2.3.1 Data Volume
**Requirements:**
- System handles 50 schools (MVP target)
- System handles 500 students per school (25,000 total)
- System handles 100,000 attendance records
- Database size < 5 GB

**Acceptance Criteria:**
- [ ] Test database seeded with 50 schools
- [ ] Test database seeded with 25,000 students
- [ ] Test database seeded with 100,000 attendance records
- [ ] All operations remain within performance thresholds
- [ ] Database queries use indexes (no table scans)

**Exclusions:**
- ❌ 100+ schools (Phase 2+)
- ❌ 1,000+ students per school (Phase 2+)
- ❌ 1M+ attendance records (Phase 3+)

---

#### 2.3.2 Growth Path
**Requirements:**
- Architecture supports adding more schools without code changes
- Database schema supports future features without breaking changes
- API design is versioned and backward compatible

**Acceptance Criteria:**
- [ ] New school onboarding is self-service (no developer intervention)
- [ ] RLS policies scale with tenant count
- [ ] Database migrations are tested for zero-downtime
- [ ] API endpoints include version prefix (/api/v1/)

---

### 2.4 Usability

#### 2.4.1 Learnability
**Requirements:**
- New teacher can mark attendance within 5 minutes of first login
- New admin can create a class within 10 minutes
- Core workflows require < 5 clicks
- UI is intuitive without training

**Acceptance Criteria:**
- [ ] User testing with 3 teachers: all complete attendance in < 5 min
- [ ] User testing with 3 admins: all create class in < 10 min
- [ ] No mandatory tutorial/onboarding (but helpful tips are allowed)
- [ ] Error messages guide users to correct action

**Exclusions:**
- ❌ Interactive tutorials (Phase 1 enhancement)
- ❌ Video training library (Phase 2)
- ❌ In-app help documentation (Phase 2)

---

#### 2.4.2 Consistency
**Requirements:**
- Consistent navigation across all pages
- Consistent button styles and placement
- Consistent form layouts
- Consistent terminology throughout application

**Acceptance Criteria:**
- [ ] Primary navigation is same on all pages
- [ ] Primary actions use same color/style (e.g., blue buttons)
- [ ] Destructive actions use same color/style (e.g., red buttons)
- [ ] Cancel buttons are consistently placed (left or right)
- [ ] Terms like "Attendance" not mixed with "Presence"

---

## 3. Security Requirements

All security requirements are **MANDATORY** for production launch.

### 3.1 Authentication & Authorization

#### 3.1.1 Password Security
**Requirements:**
- Passwords are hashed using bcrypt (handled by Supabase)
- Minimum password strength enforced (8 chars, mixed case, number)
- No password stored in plain text anywhere
- Session tokens are secure HTTP-only cookies

**Acceptance Criteria:**
- [ ] Passwords are never logged
- [ ] Passwords are never returned in API responses
- [ ] Password strength validation prevents weak passwords
- [ ] Session tokens are HTTP-only, Secure, SameSite
- [ ] No tokens stored in localStorage

**Test Cases:**
```
Test 1: Weak password rejected
  - Attempt to create account with password "password"
  - System rejects with error: "Password too weak"
  - Suggestions shown: "Add uppercase, numbers"

Test 2: Password not exposed
  - Create user account
  - Check API response (no password field)
  - Check database (password is hashed)
  - Check network tab (no password in logs)
```

---

#### 3.1.2 Session Management
**Requirements:**
- Sessions expire after 7 days of inactivity
- Users can log out and session is invalidated
- Concurrent sessions are allowed (max 5 devices)
- Suspicious activity triggers session revocation

**Acceptance Criteria:**
- [ ] Inactive session expires after 7 days
- [ ] Logout invalidates session token
- [ ] User can log in from multiple devices
- [ ] Multiple failed login attempts trigger rate limiting

---

#### 3.1.3 Authorization (RLS)
**Requirements:**
- All database tables have Row Level Security (RLS) enabled
- Users can only access data from their school (tenant)
- Users can only perform actions allowed by their role
- No direct database access without RLS checks

**Acceptance Criteria:**
- [ ] Every table has RLS enabled
- [ ] Every table has school_id isolation policy
- [ ] Service role key is never exposed to frontend
- [ ] Anon key is used for client connections
- [ ] Security audit confirms no data leakage between tenants

**Critical RLS Policies (Must Exist):**
```sql
-- Schools: Users see only their school
CREATE POLICY "Users access own school"
  ON schools FOR ALL
  TO authenticated
  USING (id = get_user_school_id());

-- Students: Users see only students in their school
CREATE POLICY "Users access own school students"
  ON students FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id());

-- Attendance: Users see only attendance in their school
CREATE POLICY "Users access own school attendance"
  ON attendance_records FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id());

-- Classes: Users see only classes in their school
CREATE POLICY "Users access own school classes"
  ON classes FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id());

-- User Profiles: Users see only profiles in their school
CREATE POLICY "Users access own school profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id());
```

---

### 3.2 Data Protection

#### 3.2.1 Data Encryption
**Requirements:**
- Data encrypted in transit (HTTPS/TLS 1.2+)
- Data encrypted at rest (handled by Supabase)
- No sensitive data in URL parameters
- No sensitive data in client-side logs

**Acceptance Criteria:**
- [ ] All pages served over HTTPS
- [ ] TLS certificate is valid and not expired
- [ ] HTTP requests redirect to HTTPS
- [ ] No mixed content warnings
- [ ] Database encryption at rest confirmed (Supabase default)

---

#### 3.2.2 Sensitive Data Handling
**Requirements:**
- Personally Identifiable Information (PII) is protected:
  - Names, email addresses, phone numbers
  - Student ID numbers, date of birth
  - Parent contact information
- PII is not logged unnecessarily
- PII access is audited

**Acceptance Criteria:**
- [ ] No PII in application logs
- [ ] No PII in error messages
- [ ] No PII in URLs
- [ ] Database audit logging enabled for user_profiles table

**Exclusions:**
- ❌ GDPR compliance features (right to deletion, data portability) (Phase 2)
- ❌ FERPA compliance certification (Phase 2)
- ❌ Data anonymization (Phase 3)

---

### 3.3 Input Validation & Sanitization

#### 3.3.1 SQL Injection Prevention
**Requirements:**
- All database queries use parameterized statements
- No raw SQL with string concatenation
- Supabase client library handles escaping

**Acceptance Criteria:**
- [ ] Code review confirms no string concatenation in queries
- [ ] All queries use Supabase query builder or prepared statements
- [ ] Security scan (SQLMap) finds no injection vulnerabilities

**Test Cases:**
```
Test 1: SQL injection attempt in login
  - Enter email: admin@school.com' OR '1'='1
  - Enter password: anything
  - Result: Login fails with "Invalid credentials"
  - No SQL error exposed

Test 2: SQL injection in search
  - Search for: '; DROP TABLE students; --
  - Result: Returns no results (or relevant results)
  - No database error occurs
  - Table still exists
```

---

#### 3.3.2 Cross-Site Scripting (XSS) Prevention
**Requirements:**
- All user input is sanitized before rendering
- React's JSX provides default XSS protection
- No `dangerouslySetInnerHTML` without sanitization
- Content Security Policy (CSP) headers configured

**Acceptance Criteria:**
- [ ] User-generated content (names, notes) does not execute scripts
- [ ] CSP header prevents inline scripts
- [ ] Code review confirms no unsafe HTML rendering
- [ ] Security scan finds no XSS vulnerabilities

**Test Cases:**
```
Test 1: XSS in student name
  - Create student with name: <script>alert('XSS')</script>
  - View student in list
  - Result: Name displays as text (script does not execute)

Test 2: XSS in attendance notes
  - Add note: <img src=x onerror=alert('XSS')>
  - View attendance record
  - Result: Note displays as text, no alert shown
```

---

#### 3.3.3 Cross-Site Request Forgery (CSRF) Prevention
**Requirements:**
- All state-changing requests require authentication
- SameSite cookie attribute prevents CSRF
- Supabase client handles CSRF protection

**Acceptance Criteria:**
- [ ] Cookies have SameSite=Strict or SameSite=Lax
- [ ] Authenticated requests include token verification
- [ ] External sites cannot trigger actions

**Test Cases:**
```
Test 1: CSRF attempt
  - Log in to application
  - Visit malicious external site
  - Malicious site attempts to mark attendance via AJAX
  - Result: Request is blocked (CORS or auth failure)
```

---

### 3.4 API Security

#### 3.4.1 Rate Limiting
**Requirements:**
- API endpoints are rate-limited to prevent abuse
- Rate limits: 100 requests per minute per IP
- Rate limits: 1000 requests per hour per authenticated user
- Exceeded limits return 429 Too Many Requests

**Acceptance Criteria:**
- [ ] Rate limiting configured at API gateway or Edge Function level
- [ ] Rate limit headers included in response (X-RateLimit-*)
- [ ] 429 status returned when limit exceeded
- [ ] Legitimate users are not affected by rate limiting

**Exclusions:**
- ❌ Per-endpoint rate limits (Phase 2)
- ❌ Adaptive rate limiting (Phase 3)

---

#### 3.4.2 API Authentication
**Requirements:**
- All API endpoints require valid authentication token (except public endpoints)
- Tokens are validated on every request
- Expired tokens are rejected
- Invalid tokens return 401 Unauthorized

**Acceptance Criteria:**
- [ ] Requests without auth token return 401
- [ ] Requests with expired token return 401
- [ ] Requests with invalid token return 401
- [ ] Valid token grants access to authorized resources

---

### 3.5 Security Monitoring

#### 3.5.1 Logging & Auditing
**Requirements:**
- Security events are logged:
  - Failed login attempts
  - Permission denied errors
  - User role changes
  - Data access by admins
- Logs are retained for 30 days minimum
- Logs do not contain sensitive data (passwords, tokens)

**Acceptance Criteria:**
- [ ] Failed logins are logged with IP address and timestamp
- [ ] Admin actions are logged (create user, delete data)
- [ ] Logs are searchable and filterable
- [ ] Log retention policy is configured

**Exclusions:**
- ❌ SIEM integration (Phase 3)
- ❌ Real-time threat detection (Phase 3)
- ❌ Compliance audit reports (Phase 2)

---

#### 3.5.2 Vulnerability Management
**Requirements:**
- Dependencies are scanned for known vulnerabilities
- Critical vulnerabilities are patched within 7 days
- High vulnerabilities are patched within 30 days
- Security advisories are monitored

**Acceptance Criteria:**
- [ ] `npm audit` runs in CI/CD pipeline
- [ ] No critical vulnerabilities in production
- [ ] High vulnerabilities have remediation plan
- [ ] Dependabot or similar tool configured

---

## 4. Performance Baselines

These baselines must be met in production environment with real-world data.

### 4.1 Frontend Performance

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| First Contentful Paint (FCP) | < 2.0s | Lighthouse |
| Largest Contentful Paint (LCP) | < 3.0s | Lighthouse |
| Time to Interactive (TTI) | < 5.0s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Total Bundle Size | < 500 KB (gzipped) | Webpack Bundle Analyzer |
| JavaScript Execution Time | < 2.0s | Chrome DevTools |
| Lighthouse Performance Score | > 70 | Lighthouse |

**Test Conditions:**
- Device: Mobile (Moto G4 or equivalent)
- Network: Simulated 3G
- Browser: Chrome latest

---

### 4.2 Backend Performance

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| Database Query Time (P95) | < 100ms | Supabase Studio |
| API Response Time - Read (P95) | < 200ms | Application monitoring |
| API Response Time - Write (P95) | < 500ms | Application monitoring |
| Edge Function Cold Start | < 2s | Supabase logs |
| Edge Function Warm Response | < 200ms | Supabase logs |
| Database Connections | < 20 active | Supabase dashboard |

**Test Conditions:**
- 50 concurrent users
- 10 schools with real data
- 5,000 students
- 50,000 attendance records

---

### 4.3 Reliability Metrics

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| Uptime | > 99% (7.2h downtime/month) | UptimeRobot |
| Error Rate | < 1% of requests | Sentry |
| API Success Rate | > 99% | Application monitoring |
| Mean Time To Recovery (MTTR) | < 1 hour | Incident tracking |
| Failed Login Rate | < 5% (excludes attacks) | Application logs |

---

## 5. Explicitly Excluded from MVP

The following features are **NOT** included in Package A MVP and should not block launch:

### 5.1 Phase 1 Enhancements (Within 3 Months Post-Launch)
- ✖️ Email notifications
- ✖️ Password reset via email
- ✖️ Mobile app (React Native)
- ✖️ PDF/Excel report exports
- ✖️ Bulk attendance marking
- ✖️ Profile picture uploads
- ✖️ Interactive onboarding tutorial

### 5.2 Phase 2 Features (3-6 Months Post-Launch)
- ✖️ Finance & payment processing
- ✖️ Grading & gradebook
- ✖️ Assignment management
- ✖️ Parent-teacher messaging
- ✖️ SMS notifications
- ✖️ Advanced reporting & analytics
- ✖️ Custom roles & permissions
- ✖️ Leave request management

### 5.3 Phase 3+ Features (6+ Months Post-Launch)
- ✖️ Learning Management System (LMS)
- ✖️ Content library
- ✖️ Quizzes & assessments
- ✖️ Discussion forums
- ✖️ Calendar & scheduling
- ✖️ Resource management (classrooms, equipment)
- ✖️ Transportation management
- ✖️ Cafeteria management
- ✖️ Library management

### 5.4 Phase 4+ Features (12+ Months Post-Launch)
- ✖️ AI chatbot (WhatsApp integration)
- ✖️ RFID attendance
- ✖️ QR code attendance
- ✖️ Facial recognition
- ✖️ Predictive analytics
- ✖️ Machine learning insights

### 5.5 Phase 5+ Features (18+ Months Post-Launch)
- ✖️ Microservices architecture
- ✖️ Multi-region deployment
- ✖️ 99.9% uptime SLA
- ✖️ Real-time collaboration
- ✖️ Video conferencing integration
- ✖️ Advanced security features (SSO, SAML)

### 5.6 Never in Scope (Not Part of Product)
- ✖️ Accounting software integration (QuickBooks, Xero)
- ✖️ Government reporting compliance (specific to regions)
- ✖️ Legal/compliance advisory services
- ✖️ Hardware provision (servers, tablets, RFID readers)
- ✖️ On-premise installation
- ✖️ White-label/reseller program
- ✖️ Custom development for individual schools

---

## 6. Launch Readiness Checklist

Before declaring MVP complete and launching to production, all items must be checked:

### 6.1 Functional Completeness
- [ ] All user roles can log in
- [ ] Admin can create and manage users
- [ ] Admin can create and manage classes
- [ ] Teacher can mark attendance
- [ ] Student can view their attendance
- [ ] Parent can view their children's attendance
- [ ] Users receive in-app notifications
- [ ] Basic reports are functional
- [ ] All user flows have been tested end-to-end

### 6.2 Performance
- [ ] Lighthouse score > 70 on production
- [ ] Page load times meet targets (< 3s)
- [ ] API response times meet targets (< 500ms)
- [ ] Database queries meet targets (< 100ms)
- [ ] Load test with 100 concurrent users passed

### 6.3 Security
- [ ] All tables have RLS enabled
- [ ] RLS policies tested and verified
- [ ] Security audit completed (no critical/high vulnerabilities)
- [ ] Penetration testing completed (basic)
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF protection verified
- [ ] Rate limiting configured
- [ ] Password security validated
- [ ] No secrets in code repository
- [ ] Environment variables properly configured

### 6.4 Reliability
- [ ] Database backups configured and tested
- [ ] Backup restoration tested successfully
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Alerts configured for critical errors
- [ ] Incident response plan documented
- [ ] No data loss in testing

### 6.5 Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Deployment process documented
- [ ] User roles and permissions documented
- [ ] Admin guide created
- [ ] Teacher quick start guide created
- [ ] Known issues/limitations documented

### 6.6 Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data retention policy defined
- [ ] Cookie consent implemented (if applicable)
- [ ] Contact information for support published

### 6.7 Operations
- [ ] Production environment configured
- [ ] Domain and SSL certificate configured
- [ ] DNS configured correctly
- [ ] CDN configured (if applicable)
- [ ] CI/CD pipeline functional
- [ ] Rollback procedure tested
- [ ] Support email/system configured

### 6.8 User Acceptance
- [ ] Beta testing with 3-5 pilot schools completed
- [ ] Critical bugs fixed
- [ ] User feedback incorporated
- [ ] Usability issues resolved
- [ ] Teachers can complete attendance flow in < 5 min
- [ ] Admins can complete class setup in < 10 min

### 6.9 Business Readiness
- [ ] Pricing model defined
- [ ] Payment processing configured (if charging)
- [ ] Customer onboarding process defined
- [ ] Support channels established
- [ ] Marketing materials ready
- [ ] Launch communication plan ready

---

## 7. Success Metrics (Post-Launch)

After launch, track these metrics to validate MVP success:

### 7.1 Adoption Metrics (First 30 Days)
- **Target**: 10 schools onboarded
- **Target**: 50+ teachers actively using system
- **Target**: 80%+ of teachers mark attendance at least 3x/week

### 7.2 Usage Metrics (First 30 Days)
- **Target**: Average session duration > 5 minutes
- **Target**: 70%+ of users log in at least weekly
- **Target**: 90%+ of classes have attendance marked daily

### 7.3 Quality Metrics (First 30 Days)
- **Target**: < 10 critical bugs reported
- **Target**: < 5% error rate
- **Target**: 99%+ uptime
- **Target**: < 5% of users report usability issues

### 7.4 Satisfaction Metrics (First 30 Days)
- **Target**: 80%+ of users rate experience as "Good" or "Excellent"
- **Target**: Net Promoter Score (NPS) > 30
- **Target**: < 10% churn rate in pilot schools

### 7.5 Performance Metrics (Ongoing)
- **Target**: Maintain Lighthouse score > 70
- **Target**: P95 API response time < 500ms
- **Target**: Uptime > 99%

---

## 8. Go/No-Go Decision Criteria

The product can launch if:

✅ All functional requirements are complete
✅ All performance baselines are met
✅ All security requirements are met
✅ All items in Launch Readiness Checklist are checked
✅ At least 3 pilot schools have successfully used the system for 2+ weeks
✅ No critical or high-severity bugs are open
✅ Product Owner and Technical Lead approve launch

The product should **NOT** launch if:

❌ Any critical security vulnerability exists
❌ Data loss or corruption occurs during testing
❌ Performance is significantly below targets (> 50% deviation)
❌ Critical user flows are broken
❌ Pilot schools report major usability issues
❌ Legal/compliance requirements are not met

---

## 9. Definition of Done

A feature is considered **DONE** when:

1. ✅ Code is written and follows coding standards
2. ✅ Unit tests pass (if applicable)
3. ✅ Integration tests pass
4. ✅ Code review is approved
5. ✅ Feature works in staging environment
6. ✅ Security review is complete (no vulnerabilities introduced)
7. ✅ Performance is acceptable (no significant degradation)
8. ✅ Documentation is updated
9. ✅ Product Owner has accepted the feature
10. ✅ Feature is deployed to production

---

## 10. Risk Assessment

### 10.1 High Priority Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Security breach / data leak | **Critical** | Rigorous security testing, penetration testing, RLS verification |
| Performance degradation with real users | **High** | Load testing, performance monitoring, optimization |
| User adoption failure | **High** | User testing, iterative feedback, simplify UX |
| Data loss incident | **Critical** | Backup testing, transaction integrity, soft deletes |
| Third-party service outage (Supabase) | **High** | Graceful degradation, status monitoring, communication plan |

### 10.2 Medium Priority Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser compatibility issues | **Medium** | Cross-browser testing, polyfills, graceful degradation |
| Mobile usability problems | **Medium** | Mobile testing, responsive design, progressive enhancement |
| Incomplete requirements | **Medium** | Regular stakeholder reviews, pilot testing, feedback loops |
| Technical debt accumulation | **Medium** | Code reviews, refactoring sprints, documentation |

---

## 11. Appendix

### 11.1 Test Accounts

For acceptance testing, create these test accounts in staging:

```
School: Test Academy (testacademy.educrm.com)

Admin:
  - Email: admin@testacademy.com
  - Password: TestAdmin123
  - Name: Admin User

Teacher:
  - Email: teacher@testacademy.com
  - Password: TestTeacher123
  - Name: John Smith
  - Assigned Classes: Math 101, Science 202

Student:
  - Email: student@testacademy.com
  - Password: TestStudent123
  - Name: Alice Johnson
  - Enrolled Classes: Math 101, Science 202

Parent:
  - Email: parent@testacademy.com
  - Password: TestParent123
  - Name: Bob Johnson
  - Children: Alice Johnson
```

### 11.2 Key Performance Indicators (KPIs)

Track these KPIs weekly during first 3 months post-launch:

1. **Active Schools**: Number of schools with at least 1 login in past 7 days
2. **Active Users**: Number of users with at least 1 login in past 7 days
3. **Attendance Completion Rate**: % of school days with attendance marked
4. **User Retention**: % of users who return after first week
5. **Error Rate**: % of API requests that result in errors
6. **Support Tickets**: Number of support tickets opened per week
7. **Page Load Time**: P95 page load time
8. **Uptime**: % uptime over past 7 days

### 11.3 Support Channels

Provide these support channels at launch:

- **Email**: support@educrm.com (response within 24 hours)
- **In-app Help**: Link to knowledge base (future)
- **Status Page**: status.educrm.com (system status updates)

### 11.4 References

- [Architecture Document](ARCHITECTURE.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Multi-Tenancy Design](MULTI_TENANCY.md)
- [Frontend Architecture](FRONTEND_ARCHITECTURE.md)
- [Notification System](NOTIFICATION_SYSTEM.md)
- [Technical Roadmap](TECHNICAL_ROADMAP.md)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-18
**Status**: Final
**Approved By**: [Pending]

---

## Summary

**Education CRM Package A MVP** is complete when:

✅ **Core Features Work**: Authentication, multi-tenancy, class management, attendance, notifications, basic reports
✅ **Performance Meets Standards**: < 3s page load, < 500ms API response, 100 concurrent users
✅ **Security is Solid**: RLS enabled, no vulnerabilities, data encrypted, audit logs
✅ **10 Pilot Schools Successful**: Using system for 2+ weeks with positive feedback
✅ **Launch Checklist Complete**: All 50+ items checked and verified

**Remember**: MVP is about learning and validation. Launch with confidence knowing the core value proposition is solid, then iterate based on real user feedback. Better to launch with 100% of core features working perfectly than 50% of all possible features working poorly.
