'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, BoltIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
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
  images: Array<{ url: string }>;
  createdAt: string;
  seller_id: {
    whatsapp_id: string;
    display_name?: string;
  };
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentGenerators, setRecentGenerators] = useState<Generator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchRecentGenerators();
  }, []);

  const fetchRecentGenerators = async () => {
    try {
      const response = await fetch('/api/generators?limit=8&sortBy=newest');
      const data = await response.json();
      
      if (data.success) {
        setRecentGenerators(data.data.generators);
      }
    } catch (error) {
      console.error('Error fetching recent generators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/generators?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/generators');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Quality Used Generators
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Browse our catalog of diesel generators, gensets, and power equipment from trusted sellers
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by brand, model, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 text-lg text-gray-900 bg-white rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 pr-16"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
              </div>
            </form>
            
            <div className="mt-8">
              <Link
                href="/generators"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse All Generators
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Shanmukha Generators?
            </h2>
            <p className="text-lg text-gray-600">
              Your trusted marketplace for quality used generators
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BoltIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assured</h3>
              <p className="text-gray-600">
                All generators are verified and come with detailed specifications and running hours
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Listings are automatically updated from WhatsApp messages for the latest availability
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Local Sellers</h3>
              <p className="text-gray-600">
                Connect directly with sellers in your area through WhatsApp for easy communication
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Added Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Recently Added Generators
              </h2>
              <p className="text-gray-600">
                Latest listings from our trusted sellers
              </p>
            </div>
            <Link
              href="/generators"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentGenerators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentGenerators.map((generator) => (
                <GeneratorCard key={generator._id} generator={generator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No generators available at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Have a Generator to Sell?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our WhatsApp group to list your generator and reach thousands of potential buyers
          </p>
          <a
            href="https://wa.me/919876543210?text=Hi, I want to join the Shanmukha Generators WhatsApp group to sell my generator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Join WhatsApp Group
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
