// File upload utilities and validation

export interface UploadedFile {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};

// File size limits (Vercel Blob limits)
export const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB per file (Vercel Blob limit)
export const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total
export const MAX_FILES = 10;

/**
 * Validate a single file
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type. Please use: ${Object.values(SUPPORTED_FILE_TYPES).flat().join(', ')}`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  // Check file extension matches MIME type
  const allowedExtensions = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'File extension does not match file type'
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): FileValidationResult {
  // Check number of files
  if (files.length > MAX_FILES) {
    return {
      isValid: false,
      error: `Too many files. Maximum is ${MAX_FILES} files`
    };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      isValid: false,
      error: `Total file size too large. Maximum is ${formatFileSize(MAX_TOTAL_SIZE)}`
    };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Create a preview URL for an image file
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Generate a unique file ID
 */
export function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Upload a single file to the server
 */
export async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve(response.data.url);
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('POST', '/api/admin/upload');
    xhr.send(formData);
  });
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadFiles(
  files: UploadedFile[],
  onProgress: (fileId: string, progress: number) => void,
  onComplete: (fileId: string, url: string) => void,
  onError: (fileId: string, error: string) => void
): Promise<void> {
  const uploadPromises = files.map(async (uploadedFile) => {
    try {
      const url = await uploadFile(uploadedFile.file, (progress) => {
        onProgress(uploadedFile.id, progress);
      });
      onComplete(uploadedFile.id, url);
    } catch (error) {
      onError(uploadedFile.id, error instanceof Error ? error.message : 'Upload failed');
    }
  });

  await Promise.all(uploadPromises);
}

/**
 * Clean up preview URLs to prevent memory leaks
 */
export function cleanupPreviews(files: UploadedFile[]): void {
  files.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
  });
}
