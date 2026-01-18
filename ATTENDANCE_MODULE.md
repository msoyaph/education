# Attendance Module Documentation

## Overview

The Attendance Module provides a comprehensive system for tracking student attendance in classes with role-based access control, one-click marking, and real-time summaries.

---

## Features

### ✅ Core Features
- **One-Click Attendance**: Quick status marking with visual feedback
- **Bulk Operations**: Mark all students at once
- **Real-Time Summary**: Live attendance statistics
- **Historical Records**: View past attendance with filtering
- **Role-Based Access**:
  - Teachers: Mark and update attendance
  - Students: Read-only view of own attendance
  - Parents: Read-only view of children's attendance
  - Admins: Full access to all attendance data

### 📊 Status Types
- **Present**: Student attended class on time
- **Absent**: Student did not attend
- **Late**: Student arrived late
- **Excused**: Approved absence

---

## API Endpoints

### Base URL
```
{SUPABASE_URL}/functions/v1/attendance
```

### Authentication
All endpoints require authentication via Bearer token:
```
Authorization: Bearer {access_token}
```

---

### 1. Get Class Attendance (Teacher View)

**Endpoint**: `GET /class/{class_id}/{date}`

**Purpose**: Retrieve attendance for all students in a class on a specific date

**Parameters**:
- `class_id` (path): UUID of the class
- `date` (path, optional): Date in YYYY-MM-DD format (defaults to today)

**Authorization**:
- Teacher must be assigned to the class
- School admins have access to all classes

**Response**:
```json
{
  "data": [
    {
      "student_id": "uuid",
      "student_code": "2024001",
      "student_name": "John Doe",
      "student_photo": "url",
      "attendance_id": "uuid",
      "status": "present",
      "check_in_time": "09:15:00",
      "notes": "Optional notes",
      "marked_at": "2024-01-18T09:15:00Z"
    }
  ]
}
```

**Use Cases**:
- Teacher loads attendance sheet for today
- Teacher reviews past attendance records
- Admin audits class attendance

---

### 2. Get Student Attendance (Student/Parent View)

**Endpoint**: `GET /student/{student_id}?start_date={date}&end_date={date}`

**Purpose**: Retrieve attendance history for a specific student

**Parameters**:
- `student_id` (path): UUID of the student
- `start_date` (query, optional): Filter start date
- `end_date` (query, optional): Filter end date

