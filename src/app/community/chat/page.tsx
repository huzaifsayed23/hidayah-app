import { Suspense } from 'react';
import ClientShell from './ClientShell';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-hidayah-primary)]" />}>
      <ClientShell />
    </Suspense>
  );
}
