import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { uploadBufferToVercelBlob, validateFileForBlob } from '@/utils/vercelBlobUpload';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// File upload configuration
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (Vercel Blob limit)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

// Upload to Vercel Blob
async function uploadFile(file: File): Promise<string> {
  console.log('Starting Vercel Blob upload:', file.name, 'Size:', file.size, 'Type:', file.type);

  // Validate file before upload
  const validation = validateFileForBlob(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Vercel Blob
  const result = await uploadBufferToVercelBlob(buffer, file.name, file.type);

  if (result.error) {
    throw new Error(result.error);
  }

  console.log('Vercel Blob upload successful:', result.url);
  return result.url;
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

    // Upload file to Vercel Blob
    const url = await uploadFile(file);

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
