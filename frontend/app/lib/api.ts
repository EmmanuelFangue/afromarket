import { SearchRequest, SearchResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MERCHANT_API_URL = process.env.NEXT_PUBLIC_MERCHANT_API_URL || 'http://localhost:5203';

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

export async function getBusinessById(
  id: string,
  signal?: AbortSignal
): Promise<any> {
  const response = await fetch(`${MERCHANT_API_URL}/api/business/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch business');
  }

  return response.json();
}
