# Authorization System Design

## Education CRM - Role & Capability-Based Access Control

---

## 1. Core Principles

### 1.1 Authorization Model

**Hybrid RBAC + CBAC:**
- **Role-Based Access Control (RBAC):** Users are assigned roles
- **Capability-Based Access Control (CBAC):** Roles are composed of granular capabilities
- **Context-Aware:** Permissions consider resource ownership and relationships

**Key Rules:**
1. Every user belongs to exactly one school (multi-tenant)
2. Users can have multiple roles
3. Roles are school-specific (schools can customize)
4. Capabilities are global but assigned per role
5. Permission checks include context (ownership, relationships)
6. No hardcoded role logic in business code

---

## 2. Role Definitions

### 2.1 System Roles

#### 🔴 Super Admin (System-Wide)
**Scope:** Across all schools
**Purpose:** Platform administration

**Responsibilities:**
- Create and manage schools
- Configure system-wide settings
- Monitor platform health
- Manage integrations
- Access all audit logs

**Typical Users:** Platform operators, DevOps

**Context:**
- Not school-scoped
- Full system access
- Cannot be created by schools

---

#### 🟠 School Admin
**Scope:** Single school
**Purpose:** School management and configuration

**Responsibilities:**
- Manage school profile and settings
- Create and assign roles
- Manage all users (teachers, staff, students, parents)
- Configure academic years and terms
- Manage courses and classes
- View all reports and analytics
- Configure integrations (RFID, payments)

**Typical Users:** Principal, Vice Principal, School Director

**Context:**
- Full access within their school
- Cannot access other schools
- Can create custom roles for their school

---

#### 🟢 Teacher
**Scope:** Single school, specific classes
**Purpose:** Teaching and class management

**Responsibilities:**
- View assigned classes and rosters
- Mark attendance for assigned classes
- Record grades for assigned students
- Communicate with students and parents
- View student academic records
- Submit reports

**Typical Users:** Subject teachers, homeroom teachers

**Context:**
- Can only access their assigned classes
- Can view students enrolled in their classes
- Cannot access other teachers' classes

---

#### 🔵 Parent/Guardian
**Scope:** Single school, linked students only
**Purpose:** Monitor child's academic progress

**Responsibilities:**
- View linked children's information
- View attendance records for linked children
- View grades and report cards
- Receive notifications about linked children
- Communicate with teachers
- View and pay invoices for linked children

**Typical Users:** Parents, legal guardians

**Context:**
- Can only access data for their linked children
- Cannot view other students
- Read-only access (except payments)

---

#### 🟣 Student
**Scope:** Single school, own data only
**Purpose:** View own academic information

**Responsibilities:**
- View own profile
- View own attendance
- View own grades
- View own class schedule
- Receive notifications
- View own invoices (optional)

**Typical Users:** Students

**Context:**
- Can only access their own data
- Read-only access
- Cannot view other students' data

---

#### 🟡 IT Administrator
**Scope:** Single school, technical focus
**Purpose:** Technical administration and support

**Responsibilities:**
- Manage user accounts and credentials
- Reset passwords
- Configure integrations
- Manage system settings
- View audit logs
- Technical troubleshooting

**Typical Users:** IT staff, technical support

**Context:**
- Technical access, limited business logic access
- Cannot manage academic or financial data
- Focused on system administration

---

### 2.2 Optional Extended Roles

These can be added by schools as needed:

#### Finance Manager
- Manage invoices and payments
- View financial reports
- Configure fee structures
- No access to academic data

#### Academic Coordinator
- Manage courses and curriculum
- Configure academic calendar
- View academic reports
- No access to financial data

#### Receptionist
- View student information
- Mark attendance (front desk)
- Limited access to records

---

## 3. Capability Definitions

### 3.1 Capability Format

```
<resource>:<action>
```

**Resources:** `user`, `student`, `teacher`, `class`, `course`, `attendance`, `grade`, `notification`, `invoice`, `payment`, `school`, `role`, `setting`, `audit_log`

**Actions:** `create`, `read`, `update`, `delete`, `list`, `export`

**Examples:**
- `student:read` - View student details
- `attendance:create` - Mark attendance
- `invoice:update` - Edit invoices
- `school:manage` - Full school management

---

### 3.2 Capability Categories

