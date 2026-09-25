import CPAGLayoutClient from './cpagLayoutClient';

/**
 * CPAG Editor Layout (Server Component)
 * 
 * Forces dynamic rendering for all /cpag/* routes.
 * This is required because:
 * 1. Editor routes require authentication (user-specific)
 * 2. Client components use useSearchParams which needs dynamic context
 */

// Force all /cpag routes to be dynamic - no static prerendering
// This prevents useSearchParams errors during build
export const dynamic = 'force-dynamic';

export default function CPAGLayout({ children }: { children: React.ReactNode }) {
  return <CPAGLayoutClient>{children}</CPAGLayoutClient>;
}
