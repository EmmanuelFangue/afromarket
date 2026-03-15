'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { getProductsByBusiness } from '../../../lib/api';
import { BusinessProductsResponse, ProductDetail } from '../../../lib/types';

const SORT_OPTIONS: Record<string, [string, string][]> = {
  fr: [
    ['relevance', 'Pertinence'],
    ['name_asc', 'Nom (A-Z)'],
    ['name_desc', 'Nom (Z-A)'],
    ['price_asc', 'Prix croissant'],
    ['price_desc', 'Prix décroissant'],
  ],
  en: [
    ['relevance', 'Relevance'],
    ['name_asc', 'Name (A-Z)'],
    ['name_desc', 'Name (Z-A)'],
    ['price_asc', 'Price (low to high)'],
    ['price_desc', 'Price (high to low)'],
  ],
};

interface ProductsSectionProps {
  businessId: string;
  initialData: BusinessProductsResponse;
  initialPage: number;
  initialSort: string;
  locale: string;
}

export default function ProductsSection({
  businessId,
  initialData,
  initialPage,
  initialSort,
  locale,
}: ProductsSectionProps) {
  const [data, setData] = useState<BusinessProductsResponse>(initialData);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(false);

  const pageSize = 12;
  const totalPages = data.totalPages ?? Math.ceil((data.totalCount ?? 0) / pageSize);
  const l = (locale === 'en' ? 'en' : 'fr') as 'fr' | 'en';

  const t = {
    fr: {
      title: 'Produits proposés',
      noProducts: 'Aucun produit disponible pour ce commerce.',
      sortLabel: 'Trier par',
      prev: 'Précédent',
      next: 'Suivant',
      page: 'Page',
      of: 'sur',
      available: 'Disponible',
      unavailable: 'Indisponible',
    },
    en: {
      title: 'Products offered',
      noProducts: 'No products available for this business.',
      sortLabel: 'Sort by',
      prev: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      available: 'Available',
      unavailable: 'Unavailable',
    },
  }[l];

  useEffect(() => {
    if (page === initialPage && sort === initialSort) return;

    const ctrl = new AbortController();
    setLoading(true);

    getProductsByBusiness(businessId, page, pageSize, ctrl.signal, sort)
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [page, sort]);

  const getProductTitle = (product: ProductDetail): string => {
    try {
      const tr = JSON.parse(product.titleTranslations);
      return tr[l] || tr['fr'] || product.title || '';
    } catch {
      return product.title || '';
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    try {
      return new Intl.NumberFormat(l === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency,
      }).format(price);
    } catch {
      return `${price} ${currency}`;
    }
  };

  const getFirstImageUrl = (product: ProductDetail): string | null => {
    if (!product.media || product.media.length === 0) return null;
    return [...product.media].sort((a, b) => a.orderIndex - b.orderIndex)[0].url;
  };

  return (
    <div className="card-dashboard mb-6" data-testid="products-section">
      {/* Header row with title + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">{t.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
            {t.sortLabel}
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {(SORT_OPTIONS[l] ?? SORT_OPTIONS['fr']).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border animate-pulse">
              <div className="aspect-video bg-stone-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-5 bg-stone-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && data.items.length === 0 && (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t.noProducts}</p>
        </div>
      )}

      {/* Product grid */}
      {!loading && data.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((product) => {
            const imageUrl = getFirstImageUrl(product);
            const title = getProductTitle(product);
            return (
              <Link
                key={product.id}
                href={`/${l}/product/${product.id}`}
                className="group border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all bg-white"
                data-testid={`product-card-${product.id}`}
              >
                {imageUrl ? (
                  <div className="aspect-video bg-stone-100 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">{title}</h3>
                  <p className="font-bold text-primary text-lg">
                    {formatPrice(product.price, product.currency)}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isAvailable
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {product.isAvailable ? t.available : t.unavailable}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-stone-50 transition-colors"
          >
            {t.prev}
          </button>
          <span className="text-sm text-muted-foreground">
            {t.page} {page} {t.of} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-stone-50 transition-colors"
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
