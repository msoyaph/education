# Notification System - Quick Start Guide

## Overview

The Notification System is a production-ready, event-driven platform for multi-channel notifications integrated with your Education CRM's attendance module.

---

## What's Delivered

### ✅ Database Schema
- `notif_events` - Event type definitions (10 pre-seeded events)
- `notif_templates` - Role-based message templates
- `notif_subscriptions` - User preference management
- `notif_queue` - Notification instances
- `notif_delivery_log` - Audit trail

### ✅ API (Edge Function)
- `/notifications` - CRUD operations
- `/notifications/create` - Event-triggered notification creation
- `/notifications/unread-count` - Badge count
- `/subscriptions` - User preference management

### ✅ Service Layer
- `notificationService.ts` - Complete TypeScript client
- Helper functions for attendance integration
- Real-time subscription support

### ✅ UI Components
- `NotificationBell` - Bell icon with unread badge
- `NotificationDropdown` - Notification list with actions
- `NotificationSettings` - User preference interface

### ✅ Documentation
- Complete system architecture
- API reference with examples
- Integration guide
- Event payload schemas

---

## Quick Demo

The application includes a notification demo accessible from the home screen:

1. **Welcome Screen**: Overview with notification card
2. **Notification Settings**: Click to see preference management UI

---

## File Structure

```
project/
├── supabase/
│   ├── functions/
│   │   └── notifications/
│   │       └── index.ts              # Edge function
│   └── migrations/
│       └── create_notification_system_tables.sql
├── src/
│   ├── components/
│   │   └── notifications/
│   │       ├── NotificationBell.tsx
│   │       ├── NotificationDropdown.tsx
│   │       └── NotificationSettings.tsx
│   ├── services/
│   │   └── notificationService.ts
│   ├── types/
│   │   └── notification.ts
│   └── App.tsx
├── NOTIFICATION_SYSTEM.md            # Complete documentation
└── NOTIFICATION_QUICKSTART.md        # This file
```

---

## Pre-Seeded Event Types

| Event Type | Description | Recipients |
|------------|-------------|------------|
| `attendance_marked` | Attendance updated | Student, Parent |
| `attendance_absent` | Student absent (high priority) | Parent |
| `attendance_late` | Student late | Parent |
| `attendance_pattern` | Attendance issues detected | Parent, Teacher, Admin |
| `grade_posted` | New grade available | Student, Parent |
| `assignment_due` | Assignment due in 24h | Student |
| `announcement_posted` | School/class announcement | Student, Parent, Teacher |
| `fee_due` | Fee payment due | Parent |
| `class_cancelled` | Class cancelled | Student, Parent, Teacher |
| `message_received` | New message | Student, Parent, Teacher, Admin |

---

## Integration Example: Attendance Notifications

### Automatic Notification on Attendance Marking

When attendance is marked, the system automatically sends notifications:

```typescript
// In attendance edge function (already implemented)
import { createClient } from 'npm:@supabase/supabase-js@2';

// After marking attendance successfully
const notificationPayload = {
  event_type: status === 'absent' ? 'attendance_absent' : 'attendance_marked',
  recipient_ids: [studentUserId, ...parentUserIds],
  event_data: {
    student_id: studentId,
    student_name: 'John Doe',
    class_name: 'Math 101',
    date: '2024-01-18',
    status: 'absent',
  },
  school_id: schoolId,
};

// Call notification endpoint
await fetch(`${supabaseUrl}/functions/v1/notifications/create`, {
  method: 'POST',
  headers: {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(notificationPayload),
});
```

### What Happens:

1. **Event Validation**: System checks `attendance_absent` exists
2. **Recipient Processing**: For each recipient:
   - Gets user profile and role
   - Checks subscription preferences
   - Finds template (event_type + channel + role)
3. **Template Resolution**:
   - Parent gets: "John Doe was marked absent from Math 101 on 2024-01-18."
   - Student gets: "Your attendance for Math 101 on 2024-01-18 has been marked as absent."
4. **Notification Creation**: Inserted into `notif_queue` with status='pending'
5. **Real-time Delivery**: Supabase Realtime pushes to connected clients

---

## Adding Notification Bell to Your App

```tsx
import { NotificationBell } from './components/notifications/NotificationBell';

function Navigation() {
  return (
    <nav className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <h1>My App</h1>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
```

---

## User Preference Management

Users can customize notification preferences via:

```tsx
import { NotificationSettings } from './components/notifications/NotificationSettings';

function SettingsPage() {
  return <NotificationSettings />;
}
```

**Features**:
- Toggle In-App, Push, Email, SMS per event
- Real-time updates
- Role-aware (only shows relevant events)

---

## API Usage Examples

### 1. Fetch Notifications

```typescript
import { getNotifications } from './services/notificationService';

const { data, unread_count } = await getNotifications(20, 0);
```

### 2. Mark as Read

```typescript
import { markNotificationAsRead } from './services/notificationService';

await markNotificationAsRead(notificationId);
```

