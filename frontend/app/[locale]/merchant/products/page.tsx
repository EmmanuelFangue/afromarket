'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MediaItem {
  id: string;
  url: string;
  type: number;
  orderIndex: number;
  fileName: string | null;
  altText: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}

interface Product {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  sku: string | null;
  isAvailable: boolean;
  status: number;
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  items: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const STATUS_FILTERS = [
  { label: 'Tous', value: null },
  { label: 'Brouillon', value: 0 },
  { label: 'Actif', value: 1 },
  { label: 'Suspendu', value: 2 },
] as const;

const PAGE_SIZE = 12;

const STATUS_LABEL: Record<number, { label: string; className: string }> = {
  0: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  1: { label: 'Actif', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  2: { label: 'Suspendu', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export default function MerchantProductsPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const hasActiveFilter = statusFilter !== null || debouncedSearch !== '';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load products
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingProducts(true);
        setError(null);

        const backendUrl = process.env.NEXT_PUBLIC_MERCHANT_API_URL || 'http://localhost:5203';
        const token = await getAccessToken();
        if (!token) throw new Error('Non authentifié');

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (statusFilter !== null) params.set('status', String(statusFilter));
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

        const response = await fetch(
          `${backendUrl}/api/products/merchant/products?${params}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Erreur lors du chargement des produits');

        const data: PaginatedResponse = await response.json();
        if (!cancelled) {
          setProducts(data.items);
          setTotalCount(data.totalCount);
          setTotalPages(data.totalPages);
        }
      } catch (err: any) {
        console.error('[Products] Error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, getAccessToken, statusFilter, page, debouncedSearch]);

  const handleStatusFilter = (value: number | null) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mes produits
          </h1>
          <Link
            href={`/${locale}/merchant/products/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Ajouter un produit
          </Link>
        </div>

        {/* Search + status filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par titre ou SKU..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Effacer la recherche"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => handleStatusFilter(value)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {isLoadingProducts ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              Chargement des produits...
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {hasActiveFilter
                ? 'Aucun produit ne correspond à votre recherche.'
                : 'Vous n\'avez pas encore de produits. Commencez par en ajouter un !'}
            </div>
          ) : (
            <>
              {/* Count + grid */}
              <div className="px-6 pt-5 pb-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalCount} produit{totalCount > 1 ? 's' : ''}
                  {hasActiveFilter && ' trouvé' + (totalCount > 1 ? 's' : '')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {products.map((product) => {
                  const statusInfo = STATUS_LABEL[product.status] ?? STATUS_LABEL[0];
                  return (
                  <div
                    key={product.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {product.media.length > 0 ? (
                      <img
                        src={product.media[0].url}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 dark:text-gray-500 text-sm">Pas d'image</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                          {product.title}
                        </h3>
                        <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {product.price.toFixed(2)} {product.currency}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          product.isAvailable
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {product.isAvailable ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/${locale}/merchant/products/${product.id}`}
                          className="flex-1 px-3 py-1.5 text-sm text-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Voir
                        </Link>
                        {product.status === 0 && (
                          <Link
                            href={`/${locale}/merchant/products/${product.id}/edit`}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            Modifier
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Précédent
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