#### Authentication & Users
```
user:create          - Create user accounts
user:read            - View user profiles
user:update          - Update user information
user:delete          - Delete/deactivate users
user:list            - List all users
role:create          - Create custom roles
role:assign          - Assign roles to users
role:manage          - Full role management
```

#### School Management
```
school:read          - View school information
school:update        - Update school profile
school:manage        - Full school administration
setting:read         - View settings
setting:update       - Update settings
```

#### Student Management
```
student:create       - Add new students
student:read         - View student details
student:update       - Update student information
student:delete       - Remove/archive students
student:list         - List all students
student:export       - Export student data
```

#### Teacher Management
```
teacher:create       - Add new teachers
teacher:read         - View teacher details
teacher:update       - Update teacher information
teacher:delete       - Remove teachers
teacher:list         - List all teachers
```

#### Parent Management
```
parent:create        - Add new parents
parent:read          - View parent details
parent:update        - Update parent information
parent:link          - Link parents to students
```

#### Academic Structure
```
course:create        - Create courses
course:read          - View courses
course:update        - Update courses
course:delete        - Delete courses
class:create         - Create classes
class:read           - View classes
class:update         - Update classes
class:assign         - Assign teachers to classes
enrollment:create    - Enroll students in classes
enrollment:manage    - Manage enrollments
```

#### Attendance
```
attendance:create    - Mark attendance
attendance:read      - View attendance records
attendance:update    - Edit attendance records
attendance:delete    - Delete attendance records
attendance:report    - Generate attendance reports
```

#### Grades (Future)
```
grade:create         - Record grades
grade:read           - View grades
grade:update         - Update grades
grade:report         - Generate report cards
```

#### Communication
```
notification:send    - Send notifications
notification:read    - View notifications
message:create       - Send messages
message:read         - View messages
announcement:create  - Create announcements
```

#### Finance (Future)
```
invoice:create       - Create invoices
invoice:read         - View invoices
invoice:update       - Update invoices
invoice:delete       - Delete invoices
payment:record       - Record payments
payment:read         - View payment records
finance:report       - Generate financial reports
```

#### Administration
```
audit_log:read       - View audit logs
audit_log:export     - Export audit logs
integration:manage   - Configure integrations
system:manage        - System administration
```

---

## 4. Capability Matrix

### 4.1 Full Permission Matrix

| Capability | Super Admin | School Admin | Teacher | Parent | Student | IT Admin |
|------------|-------------|--------------|---------|--------|---------|----------|
| **Users & Auth** |
| user:create | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| user:read | ✅ | ✅ | 📝 Own | 📝 Own | 📝 Own | ✅ |
| user:update | ✅ | ✅ | 📝 Own | 📝 Own | 📝 Own | ✅ |
| user:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| user:list | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| role:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| role:assign | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **School** |
| school:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| school:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| school:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| setting:read | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| setting:update | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Students** |
| student:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| student:read | ✅ | ✅ | 📝 Class | 📝 Children | 📝 Own | ✅ |
| student:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| student:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| student:list | ✅ | ✅ | 📝 Class | 📝 Children | ❌ | ✅ |
| student:export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Teachers** |
| teacher:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| teacher:read | ✅ | ✅ | 📝 Own | ❌ | ❌ | ✅ |
| teacher:update | ✅ | ✅ | 📝 Own | ❌ | ❌ | ❌ |
| teacher:list | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Parents** |
| parent:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| parent:read | ✅ | ✅ | 📝 Class | 📝 Own | ❌ | ✅ |
| parent:link | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Courses & Classes** |
| course:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| course:read | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| course:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| class:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| class:read | ✅ | ✅ | 📝 Assigned | ❌ | 📝 Enrolled | ✅ |
| class:assign | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| enrollment:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| enrollment:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Attendance** |
| attendance:create | ✅ | ✅ | 📝 Assigned | ❌ | ❌ | ❌ |
| attendance:read | ✅ | ✅ | 📝 Assigned | 📝 Children | 📝 Own | ✅ |
| attendance:update | ✅ | ✅ | 📝 Assigned | ❌ | ❌ | ❌ |
| attendance:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| attendance:report | ✅ | ✅ | 📝 Assigned | 📝 Children | 📝 Own | ❌ |
| **Grades** |
| grade:create | ✅ | ✅ | 📝 Assigned | ❌ | ❌ | ❌ |
| grade:read | ✅ | ✅ | 📝 Assigned | 📝 Children | 📝 Own | ❌ |
| grade:update | ✅ | ✅ | 📝 Assigned | ❌ | ❌ | ❌ |
| grade:report | ✅ | ✅ | 📝 Assigned | 📝 Children | 📝 Own | ❌ |
| **Communication** |
| notification:send | ✅ | ✅ | 📝 Class | ❌ | ❌ | ❌ |
| notification:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| message:create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| message:read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| announcement:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Finance** |
| invoice:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| invoice:read | ✅ | ✅ | ❌ | 📝 Children | 📝 Own | ❌ |
| invoice:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| payment:record | ✅ | ✅ | ❌ | 📝 Children | ❌ | ❌ |
| payment:read | ✅ | ✅ | ❌ | 📝 Children | 📝 Own | ❌ |
| finance:report | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Administration** |
| audit_log:read | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| audit_log:export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| integration:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| system:manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full access
- ❌ No access
- 📝 Context-specific (see Context Rules below)

