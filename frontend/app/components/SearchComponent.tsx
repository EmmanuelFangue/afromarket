'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Business, SearchResponse, SearchRequest } from '../lib/types';
import { searchBusinesses } from '../lib/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { useDebounce } from '../hooks/useDebounce';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-muted rounded-xl">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  )
});

export default function SearchComponent() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const tBusiness = useTranslations('business');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string>('10km');

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Debounce query for autocomplete (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { coordinates, loading: geoLoading, error: geoError, requestLocation, clearLocation } = useGeolocation();

  const handleSearch = useCallback(async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const searchQuery = queryOverride !== undefined ? queryOverride : query;
      const searchRequest: SearchRequest = { query: searchQuery };

      // Add geolocation if available
      if (coordinates) {
        searchRequest.geoSearch = {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          distance: distance,
        };
      }

      // Add filters
      if (selectedCategories.length > 0) {
        searchRequest.categories = selectedCategories;
      }
      if (selectedCities.length > 0) {
        searchRequest.cities = selectedCities;
      }

      const response = await searchBusinesses(searchRequest, abortController.signal);

      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setResults(response);
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name !== 'AbortError' && !abortController.signal.aborted) {
        setError('Failed to search. Please try again.');
        console.error(err);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [query, coordinates, distance, selectedCategories, selectedCities]);

  const handleNearMe = () => {
    if (coordinates) {
      // Already have location, search immediately
      handleSearch();
    } else {
      // Request location first
      requestLocation();
    }
  };

  // Toggle filter functions
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedCities([]);
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // If the query is empty, cancel any in-flight suggestions request
      if (suggestionsAbortControllerRef.current) {
        suggestionsAbortControllerRef.current.abort();
        suggestionsAbortControllerRef.current = null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    // Cancel any in-flight suggestions request
    if (suggestionsAbortControllerRef.current) {
      suggestionsAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    suggestionsAbortControllerRef.current = abortController;

    setSuggestionsLoading(true);

    try {
      const searchRequest: SearchRequest = {
        query: searchQuery,
        pageSize: 5, // Top-5 suggestions
      };

      const response = await searchBusinesses(searchRequest, abortController.signal);

      if (!abortController.signal.aborted) {
        setSuggestions(response.results);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !abortController.signal.aborted) {
        console.error('Autocomplete error:', err);
        setSuggestions([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setSuggestionsLoading(false);
      }
    }
  }, []);

  // Handle suggestion selection
  const selectSuggestion = useCallback((business: Business) => {
    const businessName = getBusinessName(business);
    setQuery(businessName);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Trigger search with selected business name directly
    handleSearch(undefined, businessName);
  }, [handleSearch, locale]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          return (prev + 1) % suggestions.length;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          if (prev <= 0) {
            return suggestions.length - 1;
          }
          return prev - 1;
        });
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, selectSuggestion]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-search when location is obtained
  useEffect(() => {
    if (coordinates && !loading && !results) {
      handleSearch();
    }
  }, [coordinates, loading, results, handleSearch]);

  // Auto-search when filters change
  useEffect(() => {
    if (results) {
      handleSearch();
    }
  }, [selectedCategories, selectedCities, results, handleSearch]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  // Auto-search on mount if URL has ?q= or ?category= params
  useEffect(() => {
    const initialQ = searchParams.get('q') || '';
    const initialCategory = searchParams.get('category') || '';
    if (initialCategory) {
      setSelectedCategories([initialCategory]);
    }
    if (initialQ || initialCategory) {
      handleSearch(undefined, initialQ || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract name/description from translations
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
      return translations[locale] || translations['fr'] || business.description || '';
    } catch {
      return business.description || '';
    }
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedCities.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={t('searchPlaceholder')}
              className="input-default"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="autocomplete-listbox"
              aria-activedescendant={
                selectedSuggestionIndex >= 0
                  ? `autocomplete-option-${selectedSuggestionIndex}`
                  : undefined
              }
            />

            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                id="autocomplete-listbox"
                role="listbox"
                className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-80 overflow-y-auto"
              >
                {suggestionsLoading && (
                  <div className="px-4 py-3 text-muted-foreground text-sm">
                    {t('autocomplete.loading')}
                  </div>
                )}

                {!suggestionsLoading && suggestions.length === 0 && debouncedQuery.trim() && (
                  <div className="px-4 py-3 text-muted-foreground text-sm">
                    {t('autocomplete.noSuggestions')}
                  </div>
                )}

                {!suggestionsLoading && suggestions.length > 0 && (
                  <ul>
                    {suggestions.map((business, index) => (
                      <li
                        key={business.id}
                        id={`autocomplete-option-${index}`}
                        role="option"
                        aria-selected={index === selectedSuggestionIndex}
                        onClick={() => selectSuggestion(business)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-primary/10'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="font-medium text-foreground">
                          {getBusinessName(business)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                            {business.categoryName}
                          </span>
                          <span className="text-muted-foreground">{business.city}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? tCommon('loading') : tCommon('search')}
          </button>
          <button
            type="button"
            onClick={handleNearMe}
            disabled={geoLoading}
            className={`px-6 py-2 rounded-xl font-medium transition-colors ${
              coordinates
                ? 'bg-success text-white hover:bg-success/90'
                : 'bg-muted text-foreground hover:bg-muted/80'
            } disabled:opacity-50`}
          >
            {geoLoading ? t('geolocation.detecting') : t('nearMe')}
          </button>
        </div>

        {/* Location status and distance selector */}
        <div className="flex items-center gap-4">
          {coordinates && (
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm text-success font-medium">
                ✓ {t('geolocation.detected')}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('distance')}:
                </label>
                <select
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="px-3 py-1 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="5km">5 km</option>
                  <option value="10km">10 km</option>
                  <option value="20km">20 km</option>
                  <option value="50km">50 km</option>
                </select>
              </div>
              <button
                type="button"
                onClick={clearLocation}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            </div>
          )}
          {geoError && (
            <div className="text-sm text-destructive">
              {geoError.code === 1 && t('geolocation.permissionDenied')}
              {geoError.code === 2 && t('geolocation.unavailable')}
              {geoError.code === 3 && t('geolocation.error')}
            </div>
          )}
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-6 p-4 bg-primary/5 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-primary">{t('activeFilters')}</h4>
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary hover:text-primary/80 underline"
            >
              {t('clearAllFilters')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-sm hover:bg-primary/90 transition-colors"
              >
                {category}
                <span className="opacity-70">×</span>
              </button>
            ))}
            {selectedCities.map(city => (
              <button
                key={city}
                onClick={() => toggleCity(city)}
                className="flex items-center gap-2 px-3 py-1 bg-success text-white rounded-full text-sm hover:bg-success/90 transition-colors"
              >
                {city}
                <span className="opacity-70">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-xl">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Results header with count and view toggle */}
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">
              {t('resultsFound', { count: results.totalResults })}
              {coordinates && <span className="ml-2 text-sm">({t('nearMe')})</span>}
            </div>

            {/* View toggle buttons */}
            <div className="flex gap-2 bg-muted p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {t('viewToggle.list')}
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {t('viewToggle.map')}
              </button>
            </div>
          </div>

          {/* List view */}
          {viewMode === 'list' && (
            <div className="grid gap-4">
              {results.results.map((business: Business) => (
                <Link
                  key={business.id}
                  href={`/${locale}/business/${business.id}`}
                  className="card-business group"
                >
                  <div className="p-6">
                    <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {getBusinessName(business)}
                    </h3>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{getBusinessDescription(business)}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {business.categoryName}
                      </span>
                      <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">
                        {business.city}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{business.address}</p>
                      {business.phone && <p>{tBusiness('phone')}: {business.phone}</p>}
                      {business.email && <p>{tBusiness('email')}: {business.email}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Map view */}
          {viewMode === 'map' && (
            <MapView
              businesses={results.results}
              userLocation={coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : undefined}
            />
          )}

          {/* Facets/Filters Section */}
          {results.facets && Object.keys(results.facets).length > 0 && (
            <div className="mt-8 p-6 bg-background rounded-2xl border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">{t('filters')}</h3>
              {Object.entries(results.facets).map(([key, items]) => (
                <div key={key} className="mb-4">
                  <h4 className="font-medium mb-2 text-foreground">
                    {key === 'categories' ? t('categories') : key === 'cities' ? t('cities') : key}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {items.slice(0, 10).map((item) => {
                      const isSelected = key === 'categories'
                        ? selectedCategories.includes(item.key)
                        : selectedCities.includes(item.key);

                      return (
                        <button
                          key={item.key}
                          onClick={() => key === 'categories' ? toggleCategory(item.key) : toggleCity(item.key)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            isSelected
                              ? key === 'categories'
                                ? 'bg-primary text-white hover:bg-primary/90'
                                : 'bg-success text-white hover:bg-success/90'
                              : 'bg-card border border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {item.key} ({item.count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
