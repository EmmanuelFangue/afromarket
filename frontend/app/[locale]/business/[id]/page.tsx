'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getBusinessById } from '../../../lib/api';
import { Business } from '../../../lib/types';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('businessDetails');

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinessById(params.id as string, abortController.signal);

        if (!data) {
          setError(t('notFound'));
          return;
        }

        setBusiness(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching business:', err);
          setError(t('error'));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (params.id) {
      fetchBusiness();
    }

    return () => {
      abortController.abort();
    };
  }, [params.id, t]);

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

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-600 dark:text-gray-400">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
        >
          ← {t('backToSearch')}
        </button>
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-6 rounded-lg">
          {error || t('notFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
      >
        ← {t('backToSearch')}
      </button>

      {/* Business header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {getBusinessName(business)}
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {business.categoryName}
          </span>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
            {business.city}
          </span>
        </div>

        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
          {getBusinessDescription(business)}
        </p>

        {/* Contact section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('contact')}
          </h2>

          <div className="space-y-3">
            {business.address && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{business.address}</span>
              </div>
            )}

            {business.phone && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${business.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {business.phone}
                </a>
              </div>
            )}

            {business.email && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${business.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {business.email}
                </a>
              </div>
            )}

            {business.website && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {business.website.match(/^https?:\/\//) ? (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {t('website')}
                  </a>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">{business.website}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {business.tags && business.tags.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