---

## 5. Context-Specific Authorization

### 5.1 Context Rules

#### Teacher Context
**Rule:** Teachers can only access resources related to their assigned classes

```typescript
// Can teacher mark attendance for this class?
function canMarkAttendance(teacher: Teacher, class: Class): boolean {
  return class.teacher_id === teacher.id;
}

// Can teacher view this student?
function canViewStudent(teacher: Teacher, student: Student): boolean {
  // Check if student is enrolled in any of teacher's classes
  const teacherClassIds = getTeacherClassIds(teacher.id);
  const studentEnrollments = getStudentEnrollments(student.id);

  return studentEnrollments.some(enrollment =>
    teacherClassIds.includes(enrollment.class_id)
  );
}
```

#### Parent Context
**Rule:** Parents can only access resources for their linked children

```typescript
// Can parent view this student?
function canViewStudent(parent: Parent, student: Student): boolean {
  const linkedStudentIds = getParentChildren(parent.id);
  return linkedStudentIds.includes(student.id);
}

// Can parent view this attendance record?
function canViewAttendance(parent: Parent, attendance: AttendanceRecord): boolean {
  const linkedStudentIds = getParentChildren(parent.id);
  return linkedStudentIds.includes(attendance.student_id);
}

// Can parent pay this invoice?
function canPayInvoice(parent: Parent, invoice: Invoice): boolean {
  const linkedStudentIds = getParentChildren(parent.id);
  return linkedStudentIds.includes(invoice.student_id);
}
```

#### Student Context
**Rule:** Students can only access their own resources

```typescript
// Can student view this attendance?
function canViewAttendance(student: Student, attendance: AttendanceRecord): boolean {
  return attendance.student_id === student.id;
}

// Can student view this grade?
function canViewGrade(student: Student, grade: Grade): boolean {
  return grade.student_id === student.id;
}
```

#### Multi-Tenant Context
**Rule:** All users can only access resources within their school

```typescript
// Multi-tenant check (applied to ALL queries)
function hasSchoolAccess(user: User, resource: any): boolean {
  return user.school_id === resource.school_id;
}
```

---

## 6. Permission Check Implementation

### 6.1 Basic Permission Check

```typescript
interface PermissionCheck {
  user: User;
  capability: string;
  resource?: any;
  context?: Record<string, any>;
}

async function hasPermission(check: PermissionCheck): Promise<boolean> {
  const { user, capability, resource, context } = check;

  // Step 1: Get user's capabilities
  const userCapabilities = await getUserCapabilities(user.id);

  // Step 2: Check if user has the capability
  if (!userCapabilities.includes(capability)) {
    return false;
  }

  // Step 3: Multi-tenant check
  if (resource && resource.school_id) {
    if (user.school_id !== resource.school_id) {
      return false;
    }
  }

  // Step 4: Context-specific checks
  if (resource && context) {
    return checkContextualPermission(user, capability, resource, context);
  }

  return true;
}

async function getUserCapabilities(userId: string): Promise<string[]> {
  // Get user's roles
  const userRoles = await db.query(`
    SELECT r.* FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = $1
  `, [userId]);

  // Get capabilities for those roles
  const capabilities = await db.query(`
    SELECT DISTINCT c.name FROM capabilities c
    JOIN role_capabilities rc ON rc.capability_id = c.id
    WHERE rc.role_id = ANY($1)
  `, [userRoles.map(r => r.id)]);

  return capabilities.map(c => c.name);
}
```

---

### 6.2 Context-Specific Permission Check

