/**
 * Avatar Upload Service
 * 
 * Handles avatar/profile photo uploads to Supabase Storage
 * School-scoped and respects multi-tenancy
 */

import { supabase } from '../lib/supabase';

const AVATAR_BUCKET = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface AvatarUploadResult {
  url: string;
  path: string;
}

/**
 * Upload avatar photo to Supabase Storage
 * @param file - Image file to upload
 * @param userId - User ID (from auth.uid())
 * @param schoolId - School ID for multi-tenant isolation
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  schoolId: string
): Promise<AvatarUploadResult> {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Generate unique filename: school_id/user_id/timestamp.extension
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const fileName = `${userId}_${timestamp}.${fileExtension}`;
  const filePath = `${schoolId}/${fileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded avatar');
  }

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
}

/**
 * Delete avatar from Supabase Storage
 * @param filePath - Path to file in storage
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    // Don't throw - deletion is optional cleanup
  }
}

/**
 * Check if avatar bucket exists and is accessible
 */
export async function checkAvatarBucket(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error checking buckets:', error);
      return false;
    }
    return data?.some(bucket => bucket.name === AVATAR_BUCKET) || false;
  } catch (error) {
    console.error('Error checking avatar bucket:', error);
    return false;
  }
}
