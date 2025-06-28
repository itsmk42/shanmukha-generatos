import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Generator from '@/models/Generator';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    await connectDB();

    const body = await request.json();
    const {
      brand,
      model,
      price,
      hours_run,
      location_text,
      description,
      seller_whatsapp_id,
      seller_display_name,
      images = []
    } = body;

    // Validate required fields
    if (!brand || !model || !price || hours_run === undefined || !location_text || !description || !seller_whatsapp_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Price must be a positive number'
        },
        { status: 400 }
      );
    }

    if (typeof hours_run !== 'number' || hours_run < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hours run must be a non-negative number'
        },
        { status: 400 }
      );
    }

    // Validate WhatsApp ID format
    if (!/^\d{10,15}$/.test(seller_whatsapp_id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid WhatsApp ID format'
        },
        { status: 400 }
      );
    }

    // Find or create seller
    let seller = await User.findOne({ whatsapp_id: seller_whatsapp_id });
    
    if (!seller) {
      seller = new User({
        whatsapp_id: seller_whatsapp_id,
        display_name: seller_display_name || `Seller ${seller_whatsapp_id.slice(-4)}`,
        role: 'seller'
      });
      await seller.save();
    } else if (seller_display_name && !seller.display_name) {
      seller.display_name = seller_display_name;
      await seller.save();
    }

    // Process images
    const processedImages = images.map((img: any, index: number) => {
      if (typeof img === 'string') {
        return {
          url: img,
          filename: `manual_upload_${Date.now()}_${index}`,
          size: 0,
          mimetype: 'image/jpeg'
        };
      } else if (img && img.url) {
        return {
          url: img.url,
          filename: img.filename || `manual_upload_${Date.now()}_${index}`,
          size: img.size || 0,
          mimetype: img.mimetype || 'image/jpeg'
        };
      }
      return null;
    }).filter(Boolean);

    // Create generator
    const generator = new Generator({
      brand: brand.trim(),
      model: model.trim(),
      price: price,
      hours_run: hours_run,
      location_text: location_text.trim(),
      description: description.trim(),
      images: processedImages,
      seller_id: seller._id,
      status: 'for_sale', // Manually added generators go directly to for_sale
      audit_trail: {
        whatsapp_message_id: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        original_message_text: `Manually added by admin: ${brand} ${model}`,
        parsed_at: new Date(),
        parsing_errors: [],
        approved_by: seller._id, // Using seller ID as placeholder for admin
        approved_at: new Date()
      }
    });

    await generator.save();

    // Update seller's listing count
    seller.total_listings += 1;
    await seller.save();

    // Populate seller information for response
    await generator.populate('seller_id', 'whatsapp_id display_name total_listings successful_sales');

    return NextResponse.json({
      success: true,
      data: {
        generator,
        message: 'Generator added successfully'
      }
    });

  } catch (error) {
    console.error('Error creating manual generator:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create generator',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
