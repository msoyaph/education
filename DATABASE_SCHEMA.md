# Database Schema Design

## Education CRM - MVP Schema

---

## Overview

**Architecture:** Multi-tenant, PostgreSQL (Supabase)
**Scope:** Users, Roles, Students, Parents, Classes, Attendance, Notifications
**Excluded:** Grades, Finance, Advanced Features

---

## Schema Diagram

```
┌─────────────────┐
│    schools      │ ◄─────┐
└─────────────────┘       │
         ▲                │
         │ school_id      │ school_id
         │                │
┌────────┴────────┐       │
│  user_profiles  │       │
└─────────────────┘       │
         │                │
         ├─────► students ├─────► student_parents ◄───── parents
         │        │                                        │
         ├─────► teachers                                 │
         │        │                                        │
         └─────► parents   school_id ────────────────────┘
                  │
         ┌────────┴────────┐
         │   user_roles    │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │      roles      │
         └────────┬────────┘
                  │
         ┌────────▼─────────┐
         │ role_capabilities│
         └────────┬─────────┘
                  │
         ┌────────▼────────┐
         │  capabilities   │
         └─────────────────┘

┌─────────────────┐
│    courses      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    classes      │ ◄───── teachers
└────────┬────────┘
         │
         ├─────► enrollments ◄───── students
         │
         └─────► attendance_records ◄───── students

┌─────────────────┐
│ notifications   │ ◄───── user_profiles
└─────────────────┘
```

---

## Table Definitions

### 1. Core Multi-Tenant

#### `schools`
**Purpose:** Root multi-tenant entity

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique school identifier |
| name | text | NOT NULL | School name |
| code | text | UNIQUE, NOT NULL | Short code (e.g., "SCH001") |
| email | text | | Official school email |
| phone | text | | Contact phone |
| address | text | | Physical address |
| city | text | | City |
| state | text | | State/Province |
| country | text | NOT NULL, DEFAULT 'USA' | Country |
| timezone | text | NOT NULL, DEFAULT 'America/New_York' | School timezone |
| logo_url | text | | School logo |
| is_active | boolean | NOT NULL, DEFAULT true | Active status |
| settings | jsonb | DEFAULT '{}' | School-specific settings |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_schools_code` on (code)
- `idx_schools_active` on (is_active)

---

### 2. Authentication & Users

#### `user_profiles`
**Purpose:** Extended user information (links to Supabase auth.users)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Same as auth.users.id |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| email | text | NOT NULL | Email (synced from auth) |
| first_name | text | NOT NULL | First name |
| last_name | text | NOT NULL | Last name |
| full_name | text | GENERATED | Concatenated name |
| phone | text | | Phone number |
| avatar_url | text | | Profile picture |
| user_type | text | NOT NULL | 'admin', 'teacher', 'parent', 'student', 'it_admin' |
| is_active | boolean | NOT NULL, DEFAULT true | Active status |
| last_login_at | timestamptz | | Last login time |
| metadata | jsonb | DEFAULT '{}' | Additional user data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_user_profiles_school` on (school_id)
- `idx_user_profiles_email` on (email)
- `idx_user_profiles_type` on (user_type)
- `idx_user_profiles_active` on (school_id, is_active)

**Constraints:**
- CHECK (user_type IN ('admin', 'teacher', 'parent', 'student', 'it_admin'))

---

### 3. Authorization

#### `roles`
**Purpose:** Role definitions per school

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique role ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| name | text | NOT NULL | Role name |
| description | text | | Role description |
| is_system_role | boolean | NOT NULL, DEFAULT false | System-defined role |
| is_active | boolean | NOT NULL, DEFAULT true | Active status |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_roles_school` on (school_id)
- `idx_roles_active` on (school_id, is_active)

**Constraints:**
- UNIQUE (school_id, name)

---

#### `capabilities`
**Purpose:** Global capability definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique capability ID |
| name | text | UNIQUE, NOT NULL | Capability name (e.g., "student:read") |
| resource | text | NOT NULL | Resource type |
| action | text | NOT NULL | Action type |
| description | text | | Capability description |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_capabilities_name` on (name)
- `idx_capabilities_resource` on (resource)

**Constraints:**
- CHECK (name = resource || ':' || action)

---

