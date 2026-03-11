import { SearchRequest, SearchResponse, Business, MerchantBusiness, PaginatedResult, Category, CreateBusinessRequest } from './types';
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

  return response.json();
}

// ─── Merchant Business ────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/business/categories`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function getMyBusinesses(): Promise<MerchantBusiness[]> {
  const response = await fetch(`${API_URL}/api/business/my`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch businesses');
  return response.json();
}

export async function getMerchantBusinessById(id: string): Promise<MerchantBusiness | null> {
  const response = await fetch(`${API_URL}/api/business/${id}`, {
    headers: getAuthHeader(),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch business');
  return response.json();
}

export async function createBusiness(data: CreateBusinessRequest): Promise<MerchantBusiness> {
  const response = await fetch(`${API_URL}/api/business`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create business');
  }
  return response.json();
}

export async function submitBusinessForReview(id: string): Promise<MerchantBusiness> {
  const response = await fetch(`${API_URL}/api/business/${id}/submit`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to submit business');
  }
  return response.json();
}

// ─── Admin Business ───────────────────────────────────────────────────────────

export async function getAdminPendingBusinesses(page = 1, pageSize = 20): Promise<PaginatedResult<MerchantBusiness>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const response = await fetch(`${API_URL}/api/business/admin/pending?${params}`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch pending businesses');
  return response.json();
}

export async function getAdminAllBusinesses(page = 1, pageSize = 20, status?: string): Promise<PaginatedResult<MerchantBusiness>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set('status', status);
  const response = await fetch(`${API_URL}/api/business/admin/all?${params}`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch businesses');
  return response.json();
}

export async function approveBusiness(id: string): Promise<MerchantBusiness> {
  const response = await fetch(`${API_URL}/api/business/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to approve business');
  }
  return response.json();
}

export async function rejectBusiness(id: string, rejectionReason: string): Promise<MerchantBusiness> {
  const response = await fetch(`${API_URL}/api/business/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ rejectionReason }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to reject business');
  }
  return response.json();
}
