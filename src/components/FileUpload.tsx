'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  UploadedFile,
  validateFiles,
  createFilePreview,
  generateFileId,
  formatFileSize,
  cleanupPreviews,
  uploadFile,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
} from '@/utils/fileUpload';

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  existingFiles?: UploadedFile[];
}

export default function FileUpload({
  onFilesChange,
  maxFiles = MAX_FILES,
  disabled = false,
  existingFiles = [],
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [error, setError] = useState<string>('');

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviews(uploadedFiles);
    };
  }, []);

  // Update parent when files change
  useEffect(() => {
    onFilesChange(uploadedFiles);
  }, [uploadedFiles, onFilesChange]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');

    // Check if adding these files would exceed the limit
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      setError(`Cannot add more than ${maxFiles} files`);
      return;
    }

    // Validate files
    const validation = validateFiles(acceptedFiles);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid files');
      return;
    }

    // Create uploaded file objects
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: generateFileId(),
      preview: createFilePreview(file),
      progress: 0,
      status: 'pending',
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Automatically start uploading the new files
    uploadNewFiles(newFiles);
  }, [uploadedFiles.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const retryUpload = async (fileId: string) => {
    const fileToRetry = uploadedFiles.find(f => f.id === fileId);
    if (!fileToRetry) return;

    try {
      // Reset status to uploading
      updateFileStatus(fileId, 'uploading');
      updateFileProgress(fileId, 0);

      // Upload the file
      const url = await uploadFile(fileToRetry.file, (progress) => {
        updateFileProgress(fileId, progress);
      });

      // Set status to success with URL
      updateFileStatus(fileId, 'success', url);
    } catch (error) {
      // Set status to error
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateFileStatus(fileId, 'error', undefined, errorMessage);
    }
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, progress, status: 'uploading' } : file
      )
    );
  };

  const updateFileStatus = (fileId: string, status: UploadedFile['status'], url?: string, error?: string) => {
    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, status, url, error } : file
      )
    );
  };

  // Function to upload new files automatically
  const uploadNewFiles = async (filesToUpload: UploadedFile[]) => {
    for (const fileObj of filesToUpload) {
      try {
        // Set status to uploading
        updateFileStatus(fileObj.id, 'uploading');

        // Upload the file
        const url = await uploadFile(fileObj.file, (progress) => {
          updateFileProgress(fileObj.id, progress);
        });

        // Set status to success with URL
        updateFileStatus(fileObj.id, 'success', url);
      } catch (error) {
        // Set status to error
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateFileStatus(fileObj.id, 'error', undefined, errorMessage);
      }
    }
  };

  const getStatusIcon = (file: UploadedFile) => {
    switch (file.status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <PhotoIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 font-medium mb-2">
              {disabled ? 'File upload disabled' : 'Drag & drop images here, or click to select'}
            </p>
            <p className="text-sm text-gray-500">
              Supports: JPEG, PNG, GIF, WebP • Max {formatFileSize(MAX_FILE_SIZE)} per file • Up to {maxFiles} files
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Files ({uploadedFiles.length}/{maxFiles})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="relative bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                  disabled={file.status === 'uploading'}
                >
                  <XMarkIcon className="h-4 w-4 text-red-600" />
                </button>

                {/* Image Preview */}
                <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file)}
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)}
                  </div>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message with Retry Button */}
                  {file.status === 'error' && (
                    <div className="space-y-1">
                      <p className="text-xs text-red-600">{file.error}</p>
                      <button
                        type="button"
                        onClick={() => retryUpload(file.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Retry upload
                      </button>
                    </div>
                  )}

                  {/* Success Message */}
                  {file.status === 'success' && (
                    <p className="text-xs text-green-600">Upload complete</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="text-sm text-gray-600">
          Total size: {formatFileSize(uploadedFiles.reduce((sum, file) => sum + file.file.size, 0))}
        </div>
      )}
    </div>
  );
}
