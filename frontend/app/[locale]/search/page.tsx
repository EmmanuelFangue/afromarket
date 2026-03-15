import Link from 'next/link';
import { MapPin, Search, ChevronRight, AlertCircle } from 'lucide-react';
import SearchFilters from './search-filters';
import { Category, SearchResponse, FacetItem } from '../../lib/types';

// Search results are never cached — always fresh
export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 12;

async function fetchSearch(
  q: string,
  category: string,
  city: string,
  sort: string,
  page: number,
): Promise<SearchResponse | null> {
  try {
    const body = {
      query: q || '',
      categories: category ? [category] : [],
      cities: city ? [city] : [],
      sort,
      page,
      pageSize: PAGE_SIZE,
    };
    const res = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/business/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;

  const locale = (localeParam === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const q = sp.q ?? '';
  const category = sp.category ?? '';
  const city = sp.city ?? '';
  const sort = sp.sort ?? 'relevance';
  const page = Math.max(1, Number(sp.page ?? 1));

  const [searchResult, categories] = await Promise.all([
    fetchSearch(q, category, city, sort, page),
    fetchCategories(),
  ]);

  const results = searchResult?.results ?? [];
  const totalResults = searchResult?.totalResults ?? 0;
  const totalPages = searchResult?.totalPages ?? Math.ceil(totalResults / PAGE_SIZE);
  const cityFacets: FacetItem[] = searchResult?.facets?.cities ?? [];

  const t = {
    fr: {
      title: 'Rechercher des commerces',
      subtitle: 'Découvrez les commerces et services africains près de chez vous',
      results: 'résultat(s)',
      noResults: 'Aucun commerce trouvé',
      noResultsDesc: 'Essayez d\'élargir votre recherche ou de modifier vos filtres',
      viewDetails: 'Voir les détails',
      searchError: 'La recherche est momentanément indisponible. Veuillez réessayer.',
      pageOf: (p: number, total: number) => `Page ${p} sur ${total}`,
      prev: 'Précédent',
      next: 'Suivant',
    },
    en: {
      title: 'Search businesses',
      subtitle: 'Discover African businesses and services near you',
      results: 'result(s)',
      noResults: 'No businesses found',
      noResultsDesc: 'Try broadening your search or changing your filters',
      viewDetails: 'View details',
      searchError: 'Search is temporarily unavailable. Please try again.',
      pageOf: (p: number, total: number) => `Page ${p} of ${total}`,
      prev: 'Previous',
      next: 'Next',
    },
  }[locale];

  const getBusinessName = (business: any): string => {
    try {
      const tr =
        typeof business.nameTranslations === 'string'
          ? JSON.parse(business.nameTranslations)
          : business.nameTranslations;
      return tr[locale] || tr['fr'] || business.name || '';
    } catch {
      return business.name || '';
    }
  };

  const getBusinessDescription = (business: any): string => {
    try {
      const tr =
        typeof business.descriptionTranslations === 'string'
          ? JSON.parse(business.descriptionTranslations)
          : business.descriptionTranslations;
      const desc = tr[locale] || tr['fr'] || business.description || '';
      return desc.length > 120 ? `${desc.substring(0, 120)}…` : desc;
    } catch {
      return business.description?.substring(0, 120) || '';
    }
  };

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    if (sort !== 'relevance') params.set('sort', sort);
    params.set('page', String(p));
    return `/${locale}/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with search + filters */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-1">
            {t.title}
          </h1>
          <p className="text-muted-foreground">{t.subtitle}</p>

          <SearchFilters
            locale={locale}
            initialQ={q}
            initialCategory={category}
            initialCity={city}
            initialSort={sort}
            categories={categories}
            cityFacets={cityFacets}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Error state */}
        {searchResult === null ? (
          <div className="card-dashboard flex items-center gap-4 py-10">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            <p className="text-muted-foreground">{t.searchError}</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-6">
              {totalResults} {t.results}
            </p>

            {/* Empty state */}
            {results.length === 0 ? (
              <div className="card-dashboard text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {t.noResults}
                </h3>
                <p className="text-muted-foreground">{t.noResultsDesc}</p>
              </div>
            ) : (
              <>
                {/* Results grid */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  data-testid="search-results"
                >
                  {results.map((business: any) => (
                    <Link
                      key={business.id}
                      href={`/${locale}/business/${business.id}`}
                      className="card-business group"
                      data-testid={`business-card-${business.id}`}
                    >
                      {/* Cover banner with pattern */}
                      <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B4D3E' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
                          }}
                        />
                        {business.categoryName && (
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center px-3 py-1 bg-white/90 backdrop-blur-sm text-primary rounded-full text-xs font-medium">
                              {business.categoryName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {getBusinessName(business)}
                        </h3>
                        {business.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            {business.city}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getBusinessDescription(business)}
                        </p>
                        <div className="mt-4 flex items-center text-primary text-sm font-medium">
                          {t.viewDetails}
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-center gap-4 mt-10 pt-8 border-t border-border"
                    data-testid="pagination"
                  >
                    {page > 1 ? (
                      <Link
                        href={buildPageUrl(page - 1)}
                        className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-stone-50 transition-colors"
                        data-testid="prev-page"
                      >
                        {t.prev}
                      </Link>
                    ) : (
                      <span className="px-4 py-2 text-sm border border-border rounded-xl opacity-40 cursor-default">
                        {t.prev}
                      </span>
                    )}

                    <span className="text-sm text-muted-foreground">
                      {t.pageOf(page, totalPages)}
                    </span>

                    {page < totalPages ? (
                      <Link
                        href={buildPageUrl(page + 1)}
                        className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-stone-50 transition-colors"
                        data-testid="next-page"
                      >
                        {t.next}
                      </Link>
                    ) : (
                      <span className="px-4 py-2 text-sm border border-border rounded-xl opacity-40 cursor-default">
                        {t.next}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
