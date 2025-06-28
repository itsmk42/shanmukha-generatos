import { Suspense } from 'react';
import GeneratorsPage from '@/components/GeneratorsPage';

export const metadata = {
  title: 'Used Generators for Sale - Shanmukha Generators',
  description: 'Browse our extensive catalog of quality used generators from trusted sellers. Find diesel generators, gensets, and power equipment with detailed specifications.',
};

function GeneratorsPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading generators...</div>}>
      <GeneratorsPage />
    </Suspense>
  );
}

export default function Generators() {
  return <GeneratorsPageWithSuspense />;
}
