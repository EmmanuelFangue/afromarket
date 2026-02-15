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
