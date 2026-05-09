'use client';

import { useEffect, useState } from 'react';

/**
 * MountedGuard ensures that the children are only rendered on the client side
 * after the initial hydration is complete. This prevents hydration mismatches
 * and helps stabilize routing in Capacitor-based mobile apps.
 */
export default function MountedGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden', height: 0, overflow: 'hidden' }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
