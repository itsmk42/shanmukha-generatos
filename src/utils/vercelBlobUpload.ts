/**
 * Vercel Blob Upload utility for Next.js environment
 * This version uses Vercel Blob for reliable file storage on Vercel
 */

import { put, del, list } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  size: number;
  uploadedAt: Date;
  error?: string;
}

/**
 * Upload file to Vercel Blob
 * @param file - File object to upload
 * @param filename - Custom filename (optional)
 * @returns Promise<BlobUploadResult> Upload result with URL
 */
export async function uploadToVercelBlob(
  file: File,
  filename?: string
): Promise<BlobUploadResult> {
  try {
    // Generate filename if not provided
    const finalFilename = filename || generateUniqueFilename(file.name);
    
    // Create the blob path with organized structure
    const blobPath = `generators/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${finalFilename}`;
    
    console.log('Uploading to Vercel Blob:', blobPath);
    
    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false, // We're handling unique names ourselves
    });
    
    console.log('Vercel Blob upload successful:', blob.url);
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      contentDisposition: `inline; filename="${finalFilename}"`,
      size: file.size,
      uploadedAt: new Date(),
    };

  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    
    return {
      url: '',
      pathname: '',
      contentType: file.type,
      contentDisposition: '',
      size: file.size,
      uploadedAt: new Date(),
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload file buffer to Vercel Blob (for API routes)
 * @param buffer - File buffer
 * @param filename - File name
 * @param contentType - MIME type
 * @returns Promise<BlobUploadResult> Upload result with URL
 */
export async function uploadBufferToVercelBlob(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<BlobUploadResult> {
  try {
    // Generate unique filename
    const finalFilename = generateUniqueFilename(filename);
    
    // Create the blob path with organized structure
    const blobPath = `generators/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${finalFilename}`;
    
    console.log('Uploading buffer to Vercel Blob:', blobPath);
    
    // Upload to Vercel Blob
    const blob = await put(blobPath, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType,
    });
    
    console.log('Vercel Blob buffer upload successful:', blob.url);
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType,
      contentDisposition: `inline; filename="${finalFilename}"`,
      size: buffer.length,
      uploadedAt: new Date(),
    };

  } catch (error) {
    console.error('Error uploading buffer to Vercel Blob:', error);
    
    return {
      url: '',
      pathname: '',
      contentType,
      contentDisposition: '',
      size: buffer.length,
      uploadedAt: new Date(),
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete file from Vercel Blob
 * @param url - Blob URL to delete
 * @returns Promise<boolean> Success status
 */
export async function deleteFromVercelBlob(url: string): Promise<boolean> {
  try {
    console.log('Deleting from Vercel Blob:', url);
    await del(url);
    console.log('Vercel Blob delete successful');
    return true;
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    return false;
  }
}

/**
 * List files in Vercel Blob
 * @param prefix - Path prefix to filter files
 * @param limit - Maximum number of files to return
 * @returns Promise<Array> List of blob objects
 */
export async function listVercelBlobFiles(prefix?: string, limit: number = 100) {
  try {
    const options: any = { limit };
    if (prefix) {
      options.prefix = prefix;
    }
    
    const result = await list(options);
    console.log(`Found ${result.blobs.length} files in Vercel Blob`);
    return result.blobs;
  } catch (error) {
    console.error('Error listing Vercel Blob files:', error);
    return [];
  }
}

/**
 * Generate unique filename with timestamp and random string
 * @param originalName - Original filename
 * @returns string - Unique filename
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `${timestamp}_${randomString}_${baseName}.${extension}`;
}

/**
 * Validate file for Vercel Blob upload
 * @param file - File to validate
 * @returns object - Validation result
 */
export function validateFileForBlob(file: File): { isValid: boolean; error?: string } {
  // Check file size (Vercel Blob has a 4.5MB limit for hobby plan)
  const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${(MAX_SIZE / (1024 * 1024)).toFixed(1)}MB`
    };
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Get file info from Vercel Blob URL
 * @param url - Blob URL
 * @returns object - File info
 */
export function getBlobFileInfo(url: string) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    
    return {
      filename,
      pathname,
      isVercelBlob: urlObj.hostname.includes('vercel-storage.com')
    };
  } catch (error) {
    return {
      filename: '',
      pathname: '',
      isVercelBlob: false
    };
  }
}
