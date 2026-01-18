/*
  # Education CRM - Complete Database Schema

  ## Summary
  Creates a multi-tenant Education CRM system with role-based access control,
  student management, class management, attendance tracking, and notifications.

  ## Tables Created

  ### 1. Core Multi-Tenant
  - `schools` - Root multi-tenant entity with school information

  ### 2. Authentication & Users
  - `user_profiles` - Extended user information (links to auth.users)

  ### 3. Authorization
  - `roles` - Role definitions per school
  - `capabilities` - Global capability definitions (resource:action)
  - `role_capabilities` - Many-to-many: Roles ↔ Capabilities
  - `user_roles` - Many-to-many: Users ↔ Roles

  ### 4. Student Management
  - `students` - Student records with demographics
  - `parents` - Parent/guardian records
  - `student_parents` - Many-to-many: Students ↔ Parents

  ### 5. Teacher Management
  - `teachers` - Teacher records with employment details

  ### 6. Academic Structure
  - `courses` - Course catalog
  - `classes` - Class instances (course offerings with teachers)
  - `enrollments` - Student enrollment in classes

  ### 7. Attendance
  - `attendance_records` - Daily attendance tracking

  ### 8. Communication
  - `notifications` - System notifications

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Multi-tenant isolation enforced
  - Context-aware policies for teachers and parents
  - Capability-based authorization

  ## Features
  - Audit timestamps on all tables (created_at, updated_at)
  - Auto-update triggers for updated_at
  - Helper functions for permission checks
  - Proper indexes for performance
  - Foreign key constraints with cascading deletes
*/

-- ============================================================================
-- 1. CORE MULTI-TENANT
-- ============================================================================

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'USA',
  timezone text NOT NULL DEFAULT 'America/New_York',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(is_active);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. AUTHENTICATION & USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone text,
  avatar_url text,
  user_type text NOT NULL CHECK (user_type IN ('admin', 'teacher', 'parent', 'student', 'it_admin')),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_school ON user_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(school_id, is_active);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. AUTHORIZATION
-- ============================================================================

-- Capabilities table (global)
CREATE TABLE IF NOT EXISTS capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  CHECK (name = resource || ':' || action)
);

CREATE INDEX IF NOT EXISTS idx_capabilities_name ON capabilities(name);
CREATE INDEX IF NOT EXISTS idx_capabilities_resource ON capabilities(resource);

ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;

-- Roles table (per school)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_school ON roles(school_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(school_id, is_active);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Role capabilities (many-to-many)
CREATE TABLE IF NOT EXISTS role_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  capability_id uuid NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, capability_id)
);

CREATE INDEX IF NOT EXISTS idx_role_capabilities_role ON role_capabilities(role_id);
CREATE INDEX IF NOT EXISTS idx_role_capabilities_capability ON role_capabilities(capability_id);

ALTER TABLE role_capabilities ENABLE ROW LEVEL SECURITY;

