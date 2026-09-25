'use client';

import CPAGBuilder from '../components/cpagBuilderMain';

/**
 * Base route for collections view
 * URL: /cpag/collections
 *
 * This route renders the same CPAGBuilder component.
 * Shows all collections or empty state when no collections exist.
 */
export default function CollectionsRoute() {
  return <CPAGBuilder />;
}
