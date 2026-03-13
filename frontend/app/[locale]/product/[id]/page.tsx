'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { getPublicProductById } from '../../../lib/api';
import { ProductDetail } from '../../../lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('productDetails');

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicProductById(params.id as string, abortController.signal);

        if (!data) {
          setError(t('notFound'));
          return;
        }

        setProduct(data);
        setActiveImageIndex(0); // Reset gallery index for the new product
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching product:', err);
          setError(t('error'));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (params.id) {
      fetchProduct();
    }

    return () => {
      abortController.abort();
    };
  }, [params.id, t]);

  const getLocalizedText = (jsonString: string, fallback: string): string => {
    try {
      const translations = JSON.parse(jsonString);
      return translations[locale] || translations['fr'] || fallback;
    } catch {
      return fallback;
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
    } catch {
      return `${price} ${currency}`;
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

  if (error || !product) {
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

  const sortedMedia = [...product.media].sort((a, b) => a.orderIndex - b.orderIndex);
  const title = getLocalizedText(product.titleTranslations, product.title);
  const description = getLocalizedText(product.descriptionTranslations, product.description);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
      >
        ← {t('backToSearch')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image section */}
        {sortedMedia.length > 0 ? (
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={sortedMedia[activeImageIndex].url}
                alt={sortedMedia[activeImageIndex].altText || title}
                className="w-full h-full object-cover"
              />
            </div>
            {sortedMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedMedia.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => setActiveImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      index === activeImageIndex
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={media.url}
                      alt={media.altText || `${title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Product info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(product.price, product.currency)}
            </p>
          </div>

          {/* Availability */}
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">{t('availability')}</span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                product.isAvailable
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {product.isAvailable ? t('available') : t('unavailable')}
            </span>
          </div>

          {/* SKU */}
          {product.sku && (
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">{t('sku')}</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{product.sku}</span>
            </div>
          )}

          {/* Sold by */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">{t('soldBy')}</span>
            <Link
              href={`/${locale}/business/${product.businessId}`}
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline"
            >
              {product.businessName}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
      )}
    </div>
  );
}
