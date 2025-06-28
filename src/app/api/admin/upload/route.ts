import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'generators');

// Verify admin authentication
async function verifyAdmin(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return false;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}

// Generate unique filename
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  // Sanitize filename
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `${timestamp}_${randomString}_${sanitizedBaseName}${extension}`;
}

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Upload to S3 (if configured) or local storage
async function uploadFile(file: File, filename: string): Promise<string> {
  // Try S3 upload first if configured
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const { uploadToS3 } = await import('../../../../utils/s3Upload');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToS3(buffer, filename, file.type);
      return result.url;
    } catch (error) {
      console.warn('S3 upload failed, falling back to local storage:', error);
    }
  }

  // Fallback to local storage
  await ensureUploadDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(UPLOAD_DIR, filename);
  await writeFile(filePath, buffer);
  
  // Return public URL
  return `/uploads/generators/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access'
        },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided'
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.name);

    // Upload file
    const url = await uploadFile(file, filename);

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        size: file.size,
        mimetype: file.type,
        originalName: file.name
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
