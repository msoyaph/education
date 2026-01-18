/*
  # Fix Infinite Recursion in user_profiles RLS Policy

  ## Problem
  The RLS policy on user_profiles was using a direct query:
  ```sql
  USING (school_id IN (SELECT school_id FROM user_profiles WHERE id = (SELECT auth.uid())))
  ```
  This creates infinite recursion because:
  1. User queries user_profiles
  2. RLS policy checks access
  3. Policy queries user_profiles again
  4. This triggers the same RLS policy → infinite loop

  ## Solution
  Use the `get_user_school_id()` function which is marked as SECURITY DEFINER
  and bypasses RLS, preventing the recursion.

  ## Changes
  - Update user_profiles SELECT policy to use get_user_school_id()
  - Ensure users can always view their own profile
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users view school profiles" ON user_profiles;

-- Create fixed policy using the SECURITY DEFINER function
CREATE POLICY "Users view school profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can always view their own profile
    id = auth.uid()
    OR
    -- Users can view profiles in their school (using function to avoid recursion)
    school_id = get_user_school_id()
    OR
    -- Super admins can view all profiles
    is_super_admin()
  );

-- Ensure the function exists and is properly configured
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS uuid AS $$
  SELECT school_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public;

-- Ensure is_super_admin function exists
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public;
