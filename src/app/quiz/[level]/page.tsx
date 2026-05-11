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
  return <ClientShell />; 
}