**Authorization**:
- Student can view their own attendance
- Parents can view their children's attendance
- Teachers can view students in their classes
- Admins can view all students

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "class_id": "uuid",
      "student_id": "uuid",
      "attendance_date": "2024-01-18",
      "status": "present",
      "check_in_time": "09:15:00",
      "notes": null,
      "marked_at": "2024-01-18T09:15:00Z",
      "classes": {
        "name": "Mathematics 101",
        "code": "MATH101"
      }
    }
  ],
  "summary": {
    "present": 45,
    "absent": 3,
    "late": 2,
    "excused": 0,
    "total": 50
  }
}
```

**Use Cases**:
- Student checks their attendance rate
- Parent monitors child's attendance
- Counselor reviews attendance patterns

---

### 3. Mark Attendance (Single or Bulk)

**Endpoint**: `POST /`

**Purpose**: Mark attendance for one or multiple students

**Authorization**: Teachers only (or admins)

**Request Body (Single)**:
```json
{
  "class_id": "uuid",
  "student_id": "uuid",
  "attendance_date": "2024-01-18",
  "status": "present",
  "check_in_time": "09:15:00",
  "notes": "Optional notes"
}
```

**Request Body (Bulk)**:
```json
[
  {
    "class_id": "uuid",
    "student_id": "uuid",
    "attendance_date": "2024-01-18",
    "status": "present"
  },
  {
    "class_id": "uuid",
    "student_id": "uuid",
    "attendance_date": "2024-01-18",
    "status": "absent"
  }
]
```

**Response**:
```json
{
  "data": [...],
  "message": "Attendance marked successfully"
}
```

**Behavior**:
- Uses UPSERT: If attendance exists, it updates; otherwise, inserts
- Automatically records `marked_by` and `marked_at`
- Validates teacher has permission for the class

**Use Cases**:
- Teacher marks attendance at class start
- Teacher does quick "mark all present"
- Teacher corrects previous attendance

---

### 4. Update Attendance

**Endpoint**: `PUT /{attendance_id}`

**Purpose**: Update an existing attendance record

**Authorization**: Teachers only (or admins)

**Request Body**:
```json
{
  "status": "late",
  "check_in_time": "09:30:00",
  "notes": "Student arrived during second period"
}
```

**Response**:
```json
{
  "data": {...},
  "message": "Attendance updated successfully"
}
```

**Validation**:
- Can only update records for classes the teacher manages
- Must provide valid status value
- Updates `marked_at` timestamp automatically

**Use Cases**:
- Teacher corrects status (Present → Late)
- Teacher adds notes for absent student
- Admin makes correction for teacher

---

### 5. Delete Attendance

**Endpoint**: `DELETE /{attendance_id}`

**Purpose**: Remove an attendance record

**Authorization**: Teachers only (or admins)

**Response**:
```json
{
  "message": "Attendance deleted successfully"
}
```

**Use Cases**:
- Correct duplicate entries
- Remove attendance marked on wrong date
- Admin cleanup

---

## Data Validation Rules

### Field Validations

#### Required Fields (POST)
- `class_id`: Must be valid UUID, class must exist
- `student_id`: Must be valid UUID, student must exist and be enrolled
- `attendance_date`: Must be valid date in YYYY-MM-DD format
- `status`: Must be one of: `present`, `absent`, `late`, `excused`

#### Optional Fields
- `check_in_time`: HH:MM:SS format, typically for present/late
- `notes`: Free text, max recommended 500 chars

#### Business Rules
1. **Date Constraints**:
   - Cannot mark attendance for future dates
   - Can mark/update attendance for past dates (corrections)

2. **Enrollment Validation**:
   - Student must be actively enrolled in the class
   - Enrollment status must be 'active'

3. **Teacher Authorization**:
   - Teacher must be assigned to the class
   - One teacher can have multiple classes
   - Admins bypass this check

4. **Duplicate Prevention**:
   - Only one attendance record per student per class per date
   - UNIQUE constraint: (class_id, student_id, attendance_date)
   - UPSERT handles duplicates by updating existing record

---

## State Transitions

### Valid Status Transitions

```
┌─────────────────────────────────────────────────┐
│            Attendance Lifecycle                  │
└─────────────────────────────────────────────────┘

Initial State: null (unmarked)
    │
    ├──► present ──┐
    ├──► absent ───┤
    ├──► late ─────┤
    └──► excused ──┘
         │
         └──► Any status (via UPDATE)
```

### State Descriptions

#### null (unmarked)
- **Description**: No attendance recorded
- **Can transition to**: Any status
- **Use case**: Before teacher marks attendance

#### present
- **Description**: Student attended on time
- **Can transition to**: late (if correction needed), absent, excused
- **Typically includes**: check_in_time
- **Use case**: Normal attendance

#### absent
- **Description**: Student did not attend
- **Can transition to**: present, late, excused
- **Use case**: Student not in class

#### late
- **Description**: Student arrived after class started
- **Can transition to**: present, absent, excused
- **Typically includes**: check_in_time (late arrival time)
- **Use case**: Tardy student

#### excused
- **Description**: Approved absence
- **Can transition to**: Any status
- **Use case**: Medical leave, school events, approved absence

### Correction Workflow

```
Day 1: Teacher marks John as "absent"
Day 2: Teacher realizes John was actually present
Action: Teacher updates status from "absent" to "present"
Result:
  - Status changes to "present"
  - marked_by updated to teacher's ID
  - marked_at updated to current timestamp
  - Original created_at preserved
