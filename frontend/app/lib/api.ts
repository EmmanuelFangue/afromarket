import { SearchRequest, SearchResponse, Business, ProductSearchResponse, ProductDetail, BusinessProductsResponse } from './types';
import { AuthTokens } from './auth-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') {
    return {};
  }

  const stored = localStorage.getItem('afromarket_auth');
  if (stored) {
    try {
      const tokens: AuthTokens = JSON.parse(stored);
      return { 'Authorization': `Bearer ${tokens.accessToken}` };
    } catch (error) {
      console.error('Failed to parse auth tokens:', error);
      return {};
    }
  }
  return {};
}

export async function searchBusinesses(
  request: SearchRequest,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
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
): Promise<Business | null> {
  const response = await fetch(`${API_URL}/api/business/${id}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader()
    },
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch business');
  }

  const data = await response.json();

  // MerchantService returns address as a nested object — map to the flat Business type
  const addr = data.address ?? {};
  return {
    ...data,
    city: addr.city ?? '',
    address: [addr.street, addr.city, addr.province].filter(Boolean).join(', '),
    location: {
      lat: addr.latitude ?? 0,
      lon: addr.longitude ?? 0,
    },
  } as Business;
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal
): Promise<ProductSearchResponse> {
  const response = await fetch(`${API_URL}/api/search/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, pageSize: 12 }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Product search failed');
  }

  return response.json();
}

export async function getPublicProductById(
  id: string,
  signal?: AbortSignal
): Promise<ProductDetail | null> {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'GET',
    signal,
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch product');

  return response.json();
}

export async function getProductsByBusiness(
  businessId: string,
  page: number = 1,
  pageSize: number = 20,
  signal?: AbortSignal
): Promise<BusinessProductsResponse> {
  const params = new URLSearchParams({
    businessId,
    page: String(page),
    pageSize: String(pageSize),
  });

  const response = await fetch(`${API_URL}/api/products?${params}`, {
    method: 'GET',
    signal,
  });

  if (!response.ok) throw new Error('Failed to fetch business products');

  return response.json();
}
