import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Generator from '@/models/Generator';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid generator ID format'
        },
        { status: 400 }
      );
    }

    // Find the generator
    const generator = await Generator.findById(id)
      .populate('seller_id', 'whatsapp_id display_name total_listings successful_sales')
      .lean();

    if (!generator) {
      return NextResponse.json(
        {
          success: false,
          error: 'Generator not found'
        },
        { status: 404 }
      );
    }

    // Only return generators that are for sale (public endpoint)
    if (generator.status !== 'for_sale') {
      return NextResponse.json(
        {
          success: false,
          error: 'Generator not available'
        },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget)
    Generator.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec().catch(console.error);

    // Get related generators (same brand, different model)
    const relatedGenerators = await Generator.find({
      _id: { $ne: id },
      brand: generator.brand,
      status: 'for_sale'
    })
      .limit(4)
      .select('brand model price hours_run location_text images createdAt')
      .lean();

    // Get seller's other listings
    const sellerOtherListings = await Generator.find({
      _id: { $ne: id },
      seller_id: generator.seller_id,
      status: 'for_sale'
    })
      .limit(3)
      .select('brand model price hours_run location_text images createdAt')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        generator,
        related: relatedGenerators,
        sellerOtherListings
      }
    });

  } catch (error) {
    console.error('Error fetching generator:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch generator',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid generator ID format'
        },
        { status: 400 }
      );
    }

    // This endpoint is for admin operations (approve/reject)
    const { action, reason, approved_by } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"'
        },
        { status: 400 }
      );
    }

    const generator = await Generator.findById(id);

    if (!generator) {
      return NextResponse.json(
        {
          success: false,
          error: 'Generator not found'
        },
        { status: 404 }
      );
    }

    if (generator.status !== 'pending_review') {
      return NextResponse.json(
        {
          success: false,
          error: 'Generator is not pending review'
        },
        { status: 400 }
      );
    }

    // Update generator status
    if (action === 'approve') {
      generator.status = 'for_sale';
      generator.audit_trail.approved_by = approved_by;
      generator.audit_trail.approved_at = new Date();
    } else {
      generator.status = 'rejected';
      generator.audit_trail.rejected_reason = reason || 'No reason provided';
    }

    await generator.save();

    return NextResponse.json({
      success: true,
      data: {
        generator,
        message: `Generator ${action}d successfully`
      }
    });

  } catch (error) {
    console.error('Error updating generator:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update generator',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Track WhatsApp clicks
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'whatsapp_click') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action'
        },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid generator ID format'
        },
        { status: 400 }
      );
    }

    // Increment WhatsApp click count
    const generator = await Generator.findByIdAndUpdate(
      id,
      { $inc: { whatsapp_clicks: 1 } },
      { new: true }
    ).select('whatsapp_clicks');

    if (!generator) {
      return NextResponse.json(
        {
          success: false,
          error: 'Generator not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        whatsapp_clicks: generator.whatsapp_clicks
      }
    });

  } catch (error) {
    console.error('Error tracking WhatsApp click:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track click',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
