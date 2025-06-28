import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Generator from '@/models/Generator';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'pending_review';
    const search = searchParams.get('search') || '';

    // Build filter object
    const filter: any = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Text search
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { location_text: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [generators, totalCount] = await Promise.all([
      Generator.find(filter)
        .populate('seller_id', 'whatsapp_id display_name total_listings successful_sales')
        .populate('audit_trail.approved_by', 'display_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Generator.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get status counts for dashboard
    const statusCounts = await Generator.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      pending_review: 0,
      for_sale: 0,
      sold: 0,
      rejected: 0,
      failed_parsing: 0
    };

    statusCounts.forEach(stat => {
      if (stat._id in statusStats) {
        statusStats[stat._id as keyof typeof statusStats] = stat.count;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        generators,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        statusStats,
        appliedFilters: {
          status,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin generators:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch generators',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
