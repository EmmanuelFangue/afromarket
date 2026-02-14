'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Business, SearchResponse } from '../lib/types';
import { searchBusinesses } from '../lib/api';

export default function SearchComponent() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await searchBusinesses({ query });
      setResults(response);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
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
          </div>

          <div className="grid gap-4">
            {results.results.map((business: Business) => (
              <div
                key={business.id}
                className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{business.name}</h3>
                <p className="text-gray-600 mb-3">{business.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {business.category}
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