#### `role_capabilities`
**Purpose:** Many-to-many: Roles ↔ Capabilities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique ID |
| role_id | uuid | NOT NULL, FK → roles(id) ON DELETE CASCADE | Role reference |
| capability_id | uuid | NOT NULL, FK → capabilities(id) ON DELETE CASCADE | Capability reference |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_role_capabilities_role` on (role_id)
- `idx_role_capabilities_capability` on (capability_id)

**Constraints:**
- UNIQUE (role_id, capability_id)

---

#### `user_roles`
**Purpose:** Many-to-many: Users ↔ Roles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique ID |
| user_id | uuid | NOT NULL, FK → user_profiles(id) ON DELETE CASCADE | User reference |
| role_id | uuid | NOT NULL, FK → roles(id) ON DELETE CASCADE | Role reference |
| assigned_by | uuid | FK → user_profiles(id) | Who assigned this role |
| assigned_at | timestamptz | DEFAULT now() | Assignment timestamp |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_user_roles_user` on (user_id)
- `idx_user_roles_role` on (role_id)

**Constraints:**
- UNIQUE (user_id, role_id)

---

### 4. Student Management

#### `students`
**Purpose:** Student records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique student ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| user_id | uuid | UNIQUE, FK → user_profiles(id) ON DELETE SET NULL | Linked user account |
| student_code | text | NOT NULL | Student code (e.g., "2024001") |
| first_name | text | NOT NULL | First name |
| last_name | text | NOT NULL | Last name |
| full_name | text | GENERATED | Concatenated name |
| date_of_birth | date | | Birth date |
| gender | text | | Gender |
| email | text | | Student email |
| phone | text | | Student phone |
| address | text | | Home address |
| city | text | | City |
| state | text | | State/Province |
| emergency_contact_name | text | | Emergency contact name |
| emergency_contact_phone | text | | Emergency contact phone |
| enrollment_date | date | DEFAULT CURRENT_DATE | Enrollment date |
| status | text | NOT NULL, DEFAULT 'active' | 'active', 'inactive', 'graduated', 'transferred' |
| grade_level | text | | Grade/Year level |
| section | text | | Section/Division |
| photo_url | text | | Student photo |
| notes | text | | Additional notes |
| metadata | jsonb | DEFAULT '{}' | Additional data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_students_school` on (school_id)
- `idx_students_code` on (school_id, student_code)
- `idx_students_user` on (user_id)
- `idx_students_status` on (school_id, status)
- `idx_students_name` on (school_id, last_name, first_name)

**Constraints:**
- UNIQUE (school_id, student_code)
- CHECK (status IN ('active', 'inactive', 'graduated', 'transferred'))

---

#### `parents`
**Purpose:** Parent/guardian records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique parent ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| user_id | uuid | UNIQUE, FK → user_profiles(id) ON DELETE SET NULL | Linked user account |
| first_name | text | NOT NULL | First name |
| last_name | text | NOT NULL | Last name |
| full_name | text | GENERATED | Concatenated name |
| email | text | | Parent email |
| phone | text | | Primary phone |
| alternate_phone | text | | Alternate phone |
| address | text | | Home address |
| city | text | | City |
| state | text | | State/Province |
| relationship | text | | Relationship to student |
| occupation | text | | Occupation |
| is_primary_contact | boolean | DEFAULT false | Primary contact flag |
| is_emergency_contact | boolean | DEFAULT true | Emergency contact flag |
| can_pickup | boolean | DEFAULT true | Authorized to pick up student |
| notes | text | | Additional notes |
| metadata | jsonb | DEFAULT '{}' | Additional data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_parents_school` on (school_id)
- `idx_parents_user` on (user_id)
- `idx_parents_email` on (email)
- `idx_parents_name` on (school_id, last_name, first_name)

---

