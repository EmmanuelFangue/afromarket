'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Business, SearchResponse } from '../lib/types';
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

  const { coordinates, loading: geoLoading, error: geoError, requestLocation, clearLocation } = useGeolocation();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const searchRequest: any = { query };

      // Add geolocation if available
      if (coordinates) {
        searchRequest.geoSearch = {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          distance: distance,
        };
      }

      const response = await searchBusinesses(searchRequest);
      setResults(response);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNearMe = () => {
    if (coordinates) {
      // Already have location, search immediately
      handleSearch();
    } else {
      // Request location first
      requestLocation();
    }
  };

  // Auto-search when location is obtained
  useEffect(() => {
    if (coordinates && !loading && !results) {
      handleSearch();
    }
  }, [coordinates]);

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

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="text-gray-600">
            Found {results.totalResults} results
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

          {results.facets && Object.keys(results.facets).length > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              {Object.entries(results.facets).map(([key, items]) => (
                <div key={key} className="mb-4">
                  <h4 className="font-medium capitalize mb-2">{key}</h4>
                  <div className="flex flex-wrap gap-2">
                    {items.slice(0, 10).map((item) => (
                      <span
                        key={item.key}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                      >
                        {item.key} ({item.count})
                      </span>
                    ))}
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
