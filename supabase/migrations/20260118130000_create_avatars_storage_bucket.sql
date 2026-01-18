/*
  # Create Avatars Storage Bucket Setup
  
  This migration document describes how to set up the avatars storage bucket.
  
  Note: Supabase Storage buckets cannot be created via SQL migrations.
  You need to create the bucket via Supabase Dashboard or Storage API.
  
  ## Manual Setup Instructions:
  
  1. Go to Supabase Dashboard → Storage
  2. Click "New bucket"
  3. Bucket name: `avatars`
  4. Public bucket: ✅ Yes (so users can view avatars)
  5. File size limit: 5MB (optional)
  6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp (optional)
  
  ## RLS Policies (Apply via SQL Editor or Storage API):
  
  After creating the bucket, run these SQL commands to set up RLS policies:
  
  -- Allow authenticated users to upload their own avatars
  -- Path format: {school_id}/{user_id}_{timestamp}.{ext}
  CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' 
      AND (storage.foldername(name))[1] = (SELECT school_id::text FROM user_profiles WHERE id = auth.uid())
      AND (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
    );
  
  -- Allow users to update their own avatars
  CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = (SELECT school_id::text FROM user_profiles WHERE id = auth.uid())
      AND (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
    )
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = (SELECT school_id::text FROM user_profiles WHERE id = auth.uid())
      AND (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
    );
  
  -- Allow users to delete their own avatars
  CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = (SELECT school_id::text FROM user_profiles WHERE id = auth.uid())
      AND (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
    );
  
  -- Allow all authenticated users to view avatars (public bucket)
  -- Since it's a public bucket, this may not be necessary, but good to have
  CREATE POLICY "Users can view avatars"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'avatars');
  
  ## Alternative: Simpler RLS Policies (if folder structure is different)
  
  If the folder structure is different, use these simpler policies:
  
  -- Allow users to upload any file to avatars bucket (their school's folder)
  CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars');
  
  -- Allow users to update files they uploaded
  CREATE POLICY "Users can update own avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');
  
  -- Allow users to delete files they uploaded
  CREATE POLICY "Users can delete own avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars');
  
  ## Notes:
  
  - The bucket should be created as PUBLIC so avatar URLs are accessible
  - File paths are structured as: `{school_id}/{user_id}_{timestamp}.{ext}`
  - This ensures multi-tenant isolation at the storage level
  - Maximum file size: 5MB (recommended)
  - Allowed types: JPEG, PNG, WebP
  
  ## Testing:
  
  After setup, verify the bucket exists:
  ```sql
  SELECT * FROM storage.buckets WHERE name = 'avatars';
  ```
  
  Verify policies are applied:
  ```sql
  SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
  ```
*/

-- This is a documentation-only migration
-- The actual bucket must be created via Supabase Dashboard
-- See instructions above for manual setup