```typescript
function checkContextualPermission(
  user: User,
  capability: string,
  resource: any,
  context: Record<string, any>
): boolean {
  const [resourceType, action] = capability.split(':');

  // Teacher context checks
  if (user.user_type === 'teacher') {
    switch (resourceType) {
      case 'student':
        return isStudentInTeacherClasses(user.id, resource.id);

      case 'attendance':
        return isTeacherAssignedToClass(user.id, resource.class_id);

      case 'grade':
        return isTeacherAssignedToClass(user.id, resource.class_id);

      case 'class':
        return resource.teacher_id === user.id;
    }
  }

  // Parent context checks
  if (user.user_type === 'parent') {
    const parentId = context.parentId;

    switch (resourceType) {
      case 'student':
        return isStudentLinkedToParent(resource.id, parentId);

      case 'attendance':
        return isStudentLinkedToParent(resource.student_id, parentId);

      case 'grade':
        return isStudentLinkedToParent(resource.student_id, parentId);

      case 'invoice':
        return isStudentLinkedToParent(resource.student_id, parentId);
    }
  }

  // Student context checks
  if (user.user_type === 'student') {
    const studentId = context.studentId;

    switch (resourceType) {
      case 'student':
        return resource.id === studentId;

      case 'attendance':
        return resource.student_id === studentId;

      case 'grade':
        return resource.student_id === studentId;

      case 'invoice':
        return resource.student_id === studentId;
    }
  }

  return true;
}

// Helper functions
async function isStudentInTeacherClasses(teacherId: string, studentId: string): Promise<boolean> {
  const result = await db.query(`
    SELECT 1 FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE c.teacher_id = $1 AND e.student_id = $2
    LIMIT 1
  `, [teacherId, studentId]);

  return result.length > 0;
}

async function isTeacherAssignedToClass(teacherId: string, classId: string): Promise<boolean> {
  const result = await db.query(`
    SELECT 1 FROM classes
    WHERE id = $1 AND teacher_id = $2
    LIMIT 1
  `, [classId, teacherId]);

  return result.length > 0;
}

async function isStudentLinkedToParent(studentId: string, parentId: string): Promise<boolean> {
  const result = await db.query(`
    SELECT 1 FROM student_parents
    WHERE student_id = $1 AND parent_id = $2
    LIMIT 1
  `, [studentId, parentId]);

  return result.length > 0;
}
```

---

### 6.3 API Middleware

```typescript
// Express middleware for permission checking
function requirePermission(capability: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // From JWT middleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasAccess = await hasPermission({
      user,
      capability,
      resource: req.body || req.params,
      context: { ...req.params, ...req.query }
    });

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You do not have permission to perform this action`
      });
    }

    next();
  };
}

// Usage in routes
app.post('/api/schools/:school_id/attendance/mark',
  authenticateJWT,
  requirePermission('attendance:create'),
  markAttendanceHandler
);

app.get('/api/schools/:school_id/students/:id',
  authenticateJWT,
  requirePermission('student:read'),
  getStudentHandler
);
```

---

## 7. Example Permission Scenarios

### 7.1 Scenario: Teacher Marks Attendance

**Setup:**
- Teacher: John (teacher_id: "T001")
- Class: Math 10A (class_id: "C001", teacher_id: "T001")
- Student: Alice (student_id: "S001", enrolled in "C001")

**Request:**
```typescript
POST /api/schools/SCH001/attendance/mark
{
  class_id: "C001",
  date: "2024-01-15",
  records: [
    { student_id: "S001", status: "present" }
  ]
}
```

**Permission Check:**
```typescript
// Step 1: Check capability
hasCapability(John, "attendance:create") // ✅ TRUE (Teacher has this)

// Step 2: Check multi-tenant
John.school_id === "SCH001" // ✅ TRUE

// Step 3: Check context (is this teacher assigned to this class?)
Class["C001"].teacher_id === "T001" // ✅ TRUE

// Step 4: Check student enrollment
Student["S001"].enrollments.includes("C001") // ✅ TRUE

// Result: ✅ ALLOWED
```

---

### 7.2 Scenario: Parent Views Child's Attendance

**Setup:**
- Parent: Mary (parent_id: "P001", user_id: "U002")
- Student: Alice (student_id: "S001")
- Link: Mary is linked to Alice
- Attendance: Alice's record for 2024-01-15

**Request:**
```typescript
GET /api/schools/SCH001/attendance/student/S001?from=2024-01-01&to=2024-01-31
```

**Permission Check:**
```typescript
// Step 1: Check capability
hasCapability(Mary, "attendance:read") // ✅ TRUE (Parent has this)

