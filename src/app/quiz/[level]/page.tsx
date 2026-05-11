import { Suspense } from 'react';
import ClientShell from './ClientShell';

export function generateStaticParams() {
  // Matching the actual level IDs (1, 2, 3, 4, 5) from the quiz selection page
  return [
    { level: '1' }, 
    { level: '2' }, 
    { level: '3' }, 
    { level: '4' }, 
    { level: '5' },
    { level: 'mixed' }
  ];
}

export default function Page() { 
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-hidayah-primary flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-hidayah-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ClientShell />
    </Suspense>
  ); 
}
