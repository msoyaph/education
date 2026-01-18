/*
  # Notification System Schema
  
  Creates event-driven notification system with templates and subscriptions.
  Uses 'notif_' prefix to avoid conflicts with existing notifications table.
*/

-- Event definitions
CREATE TABLE IF NOT EXISTS notif_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text UNIQUE NOT NULL,
  event_name text NOT NULL,
  event_description text,
  default_enabled boolean DEFAULT true,
  available_for_roles text[] DEFAULT ARRAY['student', 'parent', 'teacher', 'admin'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (event_type ~ '^[a-z_]+$')
);

-- Message templates
CREATE TABLE IF NOT EXISTS notif_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  role text NOT NULL CHECK (role IN ('student', 'parent', 'teacher', 'admin', 'staff', 'it_admin', 'super_admin')),
  title_template text NOT NULL,
  body_template text NOT NULL,
  action_url_template text,
  icon text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_type, channel, role)
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS notif_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  in_app_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT false,
  sms_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_type)
);

-- Notification queue/log
CREATE TABLE IF NOT EXISTS notif_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  icon text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  event_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  read_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Delivery log
CREATE TABLE IF NOT EXISTS notif_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL,
  channel text NOT NULL,
  attempt_number int DEFAULT 1,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  response_code text,
  response_message text,
  provider text,
  provider_message_id text,
  attempted_at timestamptz DEFAULT now()
);

-- Foreign keys
ALTER TABLE notif_templates ADD CONSTRAINT notif_templates_event_type_fkey 
  FOREIGN KEY (event_type) REFERENCES notif_events(event_type) ON DELETE CASCADE;

ALTER TABLE notif_subscriptions ADD CONSTRAINT notif_subscriptions_event_type_fkey 
  FOREIGN KEY (event_type) REFERENCES notif_events(event_type) ON DELETE CASCADE;

ALTER TABLE notif_queue ADD CONSTRAINT notif_queue_event_type_fkey 
  FOREIGN KEY (event_type) REFERENCES notif_events(event_type) ON DELETE CASCADE;

ALTER TABLE notif_queue ADD CONSTRAINT notif_queue_school_id_fkey 
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE notif_delivery_log ADD CONSTRAINT notif_delivery_log_notification_id_fkey 
  FOREIGN KEY (notification_id) REFERENCES notif_queue(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_notif_queue_user_id ON notif_queue(user_id, created_at DESC);
CREATE INDEX idx_notif_queue_unread ON notif_queue(user_id, status) WHERE status != 'read';
CREATE INDEX idx_notif_queue_event_type ON notif_queue(event_type, created_at DESC);
CREATE INDEX idx_notif_subscriptions_user ON notif_subscriptions(user_id);
CREATE INDEX idx_notif_delivery_log ON notif_delivery_log(notification_id, attempted_at DESC);

-- RLS
ALTER TABLE notif_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON notif_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view templates" ON notif_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users view own subscriptions" ON notif_subscriptions FOR SELECT TO authenticated 
  USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users insert own subscriptions" ON notif_subscriptions FOR INSERT TO authenticated 
  WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users update own subscriptions" ON notif_subscriptions FOR UPDATE TO authenticated 
  USING (user_id::text = auth.uid()::text) WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users delete own subscriptions" ON notif_subscriptions FOR DELETE TO authenticated 
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users view own notifications" ON notif_queue FOR SELECT TO authenticated 
  USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users update own notifications" ON notif_queue FOR UPDATE TO authenticated 
  USING (user_id::text = auth.uid()::text) WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users view own delivery logs" ON notif_delivery_log FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM notif_queue WHERE notif_queue.id = notif_delivery_log.notification_id 
    AND notif_queue.user_id::text = auth.uid()::text));

-- Seed events
INSERT INTO notif_events (event_type, event_name, event_description, available_for_roles) VALUES
  ('attendance_marked', 'Attendance Marked', 'Triggered when attendance is marked', ARRAY['student', 'parent']),
  ('attendance_absent', 'Student Absent', 'Triggered when student marked absent', ARRAY['parent']),
  ('attendance_late', 'Student Late', 'Triggered when student marked late', ARRAY['parent']),
  ('attendance_pattern', 'Attendance Pattern Alert', 'Triggered for attendance issues', ARRAY['parent', 'teacher', 'admin']),
  ('grade_posted', 'Grade Posted', 'New grade posted', ARRAY['student', 'parent']),
  ('assignment_due', 'Assignment Due Soon', 'Assignment due in 24h', ARRAY['student']),
  ('announcement_posted', 'New Announcement', 'School/class announcement', ARRAY['student', 'parent', 'teacher']),
  ('fee_due', 'Fee Payment Due', 'Fee payment due', ARRAY['parent']),
  ('class_cancelled', 'Class Cancelled', 'Class cancelled', ARRAY['student', 'parent', 'teacher']),
  ('message_received', 'New Message', 'New message received', ARRAY['student', 'parent', 'teacher', 'admin'])
ON CONFLICT (event_type) DO NOTHING;

-- Seed templates
INSERT INTO notif_templates (event_type, channel, role, title_template, body_template, action_url_template, icon, priority) VALUES
  ('attendance_marked', 'in_app', 'student', 'Attendance Marked', 'Your attendance for {class_name} on {date} has been marked as {status}.', '/attendance', 'check-circle', 'normal'),
  ('attendance_marked', 'in_app', 'parent', 'Child Attendance Updated', '{student_name}''s attendance for {class_name} on {date} has been marked as {status}.', '/attendance/{student_id}', 'check-circle', 'normal'),
  ('attendance_absent', 'in_app', 'parent', 'Absent Alert', '{student_name} was marked absent from {class_name} on {date}.', '/attendance/{student_id}', 'alert-circle', 'high'),
  ('attendance_late', 'in_app', 'parent', 'Late Arrival', '{student_name} arrived late to {class_name} on {date} at {check_in_time}.', '/attendance/{student_id}', 'clock', 'normal'),
  ('grade_posted', 'in_app', 'student', 'New Grade Posted', 'Your grade for {assignment_name} in {class_name} is now available.', '/grades', 'award', 'normal'),
  ('grade_posted', 'in_app', 'parent', 'New Grade Posted', '{student_name} received a grade for {assignment_name} in {class_name}.', '/grades/{student_id}', 'award', 'normal')
ON CONFLICT (event_type, channel, role) DO NOTHING;