-- User roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. STUDENT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE SET NULL,
  student_code text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  date_of_birth date,
  gender text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  emergency_contact_name text,
  emergency_contact_phone text,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
  grade_level text,
  section text,
  photo_url text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, student_code)
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(school_id, student_code);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(school_id, status);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(school_id, last_name, first_name);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id uuid UNIQUE REFERENCES user_profiles(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email text,
  phone text,
  alternate_phone text,
  address text,
  city text,
  state text,
  relationship text,
  occupation text,
  is_primary_contact boolean DEFAULT false,
  is_emergency_contact boolean DEFAULT true,
  can_pickup boolean DEFAULT true,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parents_school ON parents(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_user ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
CREATE INDEX IF NOT EXISTS idx_parents_name ON parents(school_id, last_name, first_name);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Student-parent relationship (many-to-many)
CREATE TABLE IF NOT EXISTS student_parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  relationship text NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  is_primary boolean DEFAULT false,
  can_pickup boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_student_parents_student ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent ON student_parents(parent_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_primary ON student_parents(student_id, is_primary);

ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. TEACHER MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id uuid UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  hire_date date DEFAULT CURRENT_DATE,
  specialization text,
  qualification text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  photo_url text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, employee_code)
);

CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_code ON teachers(school_id, employee_code);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(school_id, status);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. ACADEMIC STRUCTURE
-- ============================================================================

-- Courses (catalog)
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  grade_level text,
  credits numeric(4,2),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_courses_school ON courses(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(school_id, code);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(school_id, is_active);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Classes (course instances)
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  section text,
  room text,
  schedule text,
  start_date date,
  end_date date,
  max_students integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_course ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(school_id, code);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(school_id, status);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Enrollments (student enrollment in classes)
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  dropped_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_school ON enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(class_id, status);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. ATTENDANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time time,
  check_out_time time,
  marked_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  marked_at timestamptz DEFAULT now(),
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance_records(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(school_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_records(class_id, attendance_date DESC);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. COMMUNICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  read_at timestamptz,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_school ON notifications(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id) WHERE (status = 'unread');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. AUDIT & TRIGGERS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Get user's capabilities
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

-- Check if user has a specific capability
CREATE OR REPLACE FUNCTION user_has_capability(p_user_id uuid, p_capability text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_user_capabilities(p_user_id)
    WHERE capability_name = p_capability
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get parent's linked children
CREATE OR REPLACE FUNCTION get_parent_children(p_parent_id uuid)
RETURNS TABLE (student_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT sp.student_id
  FROM student_parents sp
  WHERE sp.parent_id = p_parent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get teacher's assigned classes
CREATE OR REPLACE FUNCTION get_teacher_classes(p_teacher_id uuid)
RETURNS TABLE (class_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id
  FROM classes c
  WHERE c.teacher_id = p_teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if student is in teacher's class
CREATE OR REPLACE FUNCTION is_student_in_teacher_class(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE c.teacher_id = p_teacher_id
    AND e.student_id = p_student_id
    AND e.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if student is linked to parent
CREATE OR REPLACE FUNCTION is_student_linked_to_parent(p_student_id uuid, p_parent_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM student_parents
    WHERE student_id = p_student_id
    AND parent_id = p_parent_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Schools: Users can only see their own school
CREATE POLICY "Users see own school"
  ON schools FOR SELECT
  TO authenticated
  USING (id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

-- User Profiles: Users can see profiles in their school
CREATE POLICY "Users see own school profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

-- Students: Context-aware access
CREATE POLICY "Students context-aware access"
  ON students FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    AND (
      -- User is admin/staff
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'it_admin'))
      OR
      -- User is teacher and student is in their class
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        JOIN teachers t ON t.id = c.teacher_id
        WHERE e.student_id = students.id
        AND t.user_id = auth.uid()
        AND e.status = 'active'
      )
      OR
      -- User is parent and student is their child
      EXISTS (
        SELECT 1 FROM student_parents sp
        JOIN parents p ON p.id = sp.parent_id
        WHERE sp.student_id = students.id
        AND p.user_id = auth.uid()
      )
      OR
      -- User is the student themselves
      students.user_id = auth.uid()
    )
  );

-- Parents: Context-aware access
CREATE POLICY "Parents context-aware access"
  ON parents FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    AND (
      -- User is admin/staff
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'it_admin'))
      OR
      -- User is the parent themselves
      user_id = auth.uid()
    )
  );

-- Teachers: Users can see teachers in their school
CREATE POLICY "Teachers school access"
  ON teachers FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

-- Courses: Users can see courses in their school
CREATE POLICY "Courses school access"
  ON courses FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

-- Classes: Context-aware access
CREATE POLICY "Classes context-aware access"
  ON classes FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    AND (
      -- User is admin/staff
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'it_admin'))
      OR
      -- User is teacher of this class
      teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
      OR
      -- User is student enrolled in this class
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN students s ON s.id = e.student_id
        WHERE e.class_id = classes.id
        AND s.user_id = auth.uid()
        AND e.status = 'active'
      )
    )
  );

-- Enrollments: Context-aware access
CREATE POLICY "Enrollments context-aware access"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    AND (
      -- User is admin/staff
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'it_admin'))
      OR
      -- User is teacher of the class
      EXISTS (
        SELECT 1 FROM classes c
        JOIN teachers t ON t.id = c.teacher_id
        WHERE c.id = enrollments.class_id
        AND t.user_id = auth.uid()
      )
      OR
      -- User is the enrolled student
      EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = enrollments.student_id
        AND s.user_id = auth.uid()
      )
      OR
      -- User is parent of the enrolled student
      EXISTS (
        SELECT 1 FROM student_parents sp
        JOIN parents p ON p.id = sp.parent_id
        WHERE sp.student_id = enrollments.student_id
        AND p.user_id = auth.uid()
      )
    )
  );

-- Attendance: Context-aware access
CREATE POLICY "Attendance context-aware access"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    AND (
      -- User is admin/staff
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'it_admin'))
      OR
      -- User is teacher of the class
      EXISTS (
        SELECT 1 FROM classes c
        JOIN teachers t ON t.id = c.teacher_id
        WHERE c.id = attendance_records.class_id
        AND t.user_id = auth.uid()
      )
      OR
      -- User is the student
      EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = attendance_records.student_id
        AND s.user_id = auth.uid()
      )
      OR
      -- User is parent of the student
      EXISTS (
        SELECT 1 FROM student_parents sp
        JOIN parents p ON p.id = sp.parent_id
        WHERE sp.student_id = attendance_records.student_id
        AND p.user_id = auth.uid()
      )
    )
  );

-- Notifications: Users can see their own notifications
CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Roles: Users can see roles in their school
CREATE POLICY "Roles school access"
  ON roles FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid()));

-- Capabilities: All authenticated users can see capabilities
CREATE POLICY "Capabilities public read"
  ON capabilities FOR SELECT
  TO authenticated
  USING (true);

-- Role Capabilities: Users can see role capabilities in their school
CREATE POLICY "Role capabilities school access"
  ON role_capabilities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_capabilities.role_id
      AND r.school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- User Roles: Users can see user roles in their school