### 3. Create Custom Notification

```typescript
import { createNotification } from './services/notificationService';

await createNotification({
  event_type: 'grade_posted',
  recipient_ids: [studentUserId, parentUserId],
  event_data: {
    student_name: 'John Doe',
    assignment_name: 'Midterm Exam',
    class_name: 'Math 101',
    grade: 'A',
  },
});
```

### 4. Update Preferences

```typescript
import { updateNotificationPreference } from './services/notificationService';

await updateNotificationPreference('attendance_absent', {
  in_app_enabled: true,
  push_enabled: true,
  email_enabled: false,
});
```

---

## Template Variables

Use `{variable_name}` syntax in templates:

**Common Variables**:
- `{student_name}` - "John Doe"
- `{student_id}` - For action URLs
- `{class_name}` - "Math 101"
- `{date}` - "2024-01-18"
- `{status}` - "present", "absent", "late", "excused"
- `{check_in_time}` - "09:30:00"
- `{assignment_name}` - Assignment title
- `{grade}` - Letter or numeric grade

---

## Channel Support

### In-App (✅ Implemented)
- Always available
- Real-time via Supabase
- Notification bell + dropdown

### Push (🔧 Framework Ready)
- Requires browser permission
- Firebase Cloud Messaging integration needed
- Service worker setup

### Email (🔧 Framework Ready)
- Requires email provider (SendGrid, Mailgun)
- HTML templates
- Batch sending support

### SMS (🔧 Framework Ready)
- Requires SMS provider (Twilio)
- Character limit handling
- Delivery receipts

---

## Security Features

### Row Level Security (RLS)
- Users see only their own notifications
- Users manage only their own preferences
- Multi-tenant isolation via school_id

### Authentication
- All endpoints require valid JWT
- Bearer token authentication
- Session-based access control

### Input Validation
- Event type validation
- Recipient ID verification
- Template variable sanitization
- XSS protection

---

## Performance

### Database Indexes
```sql
idx_notif_queue_user_id       -- Fast user lookups
idx_notif_queue_unread        -- Efficient unread counts
idx_notif_queue_event_type    -- Event filtering
```

### Optimizations
- Batch notification creation
- Pagination support (limit/offset)
- Partial index on unread notifications
- Efficient template caching

---

## Testing Checklist

### Backend Tests
- [ ] Create notification with valid event
- [ ] Reject invalid event type
- [ ] Template variable replacement
- [ ] Subscription preference filtering
- [ ] Role-based template selection

### Frontend Tests
- [ ] Notification bell displays count
- [ ] Mark as read updates UI
- [ ] Mark all as read clears badge
- [ ] Preferences toggle updates
- [ ] Real-time notifications appear

### Integration Tests
- [ ] Attendance marking triggers notification
- [ ] Student receives notification
- [ ] Parent receives notification
- [ ] Notification contains correct data
- [ ] Action URL navigates correctly

---

## Extending the System

### Add New Event Type

1. **Insert Event**:
```sql
INSERT INTO notif_events (event_type, event_name, available_for_roles)
VALUES ('custom_event', 'Custom Event', ARRAY['student']);
```

2. **Add Template**:
```sql
INSERT INTO notif_templates (event_type, channel, role, title_template, body_template, icon)
VALUES ('custom_event', 'in_app', 'student', 'Custom Title', 'Custom body with {variable}', 'bell');
```

3. **Trigger Notification**:
```typescript
await createNotification({
  event_type: 'custom_event',
  recipient_ids: [userId],
  event_data: { variable: 'value' },
});
```

---

## Troubleshooting

### Notifications Not Appearing

**Check subscription**:
```sql
SELECT * FROM notif_subscriptions
WHERE user_id = 'user-uuid' AND event_type = 'attendance_absent';
```

**Check template**:
```sql
SELECT * FROM notif_templates
WHERE event_type = 'attendance_absent' AND role = 'parent';
```

**Check notification queue**:
```sql
SELECT * FROM notif_queue
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC LIMIT 10;
```

### Template Variables Not Working

- Ensure `event_data` includes all template variables
- Use exact spelling: `{student_name}` not `{studentName}`
- Check for typos in template definition

---

## Next Steps

1. **Add to Navigation**: Place `<NotificationBell />` in your app's header
2. **Integrate with Modules**: Add notification triggers to attendance, grades, etc.
3. **Configure Channels**: Set up Push/Email/SMS providers as needed
4. **Customize Templates**: Adjust templates for your school's tone
5. **Monitor Usage**: Check `notif_delivery_log` for analytics

---

## Summary

The Notification System is production-ready with:

- ✅ Complete database schema with RLS
- ✅ RESTful API with authentication
- ✅ Role-aware template system
- ✅ User preference management
- ✅ UI components (bell, dropdown, settings)
- ✅ Real-time delivery support
- ✅ Attendance integration
- ✅ Extensible architecture
- ✅ Complete documentation
- ✅ Security and performance optimizations

Ready to integrate into your Education CRM system!
