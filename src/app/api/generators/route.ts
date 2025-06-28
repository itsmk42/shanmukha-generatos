import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Generator from '@/models/Generator';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minHours = searchParams.get('minHours');
    const maxHours = searchParams.get('maxHours');
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter object
    const filter: any = {
      status: 'for_sale'
    };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Brand filter
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Hours range filter
    if (minHours || maxHours) {
      filter.hours_run = {};
      if (minHours) filter.hours_run.$gte = parseInt(minHours);
      if (maxHours) filter.hours_run.$lte = parseInt(maxHours);
    }

    // Location filter
    if (location) {
      filter.location_text = { $regex: location, $options: 'i' };
    }

    // Build sort object
    const sort: any = {};
    switch (sortBy) {
      case 'price_asc':
        sort.price = 1;
        break;
      case 'price_desc':
        sort.price = -1;
        break;
      case 'hours_asc':
        sort.hours_run = 1;
        break;
      case 'hours_desc':
        sort.hours_run = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      default:
        sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [generators, totalCount] = await Promise.all([
      Generator.find(filter)
        .populate('seller_id', 'whatsapp_id display_name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Generator.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get available brands for filtering
    const availableBrands = await Generator.distinct('brand', { status: 'for_sale' });

    // Get price range
    const priceStats = await Generator.aggregate([
      { $match: { status: 'for_sale' } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    // Get hours range
    const hoursStats = await Generator.aggregate([
      { $match: { status: 'for_sale' } },
      {
        $group: {
          _id: null,
          minHours: { $min: '$hours_run' },
          maxHours: { $max: '$hours_run' },
          avgHours: { $avg: '$hours_run' }
        }
      }
    ]);

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
        filters: {
          availableBrands: availableBrands.sort(),
          priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
          hoursRange: hoursStats[0] || { minHours: 0, maxHours: 0, avgHours: 0 }
        },
        appliedFilters: {
          search,
          brand,
          minPrice,
          maxPrice,
          minHours,
          maxHours,
          location,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Error fetching generators:', error);
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
