/**
 * S3 Upload utility for Next.js environment
 * This version uses dynamic imports to avoid build-time dependency issues
 */

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
  etag?: string;
  error?: string;
}

/**
 * Upload file buffer to S3 with dynamic imports
 * @param buffer - File buffer
 * @param filename - File name
 * @param mimetype - MIME type
 * @returns Promise<S3UploadResult> Upload result with URL
 */
export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<S3UploadResult> {
  try {
    // For development/testing, return a placeholder URL
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('Development mode: Using placeholder image URL');
      return {
        url: `https://via.placeholder.com/400x300/cccccc/666666?text=Generator+Image`,
        key: `dev/${filename}`,
        bucket: process.env.AWS_S3_BUCKET || 'shanmukha-generators-media'
      };
    }

    // Dynamic import of AWS SDK to avoid build-time issues
    const AWS = await import('aws-sdk');
    
    // Configure AWS SDK
    AWS.default.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const s3 = new AWS.default.S3();
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'shanmukha-generators-media';

    const params = {
      Bucket: BUCKET_NAME,
      Key: `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read', // Make files publicly accessible
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'service': 'shanmukha-generators'
      }
    };

    const result = await s3.upload(params).promise();
    
    console.log('File uploaded successfully:', result.Location);
    
    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      etag: result.ETag
    };

  } catch (error) {
    console.error('Error uploading to S3:', error);
    
    // Return placeholder URL as fallback
    return {
      url: `https://via.placeholder.com/400x300/cccccc/666666?text=Upload+Failed`,
      key: `error/${filename}`,
      bucket: process.env.AWS_S3_BUCKET || 'shanmukha-generators-media',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete file from S3
 * @param key - S3 object key
 * @returns Promise<Object> Delete result
 */
export async function deleteFromS3(key: string): Promise<{ success: boolean; message?: string; key?: string; bucket?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('Development mode: Skipping S3 delete');
      return { success: true, message: 'Development mode - no actual delete' };
    }

    // Dynamic import of AWS SDK
    const AWS = await import('aws-sdk');
    
    AWS.default.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const s3 = new AWS.default.S3();
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'shanmukha-generators-media';

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    
    console.log('File deleted successfully:', key);
    
    return {
      success: true,
      key: key,
      bucket: BUCKET_NAME
    };

  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
}

/**
 * Check if S3 bucket exists and is accessible
 * @returns Promise<boolean> True if bucket is accessible
 */
export async function checkBucketAccess(): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('Development mode: Skipping S3 bucket check');
      return true;
    }

    // Dynamic import of AWS SDK
    const AWS = await import('aws-sdk');
    
    AWS.default.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const s3 = new AWS.default.S3();
    const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'shanmukha-generators-media';

    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log('S3 bucket is accessible:', BUCKET_NAME);
    return true;

  } catch (error) {
    console.error('S3 bucket not accessible:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}