#### `student_parents`
**Purpose:** Many-to-many: Students ↔ Parents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique ID |
| student_id | uuid | NOT NULL, FK → students(id) ON DELETE CASCADE | Student reference |
| parent_id | uuid | NOT NULL, FK → parents(id) ON DELETE CASCADE | Parent reference |
| relationship | text | NOT NULL | 'father', 'mother', 'guardian', 'other' |
| is_primary | boolean | DEFAULT false | Primary parent flag |
| can_pickup | boolean | DEFAULT true | Pickup authorization |
| notes | text | | Additional notes |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_student_parents_student` on (student_id)
- `idx_student_parents_parent` on (parent_id)
- `idx_student_parents_primary` on (student_id, is_primary)

**Constraints:**
- UNIQUE (student_id, parent_id)
- CHECK (relationship IN ('father', 'mother', 'guardian', 'other'))

---

### 5. Teacher Management

#### `teachers`
**Purpose:** Teacher records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique teacher ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| user_id | uuid | UNIQUE, NOT NULL, FK → user_profiles(id) ON DELETE CASCADE | Linked user account |
| employee_code | text | NOT NULL | Employee code |
| first_name | text | NOT NULL | First name |
| last_name | text | NOT NULL | Last name |
| full_name | text | GENERATED | Concatenated name |
| email | text | NOT NULL | Teacher email |
| phone | text | | Phone number |
| date_of_birth | date | | Birth date |
| hire_date | date | DEFAULT CURRENT_DATE | Hire date |
| specialization | text | | Subject specialization |
| qualification | text | | Educational qualification |
| status | text | NOT NULL, DEFAULT 'active' | 'active', 'inactive', 'on_leave' |
| photo_url | text | | Teacher photo |
| notes | text | | Additional notes |
| metadata | jsonb | DEFAULT '{}' | Additional data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_teachers_school` on (school_id)
- `idx_teachers_user` on (user_id)
- `idx_teachers_code` on (school_id, employee_code)
- `idx_teachers_status` on (school_id, status)

**Constraints:**
- UNIQUE (school_id, employee_code)
- CHECK (status IN ('active', 'inactive', 'on_leave'))

---

### 6. Academic Structure

#### `courses`
**Purpose:** Course catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique course ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| code | text | NOT NULL | Course code (e.g., "MATH101") |
| name | text | NOT NULL | Course name |
| description | text | | Course description |
| grade_level | text | | Target grade level |
| credits | numeric(4,2) | | Course credits |
| is_active | boolean | NOT NULL, DEFAULT true | Active status |
| metadata | jsonb | DEFAULT '{}' | Additional data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_courses_school` on (school_id)
- `idx_courses_code` on (school_id, code)
- `idx_courses_active` on (school_id, is_active)

**Constraints:**
- UNIQUE (school_id, code)

---

#### `classes`
**Purpose:** Class instances (course offerings)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique class ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| course_id | uuid | NOT NULL, FK → courses(id) | Course reference |
| teacher_id | uuid | FK → teachers(id) ON DELETE SET NULL | Assigned teacher |
| code | text | NOT NULL | Class code (e.g., "MATH101-A") |
| name | text | NOT NULL | Class name |
| section | text | | Section name |
| room | text | | Classroom/room number |
| schedule | text | | Schedule description |
| start_date | date | | Class start date |
| end_date | date | | Class end date |
| max_students | integer | | Maximum enrollment |
| status | text | NOT NULL, DEFAULT 'active' | 'active', 'completed', 'cancelled' |
| metadata | jsonb | DEFAULT '{}' | Additional data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_classes_school` on (school_id)
- `idx_classes_course` on (course_id)
- `idx_classes_teacher` on (teacher_id)
- `idx_classes_code` on (school_id, code)
- `idx_classes_status` on (school_id, status)

**Constraints:**
- UNIQUE (school_id, code)
- CHECK (status IN ('active', 'completed', 'cancelled'))

---

#### `enrollments`
**Purpose:** Student enrollment in classes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique enrollment ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| class_id | uuid | NOT NULL, FK → classes(id) ON DELETE CASCADE | Class reference |
| student_id | uuid | NOT NULL, FK → students(id) ON DELETE CASCADE | Student reference |
| enrollment_date | date | DEFAULT CURRENT_DATE | Enrollment date |
| status | text | NOT NULL, DEFAULT 'active' | 'active', 'dropped', 'completed' |
| dropped_date | date | | Drop date (if dropped) |
| notes | text | | Additional notes |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_enrollments_school` on (school_id)
- `idx_enrollments_class` on (class_id)
- `idx_enrollments_student` on (student_id)
- `idx_enrollments_status` on (class_id, status)

**Constraints:**
- UNIQUE (class_id, student_id)
- CHECK (status IN ('active', 'dropped', 'completed'))

---

### 7. Attendance

#### `attendance_records`
**Purpose:** Daily attendance tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique attendance ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| class_id | uuid | NOT NULL, FK → classes(id) ON DELETE CASCADE | Class reference |
| student_id | uuid | NOT NULL, FK → students(id) ON DELETE CASCADE | Student reference |
| attendance_date | date | NOT NULL | Attendance date |
| status | text | NOT NULL | 'present', 'absent', 'late', 'excused' |
| check_in_time | time | | Check-in time |
| check_out_time | time | | Check-out time |
| marked_by | uuid | FK → user_profiles(id) | Who marked attendance |
| marked_at | timestamptz | DEFAULT now() | When marked |
| notes | text | | Additional notes |
| metadata | jsonb | DEFAULT '{}' | Additional data (e.g., RFID) |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_attendance_school` on (school_id)
- `idx_attendance_class` on (class_id)
- `idx_attendance_student` on (student_id)
- `idx_attendance_date` on (school_id, attendance_date DESC)
- `idx_attendance_student_date` on (student_id, attendance_date DESC)
- `idx_attendance_class_date` on (class_id, attendance_date DESC)

