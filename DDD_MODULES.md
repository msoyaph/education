# Domain-Driven Design - Module Specifications

## Education CRM MVP - Backend Modules

---

## 1. Auth & Identity Module

### 🎯 Responsibilities

**Primary:**
- User authentication (login, logout, session management)
- User registration and profile management
- Role-based access control (RBAC)
- Capability-based permissions
- Password management
- Token generation and validation
- Multi-tenant user isolation

**Core Business Rules:**
- Every user belongs to exactly one school (tenant)
- Users can have multiple roles
- Roles are composed of granular capabilities
- Capabilities are strings (e.g., "student:read", "invoice:create")
- No hardcoded role logic (roles are data, not code)
- Sessions expire after inactivity

---

### 📦 Entities

#### User (Aggregate Root)
```typescript
interface User {
  id: string;                    // UUID
  school_id: string;             // Multi-tenant FK
  email: string;                 // Unique per school
  full_name: string;
  phone?: string;
  avatar_url?: string;
  user_type: 'staff' | 'teacher' | 'parent' | 'student' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### Role (Aggregate Root)
```typescript
interface Role {
  id: string;
  school_id: string;             // Roles are school-specific
  name: string;                  // e.g., "Teacher", "Finance Manager", "Principal"
  description?: string;
  is_system_role: boolean;       // System roles vs custom school roles
  created_at: Date;
  updated_at: Date;
}
```

#### Capability (Value Object)
```typescript
interface Capability {
  id: string;
  name: string;                  // e.g., "student:read", "invoice:create"
  resource: string;              // e.g., "student", "invoice", "attendance"
  action: string;                // e.g., "read", "create", "update", "delete"
  description?: string;
  created_at: Date;
}
```

#### RoleCapability (Association)
```typescript
interface RoleCapability {
  id: string;
  role_id: string;
  capability_id: string;
  created_at: Date;
}
```

#### UserRole (Association)
```typescript
interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string;           // User ID who assigned this role
  assigned_at: Date;
}
```

#### Session (Entity)
```typescript
interface Session {
  id: string;
  user_id: string;
  school_id: string;
  token: string;                 // JWT token
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}
```

---

### 🔌 Public APIs

#### Authentication
```typescript
// Register new user
POST /api/auth/register
Body: {
  email: string;
  password: string;
  full_name: string;
  user_type: string;
  school_id: string;
}
Response: { user: User, token: string }

// Login
POST /api/auth/login
Body: { email: string; password: string; school_id: string }
Response: { user: User, token: string, roles: Role[], capabilities: string[] }

// Logout
POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean }

// Get current user
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { user: User, roles: Role[], capabilities: string[] }

// Refresh token
POST /api/auth/refresh
Body: { refresh_token: string }
Response: { token: string }
```

#### User Management
```typescript
// List users in school
GET /api/auth/users?school_id=<id>&user_type=<type>&page=1&limit=50
Response: { users: User[], total: number, page: number }

// Get user by ID
GET /api/auth/users/:id
Response: { user: User, roles: Role[] }

// Update user profile
PUT /api/auth/users/:id
Body: { full_name?: string; phone?: string; avatar_url?: string }
Response: { user: User }

// Deactivate user
PUT /api/auth/users/:id/deactivate
Response: { success: boolean }
```

#### Role & Capability Management
```typescript
// Create role
POST /api/auth/roles
Body: { school_id: string; name: string; description?: string }
Response: { role: Role }

// List roles in school
GET /api/auth/roles?school_id=<id>
Response: { roles: Role[] }

// Assign capabilities to role
POST /api/auth/roles/:id/capabilities
Body: { capability_ids: string[] }
Response: { success: boolean }

// Assign role to user
POST /api/auth/users/:user_id/roles
Body: { role_id: string }
Response: { success: boolean }

// Check user permission
GET /api/auth/users/:id/can?capability=<capability>
Response: { allowed: boolean }

