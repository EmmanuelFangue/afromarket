export type BusinessStatus = 'Draft' | 'PendingValidation' | 'Published' | 'Rejected' | 'Suspended';

export interface BusinessAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface MerchantBusiness {
  id: string;
  ownerId: string;
  name: Record<string, string>;
  description: Record<string, string>;
  nameTranslations?: string;
  descriptionTranslations?: string;
  status: BusinessStatus;
  categoryId: string;
  categoryName: string;
  address: BusinessAddress;
  phone: string;
  email: string;
  website: string;
  tags: string[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CreateBusinessRequest {
  name: Record<string, string>;
  description: Record<string, string>;
  categoryId: string;
  phone?: string;
  email?: string;
  website?: string;
  address: BusinessAddress;
  tags?: string[];
}

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
  sort?: string;
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
  totalPages: number;
  facets: {
    [key: string]: FacetItem[];
  };
}

export interface Product {
  id: string;
  titleTranslations: string;
  descriptionTranslations: string;
  price: number;
  currency: string;
  businessId: string;
  businessName: string;
  firstImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchResponse {
  results: Product[];
  totalResults: number;
  page: number;
  pageSize: number;
}

export interface ProductMediaItem {
  id: string;
  url: string;
  type: string;
  orderIndex: number;
  altText?: string;
}

export interface ProductDetail {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  titleTranslations: string;
  descriptionTranslations: string;
  price: number;
  currency: string;
  sku?: string;
  isAvailable: boolean;
  status: string;
  media: ProductMediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProductsResponse {
  items: ProductDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type UserRole = 'Anonymous' | 'Merchant' | 'Admin';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredUsername?: string;
  role: UserRole;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  businessCount: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}


