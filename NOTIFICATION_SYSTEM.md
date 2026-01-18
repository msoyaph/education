# Notification System Documentation

## Overview

The Notification System is an event-driven, multi-channel notification platform designed for the Education CRM MVP. It supports in-app, push, email, and SMS notifications with role-based delivery and user preferences.

---

## Architecture

### Components

1. **Database Layer**: Event definitions, templates, subscriptions, and notification queue
2. **API Layer**: Edge function for CRUD operations and notification creation
3. **Service Layer**: TypeScript service for client-side integration
4. **UI Layer**: React components for notification display and preferences

### Data Flow

```
Event Trigger (e.g., Attendance Marked)
    ↓
Service Layer (sendAttendanceNotification)
    ↓
Edge Function (/notifications/create)
    ↓
Template Resolution (based on role & event_type)
    ↓
Subscription Check (user preferences)
    ↓
Notification Creation (notif_queue table)
    ↓
Real-time Delivery (Supabase Realtime)
    ↓
UI Update (NotificationBell component)
```

---

## Database Schema

### Tables

#### `notif_events`
Event type definitions that can trigger notifications.

```sql
CREATE TABLE notif_events (
  id uuid PRIMARY KEY,
  event_type text UNIQUE NOT NULL,  -- e.g., 'attendance_marked'
  event_name text NOT NULL,          -- e.g., 'Attendance Marked'
  event_description text,
  default_enabled boolean DEFAULT true,
  available_for_roles text[],        -- ['student', 'parent', 'teacher']
  created_at timestamptz,
  updated_at timestamptz
);
```

**Example Events**:
- `attendance_marked` - General attendance update
- `attendance_absent` - Student marked absent (high priority for parents)
- `attendance_late` - Student arrived late
- `grade_posted` - New grade available
- `assignment_due` - Assignment due soon

---

#### `notif_templates`
Message templates for different channels and roles.

```sql
CREATE TABLE notif_templates (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  channel text NOT NULL,              -- 'in_app', 'push', 'email', 'sms'
  role text NOT NULL,                 -- 'student', 'parent', 'teacher'
  title_template text NOT NULL,       -- 'Child Attendance Updated'
  body_template text NOT NULL,        -- '{student_name} was marked {status}'
  action_url_template text,           -- '/attendance/{student_id}'
  icon text,                          -- 'alert-circle'
  priority text DEFAULT 'normal',     -- 'low', 'normal', 'high', 'urgent'
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE(event_type, channel, role)
);
```

**Template Variables**: Use `{variable_name}` syntax
- `{student_name}`, `{class_name}`, `{date}`, `{status}`, `{check_in_time}`
- Variables are replaced from `event_data` JSON

---

#### `notif_subscriptions`
User notification preferences.

```sql
CREATE TABLE notif_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  in_app_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT false,
  sms_enabled boolean DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE(user_id, event_type)
);
```

**Defaults**:
- In-app: Enabled by default
- Push/Email/SMS: Disabled by default (require user opt-in)

---

#### `notif_queue`
Notification instances sent to users.

```sql
CREATE TABLE notif_queue (
  id uuid PRIMARY KEY,
  school_id uuid,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  channel text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  icon text,
  priority text DEFAULT 'normal',
  event_data jsonb DEFAULT '{}',
  status text DEFAULT 'pending',      -- 'pending', 'sent', 'delivered', 'failed', 'read'
  read_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Status Lifecycle**:
```
pending → sent → delivered → read
        ↓
      failed
```

---

#### `notif_delivery_log`
Audit trail for notification delivery attempts.

```sql
CREATE TABLE notif_delivery_log (
  id uuid PRIMARY KEY,
  notification_id uuid NOT NULL,
  channel text NOT NULL,
  attempt_number int DEFAULT 1,
  status text NOT NULL,               -- 'success', 'failed', 'skipped'
  response_code text,
  response_message text,
  provider text,                      -- 'Firebase', 'SendGrid', etc.
  provider_message_id text,
  attempted_at timestamptz
);
```

---

## API Endpoints

### Base URL
```
{SUPABASE_URL}/functions/v1/notifications
```

All endpoints require authentication via Bearer token.

---

### 1. Get Notifications

**Endpoint**: `GET /notifications`

**Query Parameters**:
- `limit` (default: 50) - Number of notifications to fetch
- `offset` (default: 0) - Pagination offset
- `status` (optional) - Filter by status ('pending', 'sent', 'read')
- `event_type` (optional) - Filter by event type

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "event_type": "attendance_absent",
      "channel": "in_app",
      "title": "Absent Alert",
      "body": "John Doe was marked absent from Math 101 on 2024-01-18.",
      "action_url": "/attendance/student-uuid",
      "icon": "alert-circle",
      "priority": "high",
      "event_data": {...},
      "status": "pending",
      "created_at": "2024-01-18T09:00:00Z"
    }
  ],
  "unread_count": 5,
  "total": 20
}
```

