import ClientShell from './ClientShell';

export function generateStaticParams() {
  return [{ id: 'index' }];
}

export default function Page() { 
  return <ClientShell />; 
}
