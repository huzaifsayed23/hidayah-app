import ClientShell from './ClientShell';

export function generateStaticParams() {
  return [{ username: 'index' }];
}

export default function Page() { 
  return <ClientShell />; 
}
