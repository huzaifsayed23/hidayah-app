import ClientShell from './ClientShell';

export function generateStaticParams() {
  // Return a single placeholder so Next.js generates the shell at build time.
  // The real ID is read client-side via useParams().
  return [{ id: 'index' }];
}

export default function Page() {
  return <ClientShell />;
}
