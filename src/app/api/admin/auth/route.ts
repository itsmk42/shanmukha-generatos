import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required'
        },
        { status: 400 }
      );
    }

    // In a real application, you would hash the admin password and store it securely
    // For this demo, we're doing a simple comparison
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password'
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        role: 'admin',
        timestamp: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        role: 'admin',
        expiresIn: '24h'
      }
    });

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Error in admin authentication:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token found'
        },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      return NextResponse.json({
        success: true,
        data: {
          role: decoded.role,
          authenticated: true
        }
      });

    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token'
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error verifying admin authentication:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication verification failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the authentication cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Error in admin logout:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
