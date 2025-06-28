'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Generator {
  _id: string;
  brand: string;
  model: string;
  price: number;
  hours_run: number;
  location_text: string;
  description: string;
  images: Array<{ url: string; filename?: string }>;
  status: string;
  seller_id: {
    whatsapp_id: string;
    display_name?: string;
  };
  audit_trail: {
    whatsapp_message_id: string;
    original_message_text?: string;
    parsing_errors?: string[];
  };
  createdAt: string;
}

interface StatusStats {
  pending_review: number;
  for_sale: number;
  sold: number;
  rejected: number;
  failed_parsing: number;
}

export default function AdminDashboard() {
  const [generators, setGenerators] = useState<Generator[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats>({
    pending_review: 0,
    for_sale: 0,
    sold: 0,
    rejected: 0,
    failed_parsing: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending_review');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchGenerators();
  }, [selectedStatus]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      
      if (!data.success) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const fetchGenerators = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/generators?status=${selectedStatus}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setGenerators(data.data.generators);
        setStatusStats(data.data.statusStats);
      }
    } catch (error) {
      console.error('Error fetching generators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/generators/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          approved_by: 'admin', // In a real app, this would be the admin user ID
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from current list if we're viewing pending_review
        if (selectedStatus === 'pending_review') {
          setGenerators(generators.filter(g => g._id !== id));
        }
        // Refresh stats
        fetchGenerators();
      } else {
        alert('Error approving generator: ' + data.error);
      }
    } catch (error) {
      alert('Error approving generator');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    
    setProcessingId(id);
    try {
      const response = await fetch(`/api/generators/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          reason: reason || 'No reason provided',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from current list if we're viewing pending_review
        if (selectedStatus === 'pending_review') {
          setGenerators(generators.filter(g => g._id !== id));
        }
        // Refresh stats
        fetchGenerators();
      } else {
        alert('Error rejecting generator: ' + data.error);
      }
    } catch (error) {
      alert('Error rejecting generator');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Shanmukha Generators</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/add-generator')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Generator</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusStats.pending_review}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">For Sale</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusStats.for_sale}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sold</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusStats.sold}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusStats.rejected}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed Parsing</dt>
                    <dd className="text-lg font-medium text-gray-900">{statusStats.failed_parsing}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/admin/add-generator')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Generator Manually</span>
            </button>
            <button
              onClick={() => setSelectedStatus('pending_review')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Review Pending ({statusStats.pending_review})
            </button>
            <button
              onClick={() => setSelectedStatus('failed_parsing')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Fix Failed Parsing ({statusStats.failed_parsing})
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="pending_review">Pending Review</option>
            <option value="for_sale">For Sale</option>
            <option value="sold">Sold</option>
            <option value="rejected">Rejected</option>
            <option value="failed_parsing">Failed Parsing</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Generators List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading generators...</p>
          </div>
        ) : generators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No generators found for the selected status.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {generators.map((generator) => (
                <li key={generator._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        {generator.images.length > 0 && (
                          <img
                            src={generator.images[0].url}
                            alt={`${generator.brand} ${generator.model}`}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {generator.brand} {generator.model}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatPrice(generator.price)} • {generator.hours_run.toLocaleString()} hours • {generator.location_text}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Seller: {generator.seller_id.display_name || generator.seller_id.whatsapp_id}
                          </p>
                          <p className="text-xs text-gray-400">
                            Listed: {formatDate(generator.createdAt)}
                          </p>
                          {generator.audit_trail.parsing_errors && generator.audit_trail.parsing_errors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-red-600">Parsing Errors:</p>
                              <ul className="text-xs text-red-500 list-disc list-inside">
                                {generator.audit_trail.parsing_errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedStatus === 'pending_review' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(generator._id)}
                          disabled={processingId === generator._id}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                        >
                          {processingId === generator._id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(generator._id)}
                          disabled={processingId === generator._id}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                        >
                          {processingId === generator._id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    )}
                    
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        generator.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                        generator.status === 'for_sale' ? 'bg-green-100 text-green-800' :
                        generator.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                        generator.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {generator.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
