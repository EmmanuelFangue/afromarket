'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Category, FacetItem } from '../../lib/types';

const SORT_OPTIONS: Record<string, [string, string][]> = {
  fr: [
    ['relevance', 'Pertinence'],
    ['name_asc', 'Nom (A-Z)'],
    ['name_desc', 'Nom (Z-A)'],
    ['newest', 'Plus récents'],
  ],
  en: [
    ['relevance', 'Relevance'],
    ['name_asc', 'Name (A-Z)'],
    ['name_desc', 'Name (Z-A)'],
    ['newest', 'Newest'],
  ],
};

interface SearchFiltersProps {
  locale: 'fr' | 'en';
  initialQ: string;
  initialCategory: string;
  initialCity: string;
  initialSort: string;
  categories: Category[];
  cityFacets: FacetItem[];
}

export default function SearchFilters({
  locale,
  initialQ,
  initialCategory,
  initialCity,
  initialSort,
  categories,
  cityFacets,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [sort, setSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(false);

  const t = {
    fr: {
      placeholder: 'Rechercher un restaurant, une épicerie…',
      search: 'Rechercher',
      filters: 'Filtres',
      allCategories: 'Toutes les catégories',
      allCities: 'Toutes les villes',
      sortLabel: 'Trier',
      clearFilters: 'Effacer les filtres',
    },
    en: {
      placeholder: 'Search for a restaurant, grocery…',
      search: 'Search',
      filters: 'Filters',
      allCategories: 'All categories',
      allCities: 'All cities',
      sortLabel: 'Sort',
      clearFilters: 'Clear filters',
    },
  }[locale];

  const buildUrl = (overrides: Record<string, string>) => {
    const values = { q, category, city, sort, ...overrides };
    const params = new URLSearchParams();
    if (values.q) params.set('q', values.q);
    if (values.category) params.set('category', values.category);
    if (values.city) params.set('city', values.city);
    if (values.sort && values.sort !== 'relevance') params.set('sort', values.sort);
    if (values.page && values.page !== '1') params.set('page', values.page);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ page: '1' }));
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    router.push(buildUrl({ category: val, page: '1' }));
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    router.push(buildUrl({ city: val, page: '1' }));
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    router.push(buildUrl({ sort: val, page: '1' }));
  };

  const handleClear = () => {
    setQ('');
    setCategory('');
    setCity('');
    setSort('relevance');
    router.push(pathname);
  };

  const hasActiveFilters = q || category || city || sort !== 'relevance';

  return (
    <div className="mt-6 space-y-3">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.placeholder}
            className="input-default pl-12"
            data-testid="search-input"
          />
        </div>
        {/* Mobile filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((f) => !f)}
          className={`sm:hidden border rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-primary text-primary bg-primary/5'
              : 'border-border text-muted-foreground hover:bg-stone-50'
          }`}
          data-testid="filters-toggle"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <button type="submit" className="btn-primary" data-testid="search-submit">
          <span className="hidden sm:inline">{t.search}</span>
          <Search className="w-5 h-5 sm:hidden" />
        </button>
      </form>

      {/* Filter dropdowns — always visible on sm+, toggled on mobile */}
      <div
        className={`flex flex-wrap items-center gap-3 ${showFilters ? 'flex' : 'hidden sm:flex'}`}
        data-testid="filters-row"
      >
        {/* Category */}
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="text-sm border border-border rounded-xl px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          data-testid="category-filter"
        >
          <option value="">{t.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* City — only show if facets returned cities */}
        {cityFacets.length > 0 && (
          <select
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="city-filter"
          >
            <option value="">{t.allCities}</option>
            {cityFacets.map((f) => (
              <option key={f.key} value={f.key}>
                {f.key}
                {f.count > 0 ? ` (${f.count})` : ''}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="sort-filter"
          >
            {(SORT_OPTIONS[locale] ?? SORT_OPTIONS['fr']).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            data-testid="clear-filters"
          >
            <X className="w-3.5 h-3.5" />
            {t.clearFilters}
          </button>
        )}
      </div>
    </div>
  );
}