```

---

## Edge Cases & Handling

### 1. Late Attendance Marking

**Scenario**: Teacher forgets to mark attendance on Monday, marks it on Tuesday

**Handling**:
- System allows marking past dates
- No date restrictions (except future dates)
- marked_at shows when it was actually marked
- attendance_date shows the class date

**Implementation**:
```typescript
// Teacher can specify any past date
{
  "attendance_date": "2024-01-15",  // Last Monday
  "marked_at": "2024-01-18T10:30:00Z"  // Today
}
```

---

### 2. Bulk Marking with Mixed Results

**Scenario**: Teacher marks 30 students, but 2 fail validation

**Handling**:
- Current: Entire batch fails (atomic operation)
- Response includes error details
- Teacher must fix issues and resubmit

**Future Enhancement**:
- Partial success with detailed report
- Skip invalid records, process valid ones

---

### 3. Student Arrives After Marked Absent

**Scenario**:
1. Teacher marks student absent at 9:00 AM
2. Student arrives at 9:15 AM

**Handling**:
- Teacher updates record from "absent" to "late"
- Check-in time recorded as 9:15 AM
- marked_at updated to show correction time

**UI Flow**:
```
1. Teacher clicks student's status
2. Changes from "absent" to "late"
3. System auto-fills check_in_time with current time
4. Teacher clicks "Save Attendance"
```

---

### 4. Multiple Teachers for Same Class

**Scenario**: Substitute teacher needs to mark attendance

**Handling**:
- Current: Only assigned teacher can mark
- Workaround: Admin updates teacher_id temporarily
- Future: Support for substitute teachers

**Database**:
```sql
-- Each class has one teacher_id
classes.teacher_id = primary_teacher_uuid

-- Future enhancement
class_teachers (class_id, teacher_id, role, start_date, end_date)
```

---

### 5. Student Unenrolled Mid-Semester

**Scenario**: Student drops class on Jan 15, but attendance exists before

**Handling**:
- Historical attendance preserved
- Cannot mark new attendance (enrollment check fails)
- Student's past records remain accessible

**Query Behavior**:
```sql
-- Only active enrollments shown for marking
WHERE enrollment.status = 'active'

-- But historical data includes all
SELECT * FROM attendance_records WHERE student_id = ?
```

---

### 6. Concurrent Updates

**Scenario**: Two teachers/admins update same attendance simultaneously

**Handling**:
- Database UPSERT ensures last-write-wins
- marked_at shows who updated last
- No data loss (updates overwrite)

**Best Practice**:
- UI shows last update time
- Warn if record recently modified
- Future: Optimistic locking

---

### 7. Date Validation Edge Cases

#### Future Dates
```typescript
// ❌ Not allowed
attendance_date: "2025-12-31"
Error: "Cannot mark attendance for future dates"
```

#### Very Old Dates
```typescript
// ✅ Allowed but unusual
attendance_date: "2020-01-01"
Warning: "Marking attendance for date more than 1 year ago"
```

#### Invalid Dates
```typescript
// ❌ Not allowed
attendance_date: "2024-02-30"
Error: "Invalid date format"
```

---

### 8. Check-in Time Logic

**Present Status**:
```typescript
{
  status: "present",
  check_in_time: "09:00:00"  // On time
}
```

**Late Status**:
```typescript
{
  status: "late",
  check_in_time: "09:30:00"  // 30 minutes late
}
```

**Absent Status**:
```typescript
{
  status: "absent",
  check_in_time: null  // No check-in
}
```

**Auto-fill Behavior**:
- UI auto-fills current time for present/late
- Teacher can override if needed
- Absent/excused typically don't have check-in time

---

### 9. Parent-Child Relationship Changes

**Scenario**: Parent divorced, custody changed, should no longer see attendance

**Handling**:
- Remove link in student_parents table
- Parent loses access immediately (RLS enforced)
- Historical data doesn't change, just access

**Security**:
```sql
-- RLS policy checks real-time relationship
EXISTS (
  SELECT 1 FROM student_parents sp
  WHERE sp.student_id = students.id
  AND sp.parent_id = parents.id
  AND parents.user_id = auth.uid()
)
```

---

### 10. Teacher View After Reassignment

**Scenario**: Teacher A marked attendance, then Teacher B assigned to class

**Handling**:
- Teacher B can now mark/update attendance
- Teacher A loses access
- marked_by shows Teacher A for old records
- Teacher B for new records

**Audit Trail**:
```sql
SELECT
  ar.*,
  up.first_name || ' ' || up.last_name as marked_by_name
