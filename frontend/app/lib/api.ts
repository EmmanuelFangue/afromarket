import { SearchRequest, SearchResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function searchBusinesses(
  request: SearchRequest,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}