---

### 2. Get Unread Count

**Endpoint**: `GET /notifications/unread-count`

**Response**:
```json
{
  "count": 5
}
```

**Use Case**: Display badge on notification bell

---

### 3. Mark Notification as Read

**Endpoint**: `PUT /notifications/{id}/read`

**Response**:
```json
{
  "message": "Notification marked as read"
}
```

---

### 4. Mark All as Read

**Endpoint**: `PUT /notifications/mark-all-read`

**Response**:
```json
{
  "message": "All notifications marked as read"
}
```

---

### 5. Create Notification

**Endpoint**: `POST /notifications/create`

**Request Body**:
```json
{
  "event_type": "attendance_absent",
  "recipient_ids": ["user-uuid-1", "user-uuid-2"],
  "event_data": {
    "student_id": "student-uuid",
    "student_name": "John Doe",
    "class_name": "Math 101",
    "date": "2024-01-18",
    "status": "absent"
  },
  "school_id": "school-uuid"
}
```

**Process**:
1. Validates event type exists
2. For each recipient:
   - Gets user profile and role
   - Checks subscription preferences
   - Finds matching template (event_type + channel + role)
   - Replaces template variables with event_data
   - Creates notification in queue
3. Returns created notifications

**Response**:
```json
{
  "message": "Created 2 notifications",
  "data": [...]
}
```

---

### 6. Get Subscription Preferences

**Endpoint**: `GET /subscriptions`

**Response**:
```json
{
  "data": [
    {
      "event_type": "attendance_marked",
      "event_name": "Attendance Marked",
      "event_description": "Triggered when attendance is marked",
      "in_app_enabled": true,
      "push_enabled": false,
      "email_enabled": false,
      "sms_enabled": false
    }
  ]
}
```

---

### 7. Update Subscription Preference

**Endpoint**: `POST /subscriptions`

**Request Body**:
```json
{
  "event_type": "attendance_absent",
  "in_app_enabled": true,
  "push_enabled": true,
  "email_enabled": false,
  "sms_enabled": false
}
```

**Response**:
```json
{
  "message": "Subscription updated"
}
```

---

## Service Layer

### TypeScript Service (`notificationService.ts`)

#### Core Functions

```typescript
// Fetch notifications
getNotifications(limit?: number, offset?: number, status?: string, eventType?: string): Promise<NotificationResponse>

// Get unread count
getUnreadCount(): Promise<number>

// Mark as read
markNotificationAsRead(notificationId: string): Promise<void>

// Mark all as read
markAllNotificationsAsRead(): Promise<void>

// Create notification
createNotification(payload: CreateNotificationPayload): Promise<void>

// Get user preferences
getNotificationPreferences(): Promise<NotificationPreference[]>

// Update preference
updateNotificationPreference(eventType: string, preferences: {...}): Promise<void>
```

#### Helper Functions

```typescript
// Send attendance notification (integration with attendance module)
sendAttendanceNotification(attendanceRecord: {...}): Promise<void>

// Real-time subscription
subscribeToNotifications(userId: string, onNotification: (notification) => void): () => void
```

---

## UI Components

### 1. NotificationBell

Displays bell icon with unread count badge.

```tsx
import { NotificationBell } from './components/notifications/NotificationBell';

<NotificationBell />
```

**Features**:
- Auto-updates unread count every 30 seconds
- Shows dropdown on click
- Red badge with count (9+ for >9)

---

### 2. NotificationDropdown

Dropdown list of recent notifications.

```tsx
import { NotificationDropdown } from './components/notifications/NotificationDropdown';

<NotificationDropdown
  onClose={() => setShowDropdown(false)}
  onNotificationRead={() => setUnreadCount(prev => prev - 1)}
  onAllRead={() => setUnreadCount(0)}
/>
```

**Features**:
- Shows last 20 notifications
- Color-coded by priority
- Time ago display (e.g., "5m ago")
- Mark as read on click
- Navigate to action_url
- "Mark all read" button

---

### 3. NotificationSettings

User preference management interface.

