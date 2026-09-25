'use client';

import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import CPAGBuilder from './components/cpagBuilderMain';
import { useEditorUrl } from '@/hooks/use-editor-url';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  startLockExpirationCheck,
  stopLockExpirationCheck,
  startNotificationCleanup,
  stopNotificationCleanup,
} from '@/stores/useCollaborationPresenceStore';

/**
 * CPAG Editor Layout (Client Component)
 *
 * This layout wraps all /cpag routes and renders CPAGBuilder once.
 * By keeping CPAGBuilder at the layout level, it persists across route changes,
 * preventing remounts and avoiding duplicate API calls on navigation.
 *
 * Routes:
 * - /cpag - Base editor
 * - /cpag/pages/[id] - Page editing
 * - /cpag/layers/[id] - Layer editing
 * - /cpag/collections/[id] - Collection management
 * - /cpag/components/[id] - Component editing
 * - /cpag/settings - Settings pages
 * - /cpag/localization - Localization pages
 * - /cpag/profile - Profile pages
 *
 * Excluded routes:
 * - /cpag/preview - Preview routes are excluded and render independently
 *
 * CPAGBuilder uses useEditorUrl() to detect route changes and update
 * the UI accordingly without remounting.
 */

// Inner component that uses useSearchParams (via useEditorUrl)
function CPAGLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { routeType } = useEditorUrl();
  const { initialize } = useAuthStore();

  // Initialize auth only within /cpag routes (not on public pages)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Reap expired collaboration locks and stale notifications for the lifetime
  // of the editor session. Both stores are global, so a single mount here
  // covers every builder route.
  useEffect(() => {
    startLockExpirationCheck();
    startNotificationCleanup();
    return () => {
      stopLockExpirationCheck();
      stopNotificationCleanup();
    };
  }, []);

  // Exclude standalone routes from CPAGBuilder
  // These routes should render independently without the editor UI
  const prefixRoutes = ['/cpag/preview', '/cpag/devtools/', '/cpag/oauth/'];
  const exactRoutes = ['/cpag/welcome', '/cpag/accept-invite'];

  if (
    prefixRoutes.some(route => pathname?.startsWith(route))
    || exactRoutes.includes(pathname || '')
  ) {
    return <>{children}</>;
  }

  // For settings, localization, profile, forms, and integrations routes, pass children to CPAGBuilder so it can render them
  if (routeType === 'settings' || routeType === 'localization' || routeType === 'profile' || routeType === 'forms' || routeType === 'integrations') {
    return <CPAGBuilder>{children}</CPAGBuilder>;
  }

  // CPAGBuilder handles all rendering based on URL
  // Children are ignored - routes are just for URL structure
  return <CPAGBuilder />;
}

// Client layout wrapped in Suspense to handle useSearchParams
// Required by Next.js 14+ to prevent static rendering bailout
export default function CPAGLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CPAGLayoutInner>{children}</CPAGLayoutInner>
    </Suspense>
  );
}
