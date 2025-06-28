const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'shanmukha-generators-media';

/**
 * Upload file buffer to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - File name
 * @param {string} mimetype - MIME type
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadToS3 = async (buffer, filename, mimetype) => {
  try {
    // For development/testing, return a placeholder URL
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('Development mode: Using placeholder image URL');
      return {
        url: `https://via.placeholder.com/400x300/cccccc/666666?text=Generator+Image`,
        key: `dev/${filename}`,
        bucket: BUCKET_NAME
      };
    }

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
      bucket: BUCKET_NAME,
      error: error.message
    };
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} Delete result
 */
const deleteFromS3 = async (key) => {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('Development mode: Skipping S3 delete');
      return { success: true, message: 'Development mode - no actual delete' };
    }

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
};

/**
 * Generate presigned URL for temporary access
 * @param {string} key - S3 object key
 * @param {number} expires - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Presigned URL
 */
const getPresignedUrl = async (key, expires = 3600) => {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      return `https://via.placeholder.com/400x300/cccccc/666666?text=Dev+Mode`;
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expires
    };

    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

/**
 * List objects in S3 bucket with prefix
 * @param {string} prefix - Object key prefix
 * @param {number} maxKeys - Maximum number of keys to return
 * @returns {Promise<Array>} List of objects
 */
const listObjects = async (prefix = '', maxKeys = 1000) => {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      return [];
    }

    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys
    };

    const result = await s3.listObjectsV2(params).promise();
    return result.Contents || [];

  } catch (error) {
    console.error('Error listing S3 objects:', error);
    throw error;
  }
};

/**
 * Check if S3 bucket exists and is accessible
 * @returns {Promise<boolean>} True if bucket is accessible
 */
const checkBucketAccess = async () => {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
      console.log('Development mode: Skipping S3 bucket check');
      return true;
    }

    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log('S3 bucket is accessible:', BUCKET_NAME);
    return true;

  } catch (error) {
    console.error('S3 bucket not accessible:', error.message);
    return false;
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  listObjects,
  checkBucketAccess,
  BUCKET_NAME
};