```tsx
import { NotificationSettings } from './components/notifications/NotificationSettings';

<NotificationSettings />
```

**Features**:
- Grid layout: Event × Channel
- Toggle switches for each channel
- Real-time updates
- Success/error feedback

---

## Integration Guide

### Step 1: Add Notification Bell to Navigation

```tsx
import { NotificationBell } from './components/notifications/NotificationBell';

function Navigation() {
  return (
    <nav>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <UserMenu />
      </div>
    </nav>
  );
}
```

---

### Step 2: Send Notification from Attendance Module

Update `attendance` edge function to trigger notifications:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';

// After successfully marking attendance
const notificationPayload = {
  event_type: record.status === 'absent' ? 'attendance_absent' : 'attendance_marked',
  recipient_ids: [student.user_id, ...parentUserIds],
  event_data: {
    student_id: record.student_id,
    student_name: `${student.first_name} ${student.last_name}`,
    class_name: classInfo.name,
    date: record.attendance_date,
    status: record.status,
    check_in_time: record.check_in_time || '',
  },
  school_id: userProfile.school_id,
};

// Call notification edge function
const notifResponse = await fetch(`${supabaseUrl}/functions/v1/notifications/create`, {
  method: 'POST',
  headers: {
    'Authorization': req.headers.get('Authorization'),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(notificationPayload),
});
```

---

### Step 3: Real-time Notifications (Optional)

Subscribe to real-time updates:

```tsx
import { subscribeToNotifications } from './services/notificationService';
import { supabase } from './lib/supabase';

function App() {
  useEffect(() => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      toast.info(notification.title);
      // Update UI state
    });

    return unsubscribe;
  }, []);
}
```

---

## Event Payload Schemas

### Attendance Events

#### `attendance_marked`
```json
{
  "student_id": "uuid",
  "student_name": "John Doe",
  "class_name": "Math 101",
  "date": "2024-01-18",
  "status": "present"
}
```

#### `attendance_absent`
```json
{
  "student_id": "uuid",
  "student_name": "John Doe",
  "class_name": "Math 101",
  "date": "2024-01-18",
  "status": "absent"
}
```

#### `attendance_late`
```json
{
  "student_id": "uuid",
  "student_name": "John Doe",
  "class_name": "Math 101",
  "date": "2024-01-18",
  "status": "late",
  "check_in_time": "09:30:00"
}
```

---

### Grade Events

#### `grade_posted`
```json
{
  "student_id": "uuid",
  "student_name": "John Doe",
  "assignment_name": "Midterm Exam",
  "class_name": "Math 101",
  "grade": "A"
}
```

---

### Assignment Events

#### `assignment_due`
```json
{
  "assignment_id": "uuid",
  "assignment_name": "Chapter 5 Homework",
  "class_name": "Math 101",
  "due_time": "11:59 PM"
}
```

---

## Subscription Rules

### Role-Based Defaults

| Event Type | Student | Parent | Teacher | Admin |
|------------|---------|--------|---------|-------|
| attendance_marked | ✓ | ✓ | ✗ | ✗ |
| attendance_absent | ✗ | ✓ | ✗ | ✗ |
| attendance_late | ✗ | ✓ | ✗ | ✗ |
| grade_posted | ✓ | ✓ | ✗ | ✗ |
| assignment_due | ✓ | ✗ | ✗ | ✗ |
| announcement_posted | ✓ | ✓ | ✓ | ✗ |

### Channel Defaults

| Channel | Default State | Reason |
|---------|---------------|--------|
| In-App | Enabled | Always available |
| Push | Disabled | Requires browser permission |
| Email | Disabled | Requires email config |
| SMS | Disabled | Requires SMS provider |

---

## Extensibility

### Adding New Event Types

1. **Insert Event Definition**:
```sql
INSERT INTO notif_events (event_type, event_name, event_description, available_for_roles)
VALUES (
  'payment_reminder',
  'Payment Reminder',
  'Fee payment due soon',
  ARRAY['parent']
);
```

2. **Create Templates**:
```sql
INSERT INTO notif_templates (event_type, channel, role, title_template, body_template, icon, priority)
VALUES (
  'payment_reminder',
  'in_app',
  'parent',
  'Payment Due',
  'Fee payment of ${amount} is due on {due_date}.',
  'dollar-sign',
  'high'
);
```

3. **Send Notification**:
```typescript
await createNotification({
  event_type: 'payment_reminder',
  recipient_ids: [parentUserId],
  event_data: {
    amount: '500',
    due_date: '2024-01-31',
  },
});
```

---

### Adding Email/SMS Support

1. **Configure Provider**:
   - Email: SendGrid, Mailgun, AWS SES
   - SMS: Twilio, AWS SNS

2. **Update Edge Function**:
```typescript
// In notifications/index.ts
if (channel === 'email') {
  await sendEmail({
    to: userProfile.email,
    subject: title,
    body: bodyText,
  });

  await supabase.from('notif_delivery_log').insert({
    notification_id: notification.id,
    channel: 'email',
    status: 'success',
    provider: 'SendGrid',
  });
}
```

3. **Enable in Templates**:
```sql
-- Add email templates
INSERT INTO notif_templates (event_type, channel, role, ...)
VALUES ('attendance_absent', 'email', 'parent', ...);
```

---

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only view their own notifications
CREATE POLICY "Users view own notifications"
  ON notif_queue FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Users manage their own subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON notif_subscriptions FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text);
```

