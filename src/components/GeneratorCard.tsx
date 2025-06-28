import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon, MapPinIcon, EyeIcon } from '@heroicons/react/24/outline';

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

interface GeneratorCardProps {
  generator: Generator;
}

export default function GeneratorCard({ generator }: GeneratorCardProps) {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatHours = (hours: number) => {
    return `${hours.toLocaleString()} hrs`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link href={`/generators/${generator._id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          {generator.images && generator.images.length > 0 ? (
            <Image
              src={generator.images[0].url}
              alt={`${generator.brand} ${generator.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-center">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {formatPrice(generator.price)}
            </span>
          </div>
          
          {/* Views Badge */}
          {generator.views !== undefined && generator.views > 0 && (
            <div className="absolute top-3 right-3">
              <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                <EyeIcon className="h-3 w-3" />
                <span>{generator.views}</span>
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {generator.brand} {generator.model}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncateDescription(generator.description)}
          </p>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>{formatHours(generator.hours_run)} running</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4 mr-2" />
              <span className="truncate">{generator.location_text}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              Listed {formatDate(generator.createdAt)}
            </div>
            
            <div className="text-xs text-gray-500">
              By {generator.seller_id.display_name || `Seller ${generator.seller_id.whatsapp_id.slice(-4)}`}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
