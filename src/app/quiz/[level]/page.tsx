import ClientShell from './ClientShell';

export function generateStaticParams() {
  return [{ level: 'beginner' }, { level: 'intermediate' }, { level: 'advanced' }];
}

export default function Page() { 
  return <ClientShell />; 
}
