import { SearchRequest, SearchResponse, Business, BusinessDetail, Item, PaginatedResult, MessageSummary, MessageDetail } from './types';
import { AuthTokens } from './auth-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const MERCHANT_API_URL = process.env.NEXT_PUBLIC_MERCHANT_API_URL || 'http://localhost:5203';

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
  const response = await fetch(`${MERCHANT_API_URL}/api/business/${id}`, {
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

// ─── Merchant: Business ────────────────────────────────────────────────

export async function getMyBusinesses(): Promise<BusinessDetail[]> {
  const response = await fetch(`${MERCHANT_API_URL}/api/business/my-businesses`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to fetch businesses');
  return response.json();
}

export async function updateBusiness(id: string, data: Partial<{
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  categoryId: string;
  phone: string;
  email: string;
  website: string;
  tags: string[];
  address: Record<string, string>;
}>): Promise<BusinessDetail> {
  const response = await fetch(`${MERCHANT_API_URL}/api/business/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Failed to update business');
  }
  return response.json();
}

// ─── Merchant: Items ────────────────────────────────────────────────────

export async function getItems(
  businessId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<Item>> {
  const params = new URLSearchParams({ businessId, page: String(page), pageSize: String(pageSize) });
  const response = await fetch(`${MERCHANT_API_URL}/api/item?${params}`, {
    headers: { ...getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}

export async function activateItem(id: string): Promise<Item> {
  const response = await fetch(`${MERCHANT_API_URL}/api/item/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status: 1 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Failed to activate item');
  }
  return response.json();
}

export async function suspendItem(id: string): Promise<Item> {
  const response = await fetch(`${MERCHANT_API_URL}/api/item/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status: 2 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Failed to suspend item');
  }
  return response.json();
}

export async function deleteItem(id: string): Promise<void> {
  const response = await fetch(`${MERCHANT_API_URL}/api/item/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Failed to delete item');
  }
}

// ─── Messages ─────────────────────────────────────────────────────────

export async function sendMessage(data: {
  businessId: string;
  senderName: string;
  senderEmail: string;
  content: string;
}): Promise<MessageSummary> {
  const response = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Failed to send message');
  }
  return response.json();
}

export async function getMessages(
  businessId: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<MessageSummary>> {
  const params = new URLSearchParams({ businessId, page: String(page), pageSize: String(pageSize) });
  const response = await fetch(`${MERCHANT_API_URL}/api/messages?${params}`, {
    headers: { ...getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export async function getMessageThread(id: string): Promise<MessageDetail[]> {
  const response = await fetch(`${MERCHANT_API_URL}/api/messages/${id}`, {
    headers: { ...getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to fetch message thread');
  return response.json();
}

export async function markMessageRead(id: string): Promise<void> {
  const response = await fetch(`${MERCHANT_API_URL}/api/messages/${id}/read`, {
    method: 'PATCH',
    headers: { ...getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to mark message as read');
}

export async function replyMessage(id: string, content: string): Promise<void> {
  const response = await fetch(`${MERCHANT_API_URL}/api/messages/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'Failed to send reply');
  }
}

