'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ClockIcon,
  MapPinIcon,
  EyeIcon,
  PhoneIcon,
  ShareIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Header from './Header';
import Footer from './Footer';
import GeneratorCard from './GeneratorCard';

interface Generator {
  _id: string;
  brand: string;
  model: string;
  price: number;
  hours_run: number;
  location_text: string;
  description: string;
  images: Array<{ url: string; filename?: string }>;
  createdAt: string;
  views: number;
  whatsapp_clicks: number;
  seller_id: {
    _id: string;
    whatsapp_id: string;
    display_name?: string;
    total_listings: number;
    successful_sales: number;
  };
}

interface GeneratorDetailPageProps {
  data: {
    generator: Generator;
    related: Generator[];
    sellerOtherListings: Generator[];
  };
}

export default function GeneratorDetailPage({ data }: GeneratorDetailPageProps) {
  const { generator, related, sellerOtherListings } = data;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleWhatsAppClick = async () => {
    try {
      // Track the WhatsApp click
      await fetch(`/api/generators/${generator._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'whatsapp_click' }),
      });
    } catch (error) {
      console.error('Error tracking WhatsApp click:', error);
    }

    // Open WhatsApp
    const message = `Hi, I saw your ${generator.brand} ${generator.model} listing on ShanmukhaGenerators.com. Is it still available?`;
    const whatsappUrl = `https://wa.me/${generator.seller_id.whatsapp_id}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${generator.brand} ${generator.model}`,
        text: `Check out this ${generator.brand} ${generator.model} generator for ${formatPrice(generator.price)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsShareOpen(true);
      setTimeout(() => setIsShareOpen(false), 2000);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === generator.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? generator.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/generators" className="hover:text-blue-600">Generators</Link></li>
            <li>/</li>
            <li className="text-gray-900">{generator.brand} {generator.model}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {generator.images.length > 0 ? (
                <div className="relative">
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                    <Image
                      src={generator.images[currentImageIndex].url}
                      alt={`${generator.brand} ${generator.model} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  </div>
                  
                  {generator.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                      
                      {/* Image indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {generator.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-w-16 aspect-h-12 bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No images available</p>
                  </div>
                </div>
              )}
              
              {/* Thumbnail strip */}
              {generator.images.length > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto">
                    {generator.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex ? 'border-blue-600' : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={`Thumbnail ${index + 1}`}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generator Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {generator.brand} {generator.model}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      <span>{generator.views} views</span>
                    </div>
                    <div>Listed on {formatDate(generator.createdAt)}</div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {isFavorited ? (
                      <HeartSolidIcon className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors relative"
                  >
                    <ShareIcon className="h-6 w-6" />
                    {isShareOpen && (
                      <div className="absolute top-full right-0 mt-2 bg-black text-white text-xs px-2 py-1 rounded">
                        Link copied!
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatPrice(generator.price)}
                  </div>
                  <div className="text-sm text-gray-600">Price</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {generator.hours_run.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Running Hours</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 mb-1 truncate">
                    {generator.location_text}
                  </div>
                  <div className="text-sm text-gray-600">Location</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {generator.description}
                </p>
              </div>
            </div>

            {/* Location Map Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">{generator.location_text}</p>
                  <p className="text-sm">Map integration coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Seller */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Seller</h3>
              
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Seller</div>
                <div className="font-medium">
                  {generator.seller_id.display_name || `Seller ${generator.seller_id.whatsapp_id.slice(-4)}`}
                </div>
                <div className="text-sm text-gray-500">
                  {generator.seller_id.total_listings} listings • {generator.seller_id.successful_sales} sold
                </div>
              </div>

              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <PhoneIcon className="h-5 w-5" />
                <span>Contact on WhatsApp</span>
              </button>
              
              <div className="mt-3 text-xs text-gray-500 text-center">
                {generator.whatsapp_clicks} people contacted this seller
              </div>
            </div>

            {/* Seller's Other Listings */}
            {sellerOtherListings.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  More from this seller
                </h3>
                <div className="space-y-4">
                  {sellerOtherListings.slice(0, 3).map((listing) => (
                    <Link key={listing._id} href={`/generators/${listing._id}`}>
                      <div className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        {listing.images.length > 0 ? (
                          <Image
                            src={listing.images[0].url}
                            alt={`${listing.brand} ${listing.model}`}
                            width={60}
                            height={60}
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-400">No img</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {listing.brand} {listing.model}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            {formatPrice(listing.price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {listing.hours_run.toLocaleString()} hrs
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Generators */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Similar {generator.brand} Generators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((relatedGenerator) => (
                <GeneratorCard key={relatedGenerator._id} generator={relatedGenerator} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
