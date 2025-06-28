import { notFound } from 'next/navigation';
import GeneratorDetailPage from '@/components/GeneratorDetailPage';

interface PageProps {
  params: { id: string };
}

async function getGenerator(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/generators/${id}`, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching generator:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const data = await getGenerator(params.id);
  
  if (!data) {
    return {
      title: 'Generator Not Found - Shanmukha Generators',
    };
  }

  const { generator } = data;
  
  return {
    title: `${generator.brand} ${generator.model} - ₹${generator.price.toLocaleString('en-IN')} - Shanmukha Generators`,
    description: `${generator.brand} ${generator.model} generator for sale. ${generator.hours_run.toLocaleString()} hours running. Located in ${generator.location_text}. ${generator.description.substring(0, 150)}...`,
    openGraph: {
      title: `${generator.brand} ${generator.model} - Used Generator for Sale`,
      description: `₹${generator.price.toLocaleString('en-IN')} • ${generator.hours_run.toLocaleString()} hours • ${generator.location_text}`,
      images: generator.images.length > 0 ? [generator.images[0].url] : [],
    },
  };
}

export default async function GeneratorDetail({ params }: PageProps) {
  const data = await getGenerator(params.id);
  
  if (!data) {
    notFound();
  }
  
  return <GeneratorDetailPage data={data} />;
}