**Constraints:**
- UNIQUE (class_id, student_id, attendance_date)
- CHECK (status IN ('present', 'absent', 'late', 'excused'))

---

### 8. Communication

#### `notifications`
**Purpose:** System notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique notification ID |
| school_id | uuid | NOT NULL, FK → schools(id) | School association |
| recipient_id | uuid | NOT NULL, FK → user_profiles(id) ON DELETE CASCADE | Recipient user |
| sender_id | uuid | FK → user_profiles(id) ON DELETE SET NULL | Sender user |
| type | text | NOT NULL | Notification type |
| title | text | NOT NULL | Notification title |
| message | text | NOT NULL | Notification message |
| priority | text | NOT NULL, DEFAULT 'normal' | 'low', 'normal', 'high', 'urgent' |
| status | text | NOT NULL, DEFAULT 'unread' | 'unread', 'read', 'archived' |
| read_at | timestamptz | | When read |
| action_url | text | | Action URL/link |
| metadata | jsonb | DEFAULT '{}' | Additional data |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_notifications_recipient` on (recipient_id, status, created_at DESC)
- `idx_notifications_school` on (school_id, created_at DESC)
- `idx_notifications_type` on (type)
- `idx_notifications_unread` on (recipient_id) WHERE (status = 'unread')

**Constraints:**
- CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
- CHECK (status IN ('unread', 'read', 'archived'))

---

## Relationships Summary

### One-to-Many
1. `schools` → `user_profiles` (1:N)
2. `schools` → `students` (1:N)
3. `schools` → `teachers` (1:N)
4. `schools` → `parents` (1:N)
5. `schools` → `courses` (1:N)
6. `schools` → `classes` (1:N)
7. `schools` → `roles` (1:N)
8. `courses` → `classes` (1:N)
9. `teachers` → `classes` (1:N)
10. `classes` → `enrollments` (1:N)
11. `classes` → `attendance_records` (1:N)
12. `students` → `attendance_records` (1:N)
13. `user_profiles` → `notifications` (1:N)

### Many-to-Many
1. `students` ↔ `parents` (via `student_parents`)
2. `students` ↔ `classes` (via `enrollments`)
3. `users` ↔ `roles` (via `user_roles`)
4. `roles` ↔ `capabilities` (via `role_capabilities`)

### Special
1. `user_profiles` → `students` (1:0..1, optional user account)
2. `user_profiles` → `teachers` (1:1, required user account)
3. `user_profiles` → `parents` (1:0..1, optional user account)

---

## Database Functions

### Helper Functions

```sql
-- Get user capabilities
CREATE OR REPLACE FUNCTION get_user_capabilities(p_user_id uuid)
RETURNS TABLE (capability_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.name
  FROM capabilities c
  JOIN role_capabilities rc ON rc.capability_id = c.id
  JOIN user_roles ur ON ur.role_id = rc.role_id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has capability
CREATE OR REPLACE FUNCTION user_has_capability(p_user_id uuid, p_capability text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_user_capabilities(p_user_id)
    WHERE capability_name = p_capability
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get parent's children
CREATE OR REPLACE FUNCTION get_parent_children(p_parent_id uuid)
RETURNS TABLE (student_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT sp.student_id
  FROM student_parents sp
  WHERE sp.parent_id = p_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get teacher's classes
CREATE OR REPLACE FUNCTION get_teacher_classes(p_teacher_id uuid)
RETURNS TABLE (class_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id
  FROM classes c
  WHERE c.teacher_id = p_teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Audit & Timestamps

All tables include:
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

Trigger for auto-updating `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ... (repeat for all tables)
```

---

## Total Tables: 16

1. schools
2. user_profiles
3. roles
4. capabilities
5. role_capabilities
6. user_roles
7. students
8. parents
9. student_parents
10. teachers
11. courses
12. classes
13. enrollments
14. attendance_records
15. notifications

---

## Next Steps

1. Implement migration script
2. Seed initial data (capabilities, default roles)
3. Set up RLS policies
4. Create database functions
5. Build API layer with permission checks
