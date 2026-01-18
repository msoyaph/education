/*
  # Remove Unused Indexes and Fix Security Issues

  1. Index Cleanup
    - Drop all unused indexes that are not providing value
    - These indexes consume storage and slow down write operations
    - Indexes can be recreated later if query patterns show they're needed
  
  2. Function Security Fix
    - Fix `has_feature` function to use immutable search_path
    - Prevents potential security vulnerabilities from search_path manipulation
  
  3. Performance Improvements
    - Reduced storage overhead from unused indexes
    - Faster INSERT/UPDATE/DELETE operations
    - Improved maintenance operations
  
  Note: Auth configuration changes (connection strategy and password protection)
  must be configured through the Supabase Dashboard under Project Settings > Auth.
*/

-- Drop unused indexes on enrollments table
DROP INDEX IF EXISTS idx_enrollments_school;
DROP INDEX IF EXISTS idx_enrollments_class;
DROP INDEX IF EXISTS idx_enrollments_student;
DROP INDEX IF EXISTS idx_enrollments_status;

-- Drop unused indexes on schools table
DROP INDEX IF EXISTS idx_schools_code;
DROP INDEX IF EXISTS idx_schools_active;
DROP INDEX IF EXISTS idx_schools_subscription_tier;
DROP INDEX IF EXISTS idx_schools_subscription_status;

-- Drop unused indexes on user_profiles table
DROP INDEX IF EXISTS idx_user_profiles_school;
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_type;
DROP INDEX IF EXISTS idx_user_profiles_active;

-- Drop unused indexes on capabilities table
DROP INDEX IF EXISTS idx_capabilities_name;
DROP INDEX IF EXISTS idx_capabilities_resource;

-- Drop unused indexes on role_capabilities table
DROP INDEX IF EXISTS idx_role_capabilities_role;
DROP INDEX IF EXISTS idx_role_capabilities_capability;

-- Drop unused indexes on roles table
DROP INDEX IF EXISTS idx_roles_school;
DROP INDEX IF EXISTS idx_roles_active;

-- Drop unused indexes on user_roles table
DROP INDEX IF EXISTS idx_user_roles_user;
DROP INDEX IF EXISTS idx_user_roles_role;
DROP INDEX IF EXISTS idx_user_roles_assigned_by;

-- Drop unused indexes on students table
DROP INDEX IF EXISTS idx_students_school;
DROP INDEX IF EXISTS idx_students_code;
DROP INDEX IF EXISTS idx_students_user;
DROP INDEX IF EXISTS idx_students_status;
DROP INDEX IF EXISTS idx_students_name;

-- Drop unused indexes on parents table
DROP INDEX IF EXISTS idx_parents_school;
DROP INDEX IF EXISTS idx_parents_user;
DROP INDEX IF EXISTS idx_parents_email;
DROP INDEX IF EXISTS idx_parents_name;

-- Drop unused indexes on student_parents table
DROP INDEX IF EXISTS idx_student_parents_student;
DROP INDEX IF EXISTS idx_student_parents_parent;
DROP INDEX IF EXISTS idx_student_parents_primary;

-- Drop unused indexes on teachers table
DROP INDEX IF EXISTS idx_teachers_school;
DROP INDEX IF EXISTS idx_teachers_user;
DROP INDEX IF EXISTS idx_teachers_code;
DROP INDEX IF EXISTS idx_teachers_status;

-- Drop unused indexes on courses table
DROP INDEX IF EXISTS idx_courses_school;
DROP INDEX IF EXISTS idx_courses_code;
DROP INDEX IF EXISTS idx_courses_active;

-- Drop unused indexes on classes table
DROP INDEX IF EXISTS idx_classes_school;
DROP INDEX IF EXISTS idx_classes_course;
DROP INDEX IF EXISTS idx_classes_teacher;
DROP INDEX IF EXISTS idx_classes_code;
DROP INDEX IF EXISTS idx_classes_status;

-- Drop unused indexes on attendance_records table
DROP INDEX IF EXISTS idx_attendance_school;
DROP INDEX IF EXISTS idx_attendance_class;
DROP INDEX IF EXISTS idx_attendance_student;
DROP INDEX IF EXISTS idx_attendance_date;
DROP INDEX IF EXISTS idx_attendance_student_date;
DROP INDEX IF EXISTS idx_attendance_class_date;
DROP INDEX IF EXISTS idx_attendance_records_marked_by;

-- Drop unused indexes on notifications table
DROP INDEX IF EXISTS idx_notifications_recipient;
DROP INDEX IF EXISTS idx_notifications_school;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_unread;
DROP INDEX IF EXISTS idx_notifications_sender_id;

-- Drop unused indexes on notif_queue table
DROP INDEX IF EXISTS idx_notif_queue_user_id;
DROP INDEX IF EXISTS idx_notif_queue_unread;
DROP INDEX IF EXISTS idx_notif_queue_event_type;
DROP INDEX IF EXISTS idx_notif_queue_school_id;

-- Drop unused indexes on notif_subscriptions table
DROP INDEX IF EXISTS idx_notif_subscriptions_user;
DROP INDEX IF EXISTS idx_notif_subscriptions_event_type;

-- Drop unused indexes on notif_delivery_log table
DROP INDEX IF EXISTS idx_notif_delivery_log;

-- Drop unused indexes on school_domains table
DROP INDEX IF EXISTS idx_school_domains_school;
DROP INDEX IF EXISTS idx_school_domains_domain;
DROP INDEX IF EXISTS idx_school_domains_verified;

-- Fix has_feature function to use stable search_path
-- This prevents potential security vulnerabilities
DROP FUNCTION IF EXISTS has_feature(uuid, text);

CREATE OR REPLACE FUNCTION has_feature(
  school_uuid uuid,
  feature_name text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  tier text;
BEGIN
  SELECT subscription_tier INTO tier
  FROM schools
  WHERE id = school_uuid;
  
  IF tier IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM feature_flags
    WHERE feature = feature_name
      AND enabled_tiers @> ARRAY[tier]::text[]
      AND is_active = true
  );
END;
$$;

-- Add comment explaining the security fix
COMMENT ON FUNCTION has_feature(uuid, text) IS 'Check if a school has access to a feature based on subscription tier. Uses stable search_path for security.';