FROM attendance_records ar
JOIN user_profiles up ON up.id = ar.marked_by
WHERE ar.class_id = ?
ORDER BY ar.attendance_date DESC, ar.marked_at DESC
```

---

## Error Handling

### Client-Side Validation

```typescript
// Before API call
function validateAttendance(record) {
  if (!record.class_id) throw new Error('Class ID required');
  if (!record.student_id) throw new Error('Student ID required');
  if (!record.attendance_date) throw new Error('Date required');
  if (!['present', 'absent', 'late', 'excused'].includes(record.status)) {
    throw new Error('Invalid status');
  }

  const date = new Date(record.attendance_date);
  if (date > new Date()) {
    throw new Error('Cannot mark future attendance');
  }
}
```

### Server-Side Validation

```typescript
// Edge function validates
- Authentication
- Authorization (teacher/admin)
- Required fields
- Valid status values
- Enrollment status
- Class assignment
```

### Database Constraints

```sql
-- Enforced at DB level
CHECK (status IN ('present', 'absent', 'late', 'excused'))
UNIQUE (class_id, student_id, attendance_date)
FOREIGN KEY constraints
NOT NULL constraints
```

### Error Response Format

```json
{
  "error": "Unauthorized: Not the teacher of this class"
}
```

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Unauthorized | 401 | Not authenticated | Login required |
| Forbidden | 403 | Not teacher of class | Check class assignment |
| Not Found | 404 | Invalid ID | Verify class/student exists |
| Bad Request | 400 | Invalid data | Check required fields |
| Conflict | 409 | Duplicate entry | Use update instead |

---

## Security Considerations

### Row Level Security (RLS)

All attendance queries are filtered by RLS policies:

```sql
-- Teachers see only their class attendance
EXISTS (
  SELECT 1 FROM classes c
  JOIN teachers t ON t.id = c.teacher_id
  WHERE c.id = attendance_records.class_id
  AND t.user_id = auth.uid()
)

-- Students see only their own
EXISTS (
  SELECT 1 FROM students s
  WHERE s.id = attendance_records.student_id
  AND s.user_id = auth.uid()
)

-- Parents see only their children's
EXISTS (
  SELECT 1 FROM student_parents sp
  JOIN parents p ON p.id = sp.parent_id
  WHERE sp.student_id = attendance_records.student_id
  AND p.user_id = auth.uid()
)
```

### Multi-Tenant Isolation

Every query includes school_id filter:
```sql
WHERE school_id = (
  SELECT school_id FROM user_profiles
  WHERE id = auth.uid()
)
```

### Audit Trail

All changes tracked:
- `marked_by`: Who made the change
- `marked_at`: When change was made
- `created_at`: Original record creation
- `updated_at`: Last modification

---

## Performance Optimizations

### Indexes

```sql
-- Fast class attendance lookup
idx_attendance_class_date ON (class_id, attendance_date DESC)

-- Fast student history lookup
idx_attendance_student_date ON (student_id, attendance_date DESC)

-- Fast school-wide queries
idx_attendance_date ON (school_id, attendance_date DESC)
```

### Query Optimization

```typescript
// ✅ Efficient: Single query with joins
SELECT ar.*, s.first_name, s.last_name
FROM attendance_records ar
JOIN students s ON s.id = ar.student_id
WHERE ar.class_id = ?

// ❌ Inefficient: Multiple queries
const records = await getAttendance(classId);
for (const record of records) {
  const student = await getStudent(record.student_id); // N+1 problem
}
```

### Caching Strategy

```typescript
// Cache class roster (rarely changes)
const roster = await getCachedClassRoster(classId);

// Fresh attendance data (changes frequently)
const attendance = await getAttendance(classId, date);

