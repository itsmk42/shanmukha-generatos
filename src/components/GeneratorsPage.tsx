'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import Header from './Header';
import Footer from './Footer';
import GeneratorCard from './GeneratorCard';
import FilterSidebar from './FilterSidebar';

interface Generator {
  _id: string;
  brand: string;
  model: string;
  price: number;
  hours_run: number;
  location_text: string;
  description: string;
  images: Array<{ url: string }>;
  createdAt: string;
  views?: number;
  seller_id: {
    whatsapp_id: string;
    display_name?: string;
  };
}

interface Filters {
  availableBrands: string[];
  priceRange: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
  };
  hoursRange: {
    minHours: number;
    maxHours: number;
    avgHours: number;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function GeneratorsPage() {
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [filters, setFilters] = useState<Filters>({
    availableBrands: [],
    priceRange: { minPrice: 0, maxPrice: 0, avgPrice: 0 },
    hoursRange: { minHours: 0, maxHours: 0, avgHours: 0 },
  });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();

  // Current filter values
  const currentFilters = {
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minHours: searchParams.get('minHours') || '',
    maxHours: searchParams.get('maxHours') || '',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  };

  useEffect(() => {
    setSearchQuery(currentFilters.search);
    fetchGenerators();
  }, [searchParams]);

  const fetchGenerators = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/generators?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setGenerators(data.data.generators);
        setFilters(data.data.filters);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching generators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    
    router.push(`/generators?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/generators?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/generators');
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'hours_asc', label: 'Hours: Low to High' },
    { value: 'hours_desc', label: 'Hours: High to Low' },
  ];

  const activeFiltersCount = Object.values(currentFilters).filter(value => 
    value && value !== 'newest' && value !== '1'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Used Generators for Sale
          </h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl">
              <input
                type="text"
                placeholder="Search by brand, model, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pr-12 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Filters and Sort Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={currentFilters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            {isLoading ? (
              'Loading...'
            ) : (
              `Showing ${generators.length} of ${pagination.totalCount} generators`
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              currentFilters={currentFilters}
              onFilterChange={updateFilters}
            />
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <FilterSidebar
                    filters={filters}
                    currentFilters={currentFilters}
                    onFilterChange={(newFilters) => {
                      updateFilters(newFilters);
                      setIsSidebarOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-300 h-4 rounded mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : generators.length > 0 ? (
              <>
                {/* Generators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {generators.map((generator) => (
                    <GeneratorCard key={generator._id} generator={generator} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrentPage = page === pagination.currentPage;
                      
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${
                              isCurrentPage
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === pagination.currentPage - 2 ||
                        page === pagination.currentPage + 2
                      ) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5-1.709M15 3H9a2 2 0 00-2 2v1.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 000 1.414l6.414 6.414a1 1 0 01.293.707V21a2 2 0 002 2h6a2 2 0 002-2v-1.586a1 1 0 01.293-.707l6.414-6.414a1 1 0 000-1.414L16.707 7.293A1 1 0 0116 6.586V5a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No generators found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters to find more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
