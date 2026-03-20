export interface Business {
  id: string;
  name: string;
  description: string;
  nameTranslations: string | Record<string, string>;
  descriptionTranslations: string | Record<string, string>;
  category: string;
  categoryName: string;
  city: string;
  address: string;
  location: {
    lat: number;
    lon: number;
  };
  phone: string;
  email: string;
  website: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Extended business type from MerchantService (authenticated responses)
export interface BusinessDetail {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  nameTranslations: string;
  descriptionTranslations: string;
  categoryId: string;
  categoryName: string;
  // BusinessStatus: Draft=0, PendingValidation=1, Published=2, Rejected=3, Suspended=4
  status: number;
  rejectionReason?: string;
  phone?: string;
  email?: string;
  website?: string;
  tags: string[];
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const BusinessStatus = {
  Draft: 0,
  PendingValidation: 1,
  Published: 2,
  Rejected: 3,
  Suspended: 4,
} as const;

export interface MediaItem {
  id: string;
  url: string;
  type: string;
  orderIndex: number;
  fileName?: string;
  altText?: string;
  fileSizeBytes?: number;
  createdAt: string;
}

export interface Item {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  sku?: string;
  isAvailable: boolean;
  // ItemStatus: Draft=0, Active=1, Suspended=2
  status: number;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

export const ItemStatus = {
  Draft: 0,
  Active: 1,
  Suspended: 2,
} as const;

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface MessageSummary {
  id: string;
  senderName: string;
  senderEmail: string;
  contentPreview: string;
  createdAt: string;
  isRead: boolean;
  replyCount: number;
  lastActivityAt: string;
}

export interface MessageDetail {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  isFromMerchant: boolean;
}

export interface SearchRequest {
  query: string;
  categories?: string[];
  cities?: string[];
  geoSearch?: {
    lat: number;
    lon: number;
    distance: string;
  };
  page?: number;
  pageSize?: number;
}

export interface FacetItem {
  key: string;
  count: number;
}

export interface SearchResponse {
  results: Business[];
  totalResults: number;
  page: number;
  pageSize: number;
  facets: {
    [key: string]: FacetItem[];
  };
}

