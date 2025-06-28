'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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

interface CurrentFilters {
  search: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  minHours: string;
  maxHours: string;
  location: string;
  sortBy: string;
  page: number;
}

interface FilterSidebarProps {
  filters: Filters;
  currentFilters: CurrentFilters;
  onFilterChange: (filters: Record<string, string>) => void;
}

export default function FilterSidebar({ filters, currentFilters, onFilterChange }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    price: true,
    hours: true,
    location: true,
  });

  const [localFilters, setLocalFilters] = useState({
    brand: currentFilters.brand,
    minPrice: currentFilters.minPrice,
    maxPrice: currentFilters.maxPrice,
    minHours: currentFilters.minHours,
    maxHours: currentFilters.maxHours,
    location: currentFilters.location,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value) : '';
    if (type === 'min') {
      handleFilterChange('minPrice', numValue.toString());
    } else {
      handleFilterChange('maxPrice', numValue.toString());
    }
  };

  const handleHoursChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value) : '';
    if (type === 'min') {
      handleFilterChange('minHours', numValue.toString());
    } else {
      handleFilterChange('maxHours', numValue.toString());
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
    return `₹${price}`;
  };

  const formatHours = (hours: number) => {
    if (hours >= 1000) return `${(hours / 1000).toFixed(1)}K hrs`;
    return `${hours} hrs`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Filters</h3>

      {/* Brand Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('brand')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="text-sm font-medium text-gray-900">Brand</h4>
          {expandedSections.brand ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.brand && (
          <div className="mt-3 space-y-2">
            <div>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="brand"
                  value=""
                  checked={!localFilters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">All Brands</span>
              </label>
            </div>
            {filters.availableBrands.map((brand) => (
              <div key={brand}>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="brand"
                    value={brand}
                    checked={localFilters.brand === brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{brand}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="text-sm font-medium text-gray-900">Price Range</h4>
          {expandedSections.price ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="mt-3">
            {filters.priceRange.maxPrice > 0 && (
              <div className="text-xs text-gray-500 mb-3">
                Range: {formatPrice(filters.priceRange.minPrice)} - {formatPrice(filters.priceRange.maxPrice)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Quick Price Filters */}
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  handleFilterChange('minPrice', '');
                  handleFilterChange('maxPrice', '500000');
                }}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1"
              >
                Under ₹5L
              </button>
              <button
                onClick={() => {
                  handleFilterChange('minPrice', '500000');
                  handleFilterChange('maxPrice', '1500000');
                }}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1"
              >
                ₹5L - ₹15L
              </button>
              <button
                onClick={() => {
                  handleFilterChange('minPrice', '1500000');
                  handleFilterChange('maxPrice', '');
                }}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1"
              >
                Above ₹15L
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hours Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('hours')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="text-sm font-medium text-gray-900">Running Hours</h4>
          {expandedSections.hours ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.hours && (
          <div className="mt-3">
            {filters.hoursRange.maxHours > 0 && (
              <div className="text-xs text-gray-500 mb-3">
                Range: {formatHours(filters.hoursRange.minHours)} - {formatHours(filters.hoursRange.maxHours)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Hours</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minHours}
                  onChange={(e) => handleHoursChange('min', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Hours</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxHours}
                  onChange={(e) => handleHoursChange('max', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Quick Hours Filters */}
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  handleFilterChange('minHours', '');
                  handleFilterChange('maxHours', '5000');
                }}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1"
              >
                Under 5K hours
              </button>
              <button
                onClick={() => {
                  handleFilterChange('minHours', '5000');
                  handleFilterChange('maxHours', '15000');
                }}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1"
              >
                5K - 15K hours
              </button>
              <button
                onClick={() => {
                  handleFilterChange('minHours', '15000');
                  handleFilterChange('maxHours', '');
                }}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 py-1"
              >
                Above 15K hours
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('location')}
          className="flex justify-between items-center w-full text-left"
        >
          <h4 className="text-sm font-medium text-gray-900">Location</h4>
          {expandedSections.location ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {expandedSections.location && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Enter city or state..."
              value={localFilters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
