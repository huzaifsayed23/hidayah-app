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

    let backButtonListener: any = null;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backButtonListener = await App.addListener('backButton', () => {
          const pathname = window.location.pathname;
          
          // Pages where pressing native back should exit the app
          const rootPages = ['/', '/community', '/dashboard', '/auth', '/onboarding', '/agreement'];
          
          if (rootPages.includes(pathname)) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch (e) {
        // Safe to ignore if not running inside native mobile webview
        console.log('Capacitor App back button handler not enabled:', e);
      }
    };

    setupBackButton();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
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
