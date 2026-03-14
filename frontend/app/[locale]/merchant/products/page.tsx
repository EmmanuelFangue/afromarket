'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Package, X, ChevronLeft, ChevronRight,
  Tag, CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react';

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
  { label: { fr: 'Tous', en: 'All' }, value: null },
  { label: { fr: 'Brouillon', en: 'Draft' }, value: 0 },
  { label: { fr: 'Actif', en: 'Active' }, value: 1 },
  { label: { fr: 'Suspendu', en: 'Suspended' }, value: 2 },
] as const;

const PAGE_SIZE = 12;

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_CONFIG: Record<number, StatusConfig> = {
  0: { label: 'Brouillon', className: 'status-draft', icon: Clock },
  1: { label: 'Actif', className: 'status-published', icon: CheckCircle },
  2: { label: 'Suspendu', className: 'status-suspended', icon: AlertCircle },
};

export default function MerchantProductsPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';

  const t = {
    fr: {
      title: 'Mes produits',
      add: 'Ajouter un produit',
      search: 'Rechercher par titre ou SKU...',
      loading: 'Chargement des produits...',
      empty: "Vous n'avez pas encore de produits. Commencez par en ajouter un !",
      noResults: 'Aucun produit ne correspond à votre recherche.',
      see: 'Voir',
      edit: 'Modifier',
      noImage: "Pas d'image",
      available: 'Disponible',
      unavailable: 'Indisponible',
      page: 'Page',
      of: 'sur',
      prev: 'Précédent',
      next: 'Suivant',
      products: (n: number) => `${n} produit${n > 1 ? 's' : ''}`,
      found: (n: number) => ` trouvé${n > 1 ? 's' : ''}`,
    },
    en: {
      title: 'My Products',
      add: 'Add a product',
      search: 'Search by title or SKU...',
      loading: 'Loading products...',
      empty: "You don't have any products yet. Start by adding one!",
      noResults: 'No products match your search.',
      see: 'View',
      edit: 'Edit',
      noImage: 'No image',
      available: 'Available',
      unavailable: 'Unavailable',
      page: 'Page',
      of: 'of',
      prev: 'Previous',
      next: 'Next',
      products: (n: number) => `${n} product${n > 1 ? 's' : ''}`,
      found: (n: number) => ` found`,
    },
  }[locale];

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingProducts(true);
        setError(null);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">{t.title}</h1>
            {!isLoadingProducts && (
              <p className="text-muted-foreground text-sm mt-1">
                {t.products(totalCount)}
                {hasActiveFilter && t.found(totalCount)}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/merchant/products/new`}
            className="btn-primary inline-flex items-center gap-2"
            data-testid="add-product-btn"
          >
            <Plus className="w-4 h-4" />
            {t.add}
          </Link>
        </div>

        {/* Search + status filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.search}
              className="input-default pl-9 pr-9"
              data-testid="products-search"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 bg-muted/30 border border-border p-1 rounded-xl">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={String(value)}
                onClick={() => handleStatusFilter(value)}
                data-testid={`filter-${value ?? 'all'}`}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label[locale]}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="card-dashboard p-0 overflow-hidden">
          {isLoadingProducts ? (
            <div className="p-12 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">{t.loading}</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                {hasActiveFilter ? t.noResults : t.empty}
              </p>
              {!hasActiveFilter && (
                <Link href={`/${locale}/merchant/products/new`} className="btn-primary inline-flex items-center gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  {t.add}
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {products.map((product) => {
                  const statusCfg = STATUS_CONFIG[product.status] ?? STATUS_CONFIG[0];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <div
                      key={product.id}
                      className="border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-background"
                      data-testid={`product-card-${product.id}`}
                    >
                      {product.media.length > 0 ? (
                        <img
                          src={product.media[0].url}
                          alt={product.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted/30 flex flex-col items-center justify-center gap-2">
                          <Package className="w-8 h-8 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">{t.noImage}</span>
                        </div>
                      )}

                      <div className="p-4">
                        {/* Title + status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground leading-tight line-clamp-2">{product.title}</h3>
                          <span className={`inline-flex items-center gap-1 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>

                        {/* Price + availability */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-heading text-lg font-bold text-primary">
                            {product.price.toFixed(2)} {product.currency}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            product.isAvailable
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-muted/40 text-muted-foreground'
                          }`}>
                            {product.isAvailable
                              ? <><CheckCircle className="w-3 h-3" />{t.available}</>
                              : <><XCircle className="w-3 h-3" />{t.unavailable}</>
                            }
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link
                            href={`/${locale}/merchant/products/${product.id}`}
                            className="flex-1 px-3 py-1.5 text-sm text-center btn-primary"
                            data-testid={`view-product-${product.id}`}
                          >
                            {t.see}
                          </Link>
                          {product.status === 0 && (
                            <Link
                              href={`/${locale}/merchant/products/${product.id}/edit`}
                              className="px-3 py-1.5 text-sm btn-outline"
                              data-testid={`edit-product-${product.id}`}
                            >
                              {t.edit}
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t.page} {page} {t.of} {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t.prev}
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t.next}
                      <ChevronRight className="w-4 h-4" />
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
