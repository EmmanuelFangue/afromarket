'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Business, SearchResponse, SearchRequest } from '../lib/types';
import { searchBusinesses } from '../lib/api';
import { useGeolocation } from '../hooks/useGeolocation';

export default function SearchComponent() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string>('10km');

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const { coordinates, loading: geoLoading, error: geoError, requestLocation, clearLocation } = useGeolocation();

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
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
      const searchRequest: SearchRequest = { query };

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

      const response = await searchBusinesses(searchRequest);

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
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? tCommon('loading') : tCommon('search')}
          </button>
          <button
            type="button"
            onClick={handleNearMe}
            disabled={geoLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              coordinates
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            {geoLoading ? t('geolocation.detecting') : t('nearMe')}
          </button>
        </div>

        {/* Location status and distance slider */}
        <div className="flex items-center gap-4">
          {coordinates && (
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm text-green-600 font-medium">
                ✓ {t('geolocation.detected')}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm text-gray-600 whitespace-nowrap">
                  {t('distance')}:
                </label>
                <select
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            </div>
          )}
          {geoError && (
            <div className="text-sm text-red-600">
              {geoError.code === 1 && t('geolocation.permissionDenied')}
              {geoError.code === 2 && t('geolocation.unavailable')}
              {geoError.code === 3 && t('geolocation.error')}
            </div>
          )}
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900">{t('activeFilters')}</h4>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {t('clearAllFilters')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition-colors"
              >
                {category}
                <span className="text-blue-200">×</span>
              </button>
            ))}
            {selectedCities.map(city => (
              <button
                key={city}
                onClick={() => toggleCity(city)}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors"
              >
                {city}
                <span className="text-green-200">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="text-gray-600">
            {t('resultsFound', { count: results.totalResults })}
            {coordinates && <span className="ml-2 text-sm">({t('nearMe')})</span>}
          </div>

          <div className="grid gap-4">
            {results.results.map((business: Business) => (
              <div
                key={business.id}
                className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{getBusinessName(business)}</h3>
                <p className="text-gray-600 mb-3">{getBusinessDescription(business)}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {business.categoryName}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {business.city}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <p>{business.address}</p>
                  {business.phone && <p>Phone: {business.phone}</p>}
                  {business.email && <p>Email: {business.email}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Facets/Filters Section */}
          {results.facets && Object.keys(results.facets).length > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">{t('filters')}</h3>
              {Object.entries(results.facets).map(([key, items]) => (
                <div key={key} className="mb-4">
                  <h4 className="font-medium mb-2">
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
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
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