// Merge in memory
const combined = roster.map(student => ({
  ...student,
  attendance: attendance.find(a => a.student_id === student.id)
}));
```

---

## Testing Scenarios

### Unit Tests

```typescript
describe('Attendance API', () => {
  test('marks single attendance', async () => {
    const result = await markAttendance({
      class_id: 'uuid',
      student_id: 'uuid',
      attendance_date: '2024-01-18',
      status: 'present'
    });
    expect(result).toBeDefined();
  });

  test('rejects future dates', async () => {
    await expect(
      markAttendance({
        attendance_date: '2025-12-31',
        status: 'present'
      })
    ).rejects.toThrow();
  });

  test('prevents unauthorized access', async () => {
    // Login as parent
    // Try to mark attendance
    // Expect 403 error
  });
});
```

### Integration Tests

```typescript
describe('Attendance Workflow', () => {
  test('teacher marks and updates attendance', async () => {
    // 1. Teacher logs in
    // 2. Loads class roster
    // 3. Marks all present
    // 4. Updates one to late
    // 5. Verifies changes
  });

  test('student views own attendance', async () => {
    // 1. Student logs in
    // 2. Views attendance history
    // 3. Sees correct summary
  });
});
```

---

## Future Enhancements

### Planned Features

1. **Automated Notifications**
   - Parent notification when child marked absent
   - Weekly attendance summary emails
   - Threshold alerts (e.g., >3 absences)

2. **Advanced Reporting**
   - Export to CSV/PDF
   - Class attendance trends
   - Student attendance analytics
   - Comparison charts

3. **QR Code Check-in**
   - Students scan QR at entrance
   - Automatic present marking
   - Integration with attendance system

4. **Geo-fencing**
   - Verify student location
   - Prevent remote check-ins
   - Campus boundary validation

5. **Substitute Teachers**
   - Temporary class access
   - Date-range based permissions
   - Substitute tracking

6. **Attendance Appeals**
   - Student/parent contest absent marking
   - Workflow for approval
   - Documentation upload

---

## API Usage Examples

### Example 1: Daily Attendance Workflow

```typescript
// 1. Teacher starts class, loads roster
const students = await getClassAttendance('class-uuid', '2024-01-18');

// 2. Quick mark all present
const presentRecords = students.map(s => ({
  class_id: 'class-uuid',
  student_id: s.student_id,
  attendance_date: '2024-01-18',
  status: 'present' as const
}));

await markBulkAttendance(presentRecords);

// 3. Student arrives late, update
await updateAttendance('attendance-uuid', {
  status: 'late',
  check_in_time: '09:30:00',
  notes: 'Bus delay'
});
```

### Example 2: Parent Checking Child's Attendance

```typescript
// Parent logs in, selects child
const { data, summary } = await getStudentAttendance(
  'student-uuid',
  '2024-01-01',
  '2024-01-31'
);

// Display summary
console.log(`Attendance Rate: ${
  (summary.present / summary.total) * 100
}%`);

// Show recent absences
const absences = data.filter(r => r.status === 'absent');
console.log(`Recent absences: ${absences.length}`);
```

### Example 3: Attendance Correction

```typescript
// Teacher realizes mistake from yesterday
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const students = await getClassAttendance(
  'class-uuid',
  yesterday.toISOString().split('T')[0]
);

// Find incorrect record
const wrongRecord = students.find(s =>
  s.student_code === '2024001'
);

// Fix it
if (wrongRecord?.attendance_id) {
  await updateAttendance(wrongRecord.attendance_id, {
    status: 'present',
    notes: 'Correction: Student was present'
  });
}
```

---

## Summary

The Attendance Module provides a robust, secure, and user-friendly system for tracking student attendance with:

- ✅ Role-based access control
- ✅ One-click marking interface
- ✅ Real-time summaries
- ✅ Comprehensive audit trail
- ✅ Flexible corrections
- ✅ Multi-tenant isolation
- ✅ Parent visibility

All features are built with security, performance, and scalability in mind, ready for production deployment.