// List all capabilities
GET /api/auth/capabilities
Response: { capabilities: Capability[] }
```

---

### ❌ What This Module Does NOT Handle

- ❌ School creation or settings (→ School Management Module)
- ❌ Student academic records (→ Academic Module)
- ❌ Attendance tracking (→ Academic Module)
- ❌ Sending notifications (→ Communication Module)
- ❌ Financial data (→ Finance Module)
- ❌ Business logic from other domains

**Boundary Rules:**
- Auth module only stores user identity and permissions
- Other modules reference users by `user_id` (loose coupling)
- Auth provides "Can user X do action Y?" checks
- Other modules enforce their own business rules

---

## 2. School Management Module

### 🎯 Responsibilities

**Primary:**
- School/tenant registration and onboarding
- School profile and branding
- Student information management
- Teacher/staff management
- Parent/guardian management
- Academic year and term configuration
- Course and class management
- Enrollment management

**Core Business Rules:**
- Each school is an isolated tenant
- Students belong to one school (no transfers in MVP)
- Courses are school-specific
- Students can enroll in multiple courses
- Enrollment has status (active, completed, dropped)
- Academic periods (years/terms) are school-specific

---

### 📦 Entities

#### School (Aggregate Root)
```typescript
interface School {
  id: string;
  name: string;
  code: string;                  // Unique identifier (e.g., "SCH001")
  type: 'primary' | 'secondary' | 'university' | 'training_center';
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  motto?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription_plan?: 'free' | 'basic' | 'premium';
  subscription_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### Student (Aggregate Root)
```typescript
interface Student {
  id: string;
  school_id: string;
  admission_number: string;      // Unique per school
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: Date;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  photo_url?: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  user_id?: string;              // Link to Auth module (optional)
  status: 'active' | 'graduated' | 'dropped' | 'suspended' | 'transferred';
  admission_date: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### Parent (Entity)
```typescript
interface Parent {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  phone: string;
  email?: string;
  occupation?: string;
  address?: string;
  user_id?: string;              // Link to Auth module (optional)
  created_at: Date;
  updated_at: Date;
}
```

#### StudentParent (Association)
```typescript
interface StudentParent {
  id: string;
  student_id: string;
  parent_id: string;
  is_primary_contact: boolean;
  can_pick_up: boolean;
  created_at: Date;
}
```

#### Teacher (Aggregate Root)
```typescript
interface Teacher {
  id: string;
  school_id: string;
  staff_number: string;          // Unique per school
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  user_id: string;               // Link to Auth module (required)
  specialization?: string;
  qualification?: string;
  hire_date: Date;
  status: 'active' | 'on_leave' | 'terminated';
  created_at: Date;
  updated_at: Date;
}
```

#### AcademicYear (Entity)
```typescript
interface AcademicYear {
  id: string;
  school_id: string;
  name: string;                  // e.g., "2024/2025"
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  status: 'upcoming' | 'active' | 'completed';
  created_at: Date;
  updated_at: Date;
}
```

#### AcademicTerm (Entity)
```typescript
interface AcademicTerm {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;                  // e.g., "Term 1", "Spring Semester"
  term_number: number;           // 1, 2, 3
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  status: 'upcoming' | 'active' | 'completed';
  created_at: Date;
  updated_at: Date;
}
```

#### Course (Aggregate Root)
```typescript
interface Course {
  id: string;
  school_id: string;
  code: string;                  // e.g., "MATH101"
  name: string;                  // e.g., "Mathematics Grade 10"
  description?: string;
  grade_level?: string;          // e.g., "10", "Year 1"
  subject: string;               // e.g., "Mathematics", "Science"
  credit_hours?: number;
  status: 'active' | 'inactive' | 'archived';
  created_at: Date;
  updated_at: Date;
}
```

#### Class (Entity)
```typescript
interface Class {
  id: string;
  school_id: string;
  course_id: string;
  academic_year_id: string;
  academic_term_id: string;
  class_name: string;            // e.g., "10A Math", "Biology Section B"
  teacher_id: string;
  max_students?: number;
  schedule?: string;             // JSON or text (e.g., "Mon 9-10, Wed 9-10")
  room?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}
```

#### Enrollment (Entity)
```typescript
interface Enrollment {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  course_id: string;
  academic_year_id: string;
  academic_term_id: string;
  enrollment_date: Date;
  status: 'active' | 'completed' | 'dropped' | 'withdrawn';
  grade?: string;                // Final grade (set at end of term)
  remarks?: string;
  created_at: Date;
  updated_at: Date;
}
```

---

### 🔌 Public APIs

#### School Management
```typescript
// Create school (super admin only)
POST /api/schools
Body: { name, code, type, address, city, country, phone, email }
Response: { school: School }

// Get school details
GET /api/schools/:id
Response: { school: School }

// Update school profile
PUT /api/schools/:id
Body: { name?, address?, phone?, email?, logo_url?, motto? }
Response: { school: School }
```

#### Student Management
```typescript
// Create student
POST /api/schools/:school_id/students
Body: { admission_number, first_name, last_name, date_of_birth, gender, ... }
Response: { student: Student }

// List students
GET /api/schools/:school_id/students?status=active&grade_level=10&page=1&limit=50
Response: { students: Student[], total: number }

// Get student details
GET /api/schools/:school_id/students/:id
Response: { student: Student, parents: Parent[], enrollments: Enrollment[] }

// Update student
PUT /api/schools/:school_id/students/:id
Body: { first_name?, last_name?, address?, phone?, status? }
Response: { student: Student }

// Link parent to student
POST /api/schools/:school_id/students/:id/parents
Body: { parent_id, is_primary_contact, can_pick_up }
Response: { success: boolean }
```

#### Parent Management
```typescript
// Create parent
POST /api/schools/:school_id/parents
Body: { first_name, last_name, relationship, phone, email }
Response: { parent: Parent }

// Get parent details
GET /api/schools/:school_id/parents/:id
Response: { parent: Parent, children: Student[] }
```

#### Teacher Management
```typescript
// Create teacher
POST /api/schools/:school_id/teachers
Body: { staff_number, first_name, last_name, phone, email, user_id, specialization }
Response: { teacher: Teacher }

// List teachers
GET /api/schools/:school_id/teachers?status=active
Response: { teachers: Teacher[] }

// Get teacher details
GET /api/schools/:school_id/teachers/:id
Response: { teacher: Teacher, classes: Class[] }
```

#### Academic Year & Term
```typescript
// Create academic year
POST /api/schools/:school_id/academic-years
Body: { name, start_date, end_date }
Response: { academicYear: AcademicYear }

// List academic years
GET /api/schools/:school_id/academic-years
Response: { academicYears: AcademicYear[] }

// Create term
POST /api/schools/:school_id/academic-terms
Body: { academic_year_id, name, term_number, start_date, end_date }
Response: { term: AcademicTerm }

// Get current term
GET /api/schools/:school_id/academic-terms/current
Response: { term: AcademicTerm }
```

#### Course & Class Management
```typescript
// Create course
POST /api/schools/:school_id/courses
Body: { code, name, subject, grade_level, description }
Response: { course: Course }

// List courses
GET /api/schools/:school_id/courses?subject=Math&grade_level=10
Response: { courses: Course[] }

// Create class
POST /api/schools/:school_id/classes
Body: { course_id, academic_year_id, academic_term_id, class_name, teacher_id, max_students }
Response: { class: Class }

// List classes
GET /api/schools/:school_id/classes?academic_term_id=<id>&teacher_id=<id>
Response: { classes: Class[] }
```

#### Enrollment Management
```typescript
// Enroll student in class
POST /api/schools/:school_id/enrollments
Body: { student_id, class_id, enrollment_date }
Response: { enrollment: Enrollment }

// Get student enrollments
GET /api/schools/:school_id/students/:student_id/enrollments?academic_term_id=<id>
Response: { enrollments: Enrollment[] }

// Get class roster
GET /api/schools/:school_id/classes/:class_id/students
Response: { students: Student[], enrollments: Enrollment[] }

// Update enrollment status
PUT /api/schools/:school_id/enrollments/:id
Body: { status: 'dropped' | 'withdrawn' }
Response: { enrollment: Enrollment }
```

---

### ❌ What This Module Does NOT Handle

- ❌ User authentication or permissions (→ Auth Module)
- ❌ Attendance tracking (→ Academic Module)
- ❌ Grade calculations or report cards (→ Academic Module)
- ❌ Financial transactions or billing (→ Finance Module)
- ❌ Sending notifications or messages (→ Communication Module)
- ❌ Timetable generation (Future feature)
- ❌ Exam scheduling (Future feature)

**Boundary Rules:**
- School Management owns the "who" (students, teachers, parents)
- Other modules handle the "what" and "when" (attendance, grades, payments)
- This module is the source of truth for student/teacher identity
- Other modules reference students/teachers by ID

---

## 3. Academic Module (Attendance Only)

### 🎯 Responsibilities

**Primary:**
- Track daily student attendance
- Mark present/absent/late/excused
- Record attendance at class level
- Attendance reporting and analytics
- Absence notifications (trigger events)

**Core Business Rules:**
- Attendance is marked per class session
- Only enrolled students can have attendance marked
- Attendance status: present, absent, late, excused, half_day
- Teachers can mark attendance for their classes only
- Attendance can be edited within same day (audit trail)
- One attendance record per student per class per date

---

### 📦 Entities

#### AttendanceRecord (Aggregate Root)
```typescript
interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;            // FK to School Management
  class_id: string;              // FK to School Management
  date: Date;                    // Date of attendance (date only, no time)
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
  check_in_time?: Date;          // Actual arrival time (if late)
  remarks?: string;              // Teacher notes
  marked_by: string;             // User ID (teacher)
  marked_at: Date;               // Timestamp when marked
  edited_by?: string;            // User ID (if edited)
  edited_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### AttendanceSummary (Read Model / View)
```typescript
interface AttendanceSummary {
  student_id: string;
  school_id: string;
  academic_term_id: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_percentage: number;
  last_updated: Date;
}
```

---

### 🔌 Public APIs

#### Mark Attendance
```typescript
// Mark attendance for a class (bulk)
POST /api/schools/:school_id/attendance/mark
Body: {
  class_id: string;
  date: string;                  // ISO date (YYYY-MM-DD)
  records: Array<{
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    check_in_time?: string;
    remarks?: string;
  }>;
}
Response: { success: boolean, records_created: number }

// Mark individual student attendance
POST /api/schools/:school_id/attendance/mark-single
Body: {
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time?: string;
  remarks?: string;
}
Response: { attendanceRecord: AttendanceRecord }
```

#### Query Attendance
```typescript
// Get attendance for a class on a date
GET /api/schools/:school_id/attendance/class/:class_id?date=2024-01-15
Response: {
  class: Class,
  date: string,
  students: Array<{
    student: Student,
    attendance: AttendanceRecord | null
  }>
}

// Get student attendance history
GET /api/schools/:school_id/attendance/student/:student_id?from=2024-01-01&to=2024-03-31&class_id=<id>
Response: {
  student: Student,
  records: AttendanceRecord[],
  summary: {
    total_days: number,
    present: number,
    absent: number,
    late: number,
    excused: number,
    attendance_rate: number
  }
}

// Get attendance summary for term
GET /api/schools/:school_id/attendance/summary?academic_term_id=<id>&class_id=<id>
Response: {
  term: AcademicTerm,
  summaries: Array<{
    student: Student,
    summary: AttendanceSummary
  }>
}
```

#### Update Attendance
```typescript
// Edit attendance record (same day only)
PUT /api/schools/:school_id/attendance/:id
Body: { status?, remarks? }
Response: { attendanceRecord: AttendanceRecord }

// Delete attendance record (admin only)
DELETE /api/schools/:school_id/attendance/:id
Response: { success: boolean }
```

#### Reports
```typescript
// Daily attendance report (all classes)
GET /api/schools/:school_id/attendance/reports/daily?date=2024-01-15
Response: {
  date: string,
  total_students: number,
  present: number,
  absent: number,
  late: number,
  attendance_rate: number,
  by_class: Array<{
    class: Class,
    total: number,
    present: number,
    absent: number
  }>
}

// Student attendance alert (low attendance)
GET /api/schools/:school_id/attendance/alerts?threshold=80&academic_term_id=<id>
Response: {
  students: Array<{
    student: Student,
    attendance_rate: number,
    absent_days: number
  }>
}
```

---

### 🔄 Events Published

```typescript
// When attendance is marked
AttendanceMarked {
  school_id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: string;
  marked_by: string;
}

// When student is absent
StudentAbsent {
  school_id: string;
  student_id: string;
  class_id: string;
  date: string;
  parents: string[];             // Parent IDs to notify
}

// When student has low attendance
LowAttendanceAlert {
  school_id: string;
  student_id: string;
  attendance_rate: number;
  absent_days: number;
  academic_term_id: string;
}
```

---

### ❌ What This Module Does NOT Handle

- ❌ Student or teacher management (→ School Management Module)
- ❌ Course or class creation (→ School Management Module)
- ❌ Grade recording or academic performance (Future feature)
- ❌ Sending notifications to parents (→ Communication Module - subscribes to events)
- ❌ Timetable or scheduling (Future feature)
- ❌ Leave applications or approval (Future feature)
- ❌ RFID or biometric attendance (Future integration)

**Boundary Rules:**
- Academic module only tracks attendance data
- Does not own student/class data (references by ID)
- Publishes events for other modules to react to
- Communication module decides how to notify parents

---

## 4. Communication Module (Notifications Only)

### 🎯 Responsibilities

**Primary:**
- Send system notifications to users
- Track notification delivery status
- User notification preferences
- Notification history and read status
- Multi-channel notification (in-app, email, SMS - future)

**Core Business Rules:**
- Notifications are triggered by events from other modules
- Users can mark notifications as read
- Notifications have types (info, success, warning, alert)
- Notifications can be targeted (user-specific) or broadcast (role-based)
- Notification preferences are per user
- Unread notifications are highlighted

---

### 📦 Entities

#### Notification (Aggregate Root)
```typescript
interface Notification {
  id: string;
  school_id: string;
  recipient_id: string;          // User ID
  type: 'info' | 'success' | 'warning' | 'alert';
  category: 'attendance' | 'academic' | 'finance' | 'system' | 'announcement';
  title: string;
  message: string;
  data?: Record<string, any>;    // Additional context (e.g., student_id, class_id)
  action_url?: string;           // Deep link to relevant page
  is_read: boolean;
  read_at?: Date;
  delivery_status: 'pending' | 'sent' | 'failed';
  channel: 'in_app' | 'email' | 'sms' | 'push';
  sent_at?: Date;
  created_at: Date;
}
```

#### NotificationPreference (Entity)
```typescript
interface NotificationPreference {
  id: string;
  user_id: string;
  school_id: string;
  category: 'attendance' | 'academic' | 'finance' | 'system' | 'announcement';
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### NotificationTemplate (Value Object)
```typescript
interface NotificationTemplate {
  id: string;
  school_id?: string;            // null = system-wide template
  name: string;                  // e.g., "student_absent"
  category: string;
  title_template: string;        // e.g., "{{student_name}} was absent"
  message_template: string;
  variables: string[];           // e.g., ["student_name", "date", "class_name"]
  created_at: Date;
  updated_at: Date;
}
```

---

### 🔌 Public APIs

#### Send Notifications
```typescript
// Create notification (system use)
POST /api/schools/:school_id/notifications
Body: {
  recipient_id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  category: string;
  title: string;
  message: string;
  data?: object;
  action_url?: string;
  channel?: 'in_app' | 'email' | 'sms';
}
Response: { notification: Notification }

// Bulk send notifications
POST /api/schools/:school_id/notifications/bulk
Body: {
  recipient_ids: string[];
  type: string;
  category: string;
  title: string;
  message: string;
  data?: object;
}
Response: { notifications_sent: number }
```

#### Query Notifications
```typescript
// Get user notifications
GET /api/schools/:school_id/notifications/me?unread_only=true&category=attendance&limit=50
Headers: { Authorization: "Bearer <token>" }
Response: {
  notifications: Notification[],
  unread_count: number,
  total: number
}

// Get notification by ID
GET /api/schools/:school_id/notifications/:id
Response: { notification: Notification }
```

#### Manage Notifications
```typescript
// Mark notification as read
PUT /api/schools/:school_id/notifications/:id/read
Response: { notification: Notification }

// Mark all as read
PUT /api/schools/:school_id/notifications/mark-all-read
Response: { updated_count: number }

// Delete notification
DELETE /api/schools/:school_id/notifications/:id
Response: { success: boolean }
```

#### Notification Preferences
```typescript
// Get user preferences
GET /api/schools/:school_id/notifications/preferences
Response: { preferences: NotificationPreference[] }

// Update preferences
PUT /api/schools/:school_id/notifications/preferences/:category
Body: {
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
}
Response: { preference: NotificationPreference }
```

---

### 🔄 Event Subscribers

This module listens to events from other modules and creates notifications:

```typescript
// From Academic Module
StudentAbsent → Notify parent(s)
  "Your child {{student_name}} was absent from {{class_name}} on {{date}}"

LowAttendanceAlert → Notify parent(s) and teachers
  "Alert: {{student_name}} has {{attendance_rate}}% attendance this term"

// From Finance Module (future)
InvoiceCreated → Notify parent
  "New invoice #{{invoice_number}} for {{amount}} is ready"

PaymentReceived → Notify parent
  "Payment of {{amount}} received. Thank you!"

PaymentOverdue → Notify parent
  "Invoice #{{invoice_number}} is overdue. Please pay by {{due_date}}"

// From School Management Module
StudentEnrolled → Welcome notification
  "Welcome to {{school_name}}! Your admission number is {{admission_number}}"

// From System/Admin
SystemMaintenance → Notify all users
  "System maintenance scheduled on {{date}} from {{start_time}} to {{end_time}}"
```

---

### 🔄 Events Published

```typescript
NotificationSent {
  notification_id: string;
  recipient_id: string;
  channel: string;
  sent_at: Date;
}

NotificationFailed {
  notification_id: string;
  recipient_id: string;
  channel: string;
  error: string;
}
```

---

### ❌ What This Module Does NOT Handle

- ❌ User management or authentication (→ Auth Module)
- ❌ Student/parent relationships (→ School Management Module)
- ❌ Attendance logic or tracking (→ Academic Module)
- ❌ Financial calculations (→ Finance Module)
- ❌ Direct messaging between users (Future feature - Messaging Module)
- ❌ Announcements or broadcasts (Future feature)
- ❌ Email/SMS sending (uses external service via Edge Functions)

**Boundary Rules:**
- Communication module is reactive (event-driven)
- Does not make business decisions (e.g., "when to notify")
- Other modules decide WHAT to notify, Communication handles HOW
- Does not own student/user data (references by ID)

---

## 5. Admin & Settings Module

### 🎯 Responsibilities

**Primary:**
- System-wide configuration
- School-specific settings
- Feature flags and toggles
- Audit logging (who did what, when)
- System health monitoring
- Integration configuration (future: RFID, Payment Gateway, Chatbot)

**Core Business Rules:**
- Settings are hierarchical: System → School → User
- School settings override system defaults
- Only super admins can change system settings
- All critical actions are audit logged
- Feature flags control module availability
- Settings are versioned for rollback

---

### 📦 Entities

#### SystemConfig (Aggregate Root)
```typescript
interface SystemConfig {
  id: string;
  key: string;                   // e.g., "max_students_per_school"
  value: string;                 // JSON string for complex values
  data_type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'security' | 'features' | 'integrations';
  description?: string;
  is_editable: boolean;          // Some configs are read-only
  updated_by?: string;
  updated_at: Date;
  created_at: Date;
}
```

#### SchoolSettings (Entity)
```typescript
interface SchoolSettings {
  id: string;
  school_id: string;
  key: string;                   // e.g., "attendance_marking_deadline"
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  category: 'academic' | 'attendance' | 'finance' | 'communication' | 'general';
  description?: string;
  updated_by: string;
  updated_at: Date;
  created_at: Date;
}
```

#### FeatureFlag (Entity)
```typescript
interface FeatureFlag {
  id: string;
  name: string;                  // e.g., "enable_sms_notifications"
  description?: string;
  is_enabled: boolean;
  scope: 'system' | 'school';
  school_id?: string;            // null = system-wide
  rollout_percentage?: number;   // For gradual rollout (0-100)
  created_at: Date;
  updated_at: Date;
}
```

#### AuditLog (Entity)
```typescript
interface AuditLog {
  id: string;
  school_id?: string;            // null = system-level action
  user_id: string;
  action: string;                // e.g., "student.create", "attendance.mark", "invoice.delete"
  resource_type: string;         // e.g., "student", "user", "invoice"
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  result: 'success' | 'failure';
  error_message?: string;
  timestamp: Date;
}
```

#### IntegrationConfig (Entity)
```typescript
interface IntegrationConfig {
  id: string;
  school_id: string;
  integration_type: 'rfid' | 'payment_gateway' | 'sms_provider' | 'email_provider' | 'chatbot';
  provider_name: string;         // e.g., "Stripe", "M-Pesa", "Twilio"
  is_enabled: boolean;
  config_data: Record<string, any>; // Encrypted credentials
  webhook_url?: string;
  webhook_secret?: string;
  last_sync_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

---

### 🔌 Public APIs

#### System Configuration (Super Admin Only)
```typescript
// List system configs
GET /api/admin/system/configs?category=features
Response: { configs: SystemConfig[] }

// Update system config
PUT /api/admin/system/configs/:key
Body: { value: string }
Response: { config: SystemConfig }
```

#### School Settings
```typescript
// Get school settings
GET /api/admin/schools/:school_id/settings?category=academic
Response: { settings: SchoolSettings[] }

// Update school setting
PUT /api/admin/schools/:school_id/settings/:key
Body: { value: string }
Response: { setting: SchoolSettings }

// Bulk update settings
PUT /api/admin/schools/:school_id/settings/bulk
Body: {
  settings: Array<{ key: string, value: string }>
}
Response: { updated_count: number }
```

#### Feature Flags
```typescript
// List feature flags
GET /api/admin/feature-flags?scope=school&school_id=<id>
Response: { flags: FeatureFlag[] }

// Check if feature is enabled
GET /api/admin/feature-flags/:name/enabled?school_id=<id>
Response: { enabled: boolean }

// Toggle feature flag
PUT /api/admin/feature-flags/:id/toggle
Body: { is_enabled: boolean, school_id?: string }
Response: { flag: FeatureFlag }
```

#### Audit Logs
```typescript
// Query audit logs
GET /api/admin/audit-logs?school_id=<id>&user_id=<id>&action=student.create&from=2024-01-01&to=2024-12-31&limit=100
Response: {
  logs: AuditLog[],
  total: number,
  page: number
}

// Get audit log details
GET /api/admin/audit-logs/:id
Response: { log: AuditLog }

// Export audit logs (CSV)
GET /api/admin/audit-logs/export?school_id=<id>&from=2024-01-01&to=2024-12-31
Response: CSV file download
```

#### Integration Management
```typescript
// List integrations for school
GET /api/admin/schools/:school_id/integrations
Response: { integrations: IntegrationConfig[] }

// Configure integration
POST /api/admin/schools/:school_id/integrations
Body: {
  integration_type: 'payment_gateway';
  provider_name: 'Stripe';
  config_data: { api_key: '***', webhook_secret: '***' };
}
Response: { integration: IntegrationConfig }

// Test integration
POST /api/admin/schools/:school_id/integrations/:id/test
Response: { success: boolean, message: string }

// Enable/disable integration
PUT /api/admin/schools/:school_id/integrations/:id/toggle
Body: { is_enabled: boolean }
Response: { integration: IntegrationConfig }
```

---

### 🔄 Events Published

```typescript
SettingChanged {
  school_id?: string;
  key: string;
  old_value: string;
  new_value: string;
  changed_by: string;
}

FeatureFlagToggled {
  flag_name: string;
  is_enabled: boolean;
  school_id?: string;
}

IntegrationConfigured {
  school_id: string;
  integration_type: string;
  provider_name: string;
}
```

---

### 🔄 Audit Logging

This module automatically logs all critical actions from other modules:

```typescript
// Automatically logged actions:
- User login/logout
- User created/updated/deleted
- Role assigned/revoked
- Student created/updated/deleted
- Attendance marked/edited
- Invoice created/updated/deleted
- Payment recorded
- Settings changed
- Integration configured
```

---

### ❌ What This Module Does NOT Handle

- ❌ User authentication (→ Auth Module)
- ❌ Business logic from other domains
- ❌ Data validation (handled by each module)
- ❌ Direct user notifications (→ Communication Module)
- ❌ School registration workflow (→ School Management Module)
- ❌ Payment processing logic (→ Finance Module - future)

**Boundary Rules:**
- Admin module is cross-cutting (supports all modules)
- Does not enforce business rules
- Provides configuration, other modules interpret settings
- Audit logging is passive (observes, does not control)

---

## 6. Cross-Module Communication

### 6.1 Direct API Calls (Synchronous)

```typescript
// Example: Finance needs student name for invoice
Finance Module → School Management API
  GET /api/schools/:school_id/students/:id
  → Returns: { student: Student }

// Example: Academic needs to verify teacher owns class
Academic Module → School Management API
  GET /api/schools/:school_id/classes/:id
  → Returns: { class: Class, teacher_id: string }
```

**Rules:**
- Only for reading reference data
- Use minimal data transfer (avoid deep nesting)
- Cache aggressively
- Handle failures gracefully

---

### 6.2 Event-Driven Communication (Asynchronous)

```typescript
// Example: Attendance → Communication
Academic publishes: StudentAbsent
  → Communication subscribes: Creates notification for parents

// Example: School Management → Multiple modules
School publishes: StudentEnrolled
  → Finance subscribes: Creates default fee invoice (if configured)
  → Communication subscribes: Sends welcome message
  → Admin subscribes: Logs enrollment action
```

**Rules:**
- Events are fire-and-forget
- No guaranteed delivery in MVP (best effort)
- Subscribers cannot block publishers
- Events are immutable facts (past tense)

---

## 7. Multi-Tenant Isolation

**Every module enforces:**
1. `school_id` column on all tables
2. RLS policies: `WHERE school_id = auth.jwt()->>'school_id'`
3. API middleware validates school_id in request matches JWT
4. No cross-tenant queries allowed

---

## 8. Summary Table

| Module | Primary Responsibility | Key Entities | Dependencies |
|--------|------------------------|--------------|--------------|
| **Auth & Identity** | Authentication, RBAC | User, Role, Capability | None |
| **School Management** | Students, Teachers, Courses | Student, Teacher, Course, Enrollment | Auth |
| **Academic (Attendance)** | Attendance tracking | AttendanceRecord | School Mgmt, Auth |
| **Communication (Notifications)** | Notifications | Notification, Preference | All modules (events) |
| **Admin & Settings** | Configuration, Audit | Config, FeatureFlag, AuditLog | Auth |

---

## Next Steps

1. ✅ Define database schemas for each module
2. ✅ Create RLS policies
3. ✅ Implement API service layer
4. ✅ Build event bus infrastructure
5. ✅ Create frontend components
6. ✅ Wire up module communication

Ready to proceed with database schema implementation?