// Step 2: Check multi-tenant
Mary.school_id === "SCH001" // ✅ TRUE

// Step 3: Check context (is this parent linked to this student?)
isStudentLinkedToParent("S001", "P001") // ✅ TRUE

// Result: ✅ ALLOWED
```

---

### 7.3 Scenario: Parent Tries to View Another Child

**Setup:**
- Parent: Mary (parent_id: "P001")
- Student: Bob (student_id: "S002")
- Link: Mary is NOT linked to Bob

**Request:**
```typescript
GET /api/schools/SCH001/students/S002
```

**Permission Check:**
```typescript
// Step 1: Check capability
hasCapability(Mary, "student:read") // ✅ TRUE (Parent has this)

// Step 2: Check multi-tenant
Mary.school_id === "SCH001" // ✅ TRUE

// Step 3: Check context (is this parent linked to this student?)
isStudentLinkedToParent("S002", "P001") // ❌ FALSE

// Result: ❌ DENIED (403 Forbidden)
```

---

### 7.4 Scenario: Teacher Tries to Delete Student

**Setup:**
- Teacher: John (teacher_id: "T001")
- Student: Alice (student_id: "S001")

**Request:**
```typescript
DELETE /api/schools/SCH001/students/S001
```

**Permission Check:**
```typescript
// Step 1: Check capability
hasCapability(John, "student:delete") // ❌ FALSE (Teacher doesn't have this)

// Result: ❌ DENIED (403 Forbidden)
```

---

### 7.5 Scenario: Student Views Own Attendance

**Setup:**
- Student: Alice (student_id: "S001", user_id: "U003")

**Request:**
```typescript
GET /api/schools/SCH001/attendance/student/S001
```

**Permission Check:**
```typescript
// Step 1: Check capability
hasCapability(Alice, "attendance:read") // ✅ TRUE (Student has this)

// Step 2: Check multi-tenant
Alice.school_id === "SCH001" // ✅ TRUE

// Step 3: Check context (is this the student's own data?)
request.student_id === Alice.student_id // ✅ TRUE ("S001" === "S001")

// Result: ✅ ALLOWED
```

---

### 7.6 Scenario: School Admin Creates New Role

**Setup:**
- Admin: Jane (role: School Admin)

**Request:**
```typescript
POST /api/schools/SCH001/roles
{
  name: "Finance Manager",
  description: "Manages school finances"
}
```

**Permission Check:**
```typescript
// Step 1: Check capability
hasCapability(Jane, "role:create") // ✅ TRUE (School Admin has this)

// Step 2: Check multi-tenant
Jane.school_id === "SCH001" // ✅ TRUE

// Result: ✅ ALLOWED
```

---

## 8. Row-Level Security (RLS) Implementation

### 8.1 RLS Policies for Multi-Tenant Isolation

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data from their school
CREATE POLICY "Users see own school data"
  ON students
  FOR SELECT
  TO authenticated
  USING (school_id = (auth.jwt()->>'school_id')::uuid);

-- Policy: Only admins can insert students
CREATE POLICY "Admins can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id = (auth.jwt()->>'school_id')::uuid
    AND EXISTS (
      SELECT 1 FROM user_has_capability(auth.uid(), 'student:create')
    )
  );
```

---

### 8.2 RLS for Context-Specific Access

```sql
-- Teacher can only see students in their classes
CREATE POLICY "Teachers see their students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    school_id = (auth.jwt()->>'school_id')::uuid
    AND (
      -- User is admin (sees all)
      user_has_capability(auth.uid(), 'student:list')
      OR
      -- User is teacher and student is in their class
      EXISTS (
        SELECT 1 FROM enrollments e
        JOIN classes c ON c.id = e.class_id
        JOIN teachers t ON t.id = c.teacher_id
        WHERE e.student_id = students.id
        AND t.user_id = auth.uid()
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

-- Teacher can only mark attendance for their classes
CREATE POLICY "Teachers mark attendance for their classes"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id = (auth.jwt()->>'school_id')::uuid
    AND user_has_capability(auth.uid(), 'attendance:create')
    AND EXISTS (
      SELECT 1 FROM classes c
      JOIN teachers t ON t.id = c.teacher_id
      WHERE c.id = attendance_records.class_id
      AND t.user_id = auth.uid()
    )
  );
```