### Multi-Tenant Isolation

- All notifications include `school_id`
- Cross-school notification delivery blocked
- Templates and events are school-agnostic (shared across tenants)

### Input Validation

- Event type must exist in `notif_events`
- Recipient IDs must be valid users
- Template variables sanitized
- XSS protection in UI rendering

---

## Performance Optimizations

### Database Indexes

```sql
CREATE INDEX idx_notif_queue_user_id ON notif_queue(user_id, created_at DESC);
CREATE INDEX idx_notif_queue_unread ON notif_queue(user_id, status) WHERE status != 'read';
```

### Batch Processing

Create notifications in bulk:
```typescript
// Single INSERT for multiple recipients
await supabase.from('notif_queue').insert(notificationsArray);
```

### Caching Strategy

- Event definitions: Cache for 1 hour
- Templates: Cache for 1 hour
- User preferences: Cache for 5 minutes
- Unread count: Poll every 30 seconds

---

## Testing Scenarios

### Unit Tests

```typescript
describe('Notification Service', () => {
  test('creates notification with template variables', async () => {
    const result = await createNotification({
      event_type: 'attendance_absent',
      recipient_ids: ['parent-uuid'],
      event_data: {
        student_name: 'John Doe',
        class_name: 'Math 101',
        date: '2024-01-18',
      },
    });
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Notification Workflow', () => {
  test('attendance notification flow', async () => {
    // 1. Mark attendance
    await markAttendance({...});

    // 2. Verify notification created
    const notifications = await getNotifications();
    expect(notifications.data).toHaveLength(1);

    // 3. Verify correct recipients
    expect(notifications.data[0].user_id).toBe(parentUserId);
  });
});
```

---

## Troubleshooting

### Notifications Not Appearing

1. **Check subscription preferences**:
```sql
SELECT * FROM notif_subscriptions WHERE user_id = 'user-uuid' AND event_type = 'attendance_absent';
```

2. **Verify template exists**:
```sql
SELECT * FROM notif_templates WHERE event_type = 'attendance_absent' AND role = 'parent';
```

3. **Check notification queue**:
```sql
SELECT * FROM notif_queue WHERE user_id = 'user-uuid' ORDER BY created_at DESC LIMIT 10;
```

### Template Variables Not Replacing

- Ensure `event_data` includes all variables referenced in template
- Check spelling: `{student_name}` not `{studentName}`
- Verify data types (strings, not objects)

---

## Future Enhancements

### Planned Features

1. **Push Notifications**
   - Firebase Cloud Messaging integration
   - Browser notification permission flow
   - Service worker for offline support

2. **Email Notifications**
   - SendGrid/Mailgun integration
   - HTML email templates
   - Batch email delivery

3. **SMS Notifications**
   - Twilio integration
   - Character limit handling
   - Delivery receipts

4. **Advanced Features**
   - Notification grouping (e.g., "3 new attendance updates")
   - Rich media (images, attachments)
   - Action buttons (approve/reject)
   - Scheduled notifications
   - Digest emails (daily/weekly summary)

---

## Summary

The Notification System provides:

- ✅ Event-driven architecture
- ✅ Multi-channel support (in-app, push, email, SMS)
- ✅ Role-aware template resolution
- ✅ User preference management
- ✅ Real-time delivery via Supabase Realtime
- ✅ Comprehensive UI components
- ✅ Extensible event and template system
- ✅ Security with RLS and multi-tenant isolation
- ✅ Complete audit trail

Ready for production with attendance integration!
