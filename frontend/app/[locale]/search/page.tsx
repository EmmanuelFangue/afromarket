'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchBusinesses, getCategories } from '../../lib/api';
import { Business, Category } from '../../lib/types';
import { Search, MapPin, Filter, X, UtensilsCrossed, ShoppingBag, Scissors, Shirt, ChefHat, ChevronRight } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'restaurant': UtensilsCrossed,
  'grocery': ShoppingBag,
  'hair': Scissors,
  'clothing': Shirt,
  'catering': ChefHat,
};

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const t = {
    fr: {
      title: 'Rechercher des commerces',
      subtitle: 'Découvrez les commerces et services africains près de chez vous',
      searchPlaceholder: 'Rechercher un restaurant, une épicerie...',
      filters: 'Filtres',
      categories: 'Catégories',
      allCategories: 'Toutes les catégories',
      results: 'résultat(s)',
      noResults: 'Aucun commerce trouvé',
      noResultsDesc: 'Essayez d\'élargir votre recherche ou de modifier vos filtres',
      clearFilters: 'Effacer les filtres',
      viewDetails: 'Voir les détails',
    },
    en: {
      title: 'Search businesses',
      subtitle: 'Discover African businesses and services near you',
      searchPlaceholder: 'Search for a restaurant, grocery...',
      filters: 'Filters',
      categories: 'Categories',
      allCategories: 'All categories',
      results: 'result(s)',
      noResults: 'No businesses found',
      noResultsDesc: 'Try broadening your search or changing your filters',
      clearFilters: 'Clear filters',
      viewDetails: 'View details',
    }
  }[locale];

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await searchBusinesses({
        query: query || '*',
        categories: selectedCategory ? [selectedCategory] : undefined,
        pageSize: 20,
      });
      setResults(response.results);
      setTotalResults(response.totalResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setQuery('');
  };

  const getBusinessName = (business: Business): string => {
    try {
      const translations = typeof business.nameTranslations === 'string'
        ? JSON.parse(business.nameTranslations)
        : business.nameTranslations;
      return translations[locale] || translations['fr'] || business.name || '';
    } catch {
      return business.name || '';
    }
  };

  const getBusinessDescription = (business: Business): string => {
    try {
      const translations = typeof business.descriptionTranslations === 'string'
        ? JSON.parse(business.descriptionTranslations)
        : business.descriptionTranslations;
      const desc = translations[locale] || translations['fr'] || business.description || '';
      return desc.length > 120 ? desc.substring(0, 120) + '...' : desc;
    } catch {
      return business.description?.substring(0, 120) || '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="input-default pl-12"
                  data-testid="search-input"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center justify-center gap-2 sm:hidden"
                data-testid="filters-toggle"
              >
                <Filter className="w-5 h-5" />
                {t.filters}
              </button>
              <button type="submit" className="btn-primary" data-testid="search-submit">
                <Search className="w-5 h-5 sm:hidden" />
                <span className="hidden sm:inline">{t.title.split(' ')[0]}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="card-dashboard sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-foreground">{t.categories}</h2>
                {(selectedCategory || query) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    data-testid="clear-filters"
                  >
                    <X className="w-3 h-3" />
                    {t.clearFilters}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    !selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                  }`}
                  data-testid="category-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selectedCategory ? 'bg-primary text-white' : 'bg-muted'}`}>
                    <Filter className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t.allCategories}</span>
                </button>

                {categories.map((cat) => {
                  const IconComponent = CATEGORY_ICONS[
                    cat.name.toLowerCase().includes('restaurant') ? 'restaurant' :
                    cat.name.toLowerCase().includes('épicerie') || cat.name.toLowerCase().includes('grocery') ? 'grocery' :
                    cat.name.toLowerCase().includes('coiffure') || cat.name.toLowerCase().includes('hair') ? 'hair' :
                    cat.name.toLowerCase().includes('vêtement') || cat.name.toLowerCase().includes('clothing') ? 'clothing' : 'catering'
                  ] || ChefHat;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        selectedCategory === cat.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                      }`}
                      data-testid={`category-${cat.id}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-muted'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                {totalResults} {t.results}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="card-business animate-pulse">
                    <div className="h-40 bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="card-dashboard text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{t.noResults}</h3>
                <p className="text-muted-foreground">{t.noResultsDesc}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((business) => (
                  <Link
                    key={business.id}
                    href={`/${locale}/business/${business.id}`}
                    className="card-business group"
                    data-testid={`business-card-${business.id}`}
                  >
                    {/* Cover placeholder */}
                    <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B4D3E' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 bg-white/90 backdrop-blur-sm text-primary rounded-full text-xs font-medium">
                          {business.categoryName}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {getBusinessName(business)}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4" />
                        {business.city}
                      </div>
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
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
