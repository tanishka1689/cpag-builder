import type { NextRequest } from 'next/server';
import { getBaseUrl, jsonMetadataResponse, optionsResponse } from '@/lib/oauth/metadata';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * RFC 9728 — Protected Resource Metadata, scoped to the `/cpag/mcp` endpoint.
 *
 * This is the URL returned in the `WWW-Authenticate: Bearer resource_metadata=...`
 * header on 401 responses from the MCP endpoint.
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  return jsonMetadataResponse({
    resource: `${baseUrl}/cpag/mcp`,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ['header'],
    resource_documentation: 'https://github.com/cpag/cpag',
  });
}

export async function OPTIONS() {
  return optionsResponse();
}