---

## 9. Role Creation Examples

### 9.1 Creating Default Roles

```sql
-- School Admin Role
INSERT INTO roles (school_id, name, description, is_system_role)
VALUES ('SCH001', 'School Admin', 'Full school administration', true);

-- Assign capabilities to School Admin
INSERT INTO role_capabilities (role_id, capability_id)
SELECT
  (SELECT id FROM roles WHERE name = 'School Admin' AND school_id = 'SCH001'),
  id
FROM capabilities
WHERE name IN (
  'user:create', 'user:read', 'user:update', 'user:delete', 'user:list',
  'student:create', 'student:read', 'student:update', 'student:delete', 'student:list',
  'teacher:create', 'teacher:read', 'teacher:update', 'teacher:list',
  'class:create', 'class:read', 'class:assign',
  'attendance:create', 'attendance:read', 'attendance:update', 'attendance:report',
  'notification:send', 'announcement:create',
  'role:create', 'role:assign',
  'school:update', 'setting:update'
);

-- Teacher Role
INSERT INTO roles (school_id, name, description, is_system_role)
VALUES ('SCH001', 'Teacher', 'Teaching staff', true);

INSERT INTO role_capabilities (role_id, capability_id)
SELECT
  (SELECT id FROM roles WHERE name = 'Teacher' AND school_id = 'SCH001'),
  id
FROM capabilities
WHERE name IN (
  'student:read', 'teacher:read',
  'class:read', 'attendance:create', 'attendance:read', 'attendance:update',
  'notification:send', 'message:create', 'message:read'
);

-- Parent Role
INSERT INTO roles (school_id, name, description, is_system_role)
VALUES ('SCH001', 'Parent', 'Parent/Guardian', true);

INSERT INTO role_capabilities (role_id, capability_id)
SELECT
  (SELECT id FROM roles WHERE name = 'Parent' AND school_id = 'SCH001'),
  id
FROM capabilities
WHERE name IN (
  'student:read', 'attendance:read', 'grade:read',
  'notification:read', 'message:create', 'message:read',
  'invoice:read', 'payment:record'
);
```

---

### 9.2 Creating Custom Role

```typescript
// School creates custom "Finance Manager" role
async function createCustomRole(schoolId: string, adminUserId: string) {
  // 1. Check admin has permission
  const hasPermission = await checkPermission(adminUserId, 'role:create');
  if (!hasPermission) throw new Error('Forbidden');

  // 2. Create role
  const role = await db.query(`
    INSERT INTO roles (school_id, name, description, is_system_role)
    VALUES ($1, $2, $3, false)
    RETURNING *
  `, [schoolId, 'Finance Manager', 'Manages school finances']);

  // 3. Assign capabilities
  const capabilities = [
    'invoice:create', 'invoice:read', 'invoice:update',
    'payment:record', 'payment:read', 'finance:report'
  ];

  for (const cap of capabilities) {
    await db.query(`
      INSERT INTO role_capabilities (role_id, capability_id)
      SELECT $1, id FROM capabilities WHERE name = $2
    `, [role.id, cap]);
  }

  return role;
}
```

---

## 10. Summary

### Key Takeaways

1. **Hybrid Model:** RBAC for role assignment + CBAC for granular permissions
2. **Context-Aware:** Permissions consider relationships (teacher-class, parent-student)
3. **Multi-Tenant:** All checks enforce school_id isolation
4. **No Hardcoding:** Roles and capabilities are data, not code
5. **Flexible:** Schools can create custom roles with specific capabilities
6. **Database-Enforced:** RLS policies provide defense in depth

### Permission Check Flow

```
1. Authenticate user (JWT)
   ↓
2. Extract user roles
   ↓
3. Get role capabilities
   ↓
4. Check if user has required capability
   ↓
5. Verify multi-tenant (school_id matches)
   ↓
6. Check context (teacher owns class, parent owns student)
   ↓
7. Allow or deny access
```

### Best Practices

1. Always check permissions at API layer
2. Enforce multi-tenant isolation in all queries
3. Use RLS as secondary defense
4. Log all authorization failures
5. Cache user capabilities for performance
6. Invalidate cache on role changes
7. Use descriptive capability names
8. Document custom roles per school

---

Ready to implement the database schema with this authorization model?