CREATE POLICY "User roles school access"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = user_roles.user_id
      AND up.school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- Student Parents: Context-aware access
CREATE POLICY "Student parents context-aware access"
  ON student_parents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_parents.student_id
      AND s.school_id IN (SELECT school_id FROM user_profiles WHERE id = auth.uid())
    )
    AND (
      -- User is admin/staff
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type IN ('admin', 'it_admin'))
      OR
      -- User is the parent
      EXISTS (
        SELECT 1 FROM parents p
        WHERE p.id = student_parents.parent_id
        AND p.user_id = auth.uid()
      )
      OR
      -- User is teacher of the student
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        JOIN teachers t ON t.id = c.teacher_id
        WHERE e.student_id = student_parents.student_id
        AND t.user_id = auth.uid()
        AND e.status = 'active'
      )
    )
  );

-- ============================================================================
-- 12. SEED DATA - CAPABILITIES
-- ============================================================================

-- Insert all capabilities
INSERT INTO capabilities (name, resource, action, description) VALUES
  -- User management
  ('user:create', 'user', 'create', 'Create user accounts'),
  ('user:read', 'user', 'read', 'View user profiles'),
  ('user:update', 'user', 'update', 'Update user information'),
  ('user:delete', 'user', 'delete', 'Delete/deactivate users'),
  ('user:list', 'user', 'list', 'List all users'),
  
  -- Role management
  ('role:create', 'role', 'create', 'Create custom roles'),
  ('role:assign', 'role', 'assign', 'Assign roles to users'),
  ('role:manage', 'role', 'manage', 'Full role management'),
  
  -- School management
  ('school:read', 'school', 'read', 'View school information'),
  ('school:update', 'school', 'update', 'Update school profile'),
  ('school:manage', 'school', 'manage', 'Full school administration'),
  
  -- Settings
  ('setting:read', 'setting', 'read', 'View settings'),
  ('setting:update', 'setting', 'update', 'Update settings'),
  
  -- Student management
  ('student:create', 'student', 'create', 'Add new students'),
  ('student:read', 'student', 'read', 'View student details'),
  ('student:update', 'student', 'update', 'Update student information'),
  ('student:delete', 'student', 'delete', 'Remove/archive students'),
  ('student:list', 'student', 'list', 'List all students'),
  ('student:export', 'student', 'export', 'Export student data'),
  
  -- Teacher management
  ('teacher:create', 'teacher', 'create', 'Add new teachers'),
  ('teacher:read', 'teacher', 'read', 'View teacher details'),
  ('teacher:update', 'teacher', 'update', 'Update teacher information'),
  ('teacher:delete', 'teacher', 'delete', 'Remove teachers'),
  ('teacher:list', 'teacher', 'list', 'List all teachers'),
  
  -- Parent management
  ('parent:create', 'parent', 'create', 'Add new parents'),
  ('parent:read', 'parent', 'read', 'View parent details'),
  ('parent:update', 'parent', 'update', 'Update parent information'),
  ('parent:link', 'parent', 'link', 'Link parents to students'),
  
  -- Course management
  ('course:create', 'course', 'create', 'Create courses'),
  ('course:read', 'course', 'read', 'View courses'),
  ('course:update', 'course', 'update', 'Update courses'),
  ('course:delete', 'course', 'delete', 'Delete courses'),
  
  -- Class management
  ('class:create', 'class', 'create', 'Create classes'),
  ('class:read', 'class', 'read', 'View classes'),
  ('class:update', 'class', 'update', 'Update classes'),
  ('class:assign', 'class', 'assign', 'Assign teachers to classes'),
  
  -- Enrollment
  ('enrollment:create', 'enrollment', 'create', 'Enroll students in classes'),
  ('enrollment:manage', 'enrollment', 'manage', 'Manage enrollments'),
  
  -- Attendance
  ('attendance:create', 'attendance', 'create', 'Mark attendance'),
  ('attendance:read', 'attendance', 'read', 'View attendance records'),
  ('attendance:update', 'attendance', 'update', 'Edit attendance records'),
  ('attendance:delete', 'attendance', 'delete', 'Delete attendance records'),
  ('attendance:report', 'attendance', 'report', 'Generate attendance reports'),
  
  -- Communication
  ('notification:send', 'notification', 'send', 'Send notifications'),
  ('notification:read', 'notification', 'read', 'View notifications'),
  ('message:create', 'message', 'create', 'Send messages'),
  ('message:read', 'message', 'read', 'View messages'),
  ('announcement:create', 'announcement', 'create', 'Create announcements'),
  
  -- Administration
  ('audit_log:read', 'audit_log', 'read', 'View audit logs'),
  ('audit_log:export', 'audit_log', 'export', 'Export audit logs'),
  ('integration:manage', 'integration', 'manage', 'Configure integrations'),
  ('system:manage', 'system', 'manage', 'System administration')
ON CONFLICT (name) DO NOTHING;
