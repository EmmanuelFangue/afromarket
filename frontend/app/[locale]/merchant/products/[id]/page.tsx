'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Globe, Trash2, PauseCircle, PlayCircle,
  CheckCircle, XCircle, Clock, AlertCircle, Package, Store, Tag,
  Loader2,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface MediaItem {
  id: string;
  url: string;
  type: number;
  orderIndex: number;
  fileName: string | null;
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
  status: number; // 0=Draft, 1=Active, 2=Suspended
  media: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

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

export default function ProductDetailPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    let cancelled = false;

    const fetchProduct = async () => {
      try {
        setIsFetching(true);
        const token = await getAccessToken();
        if (!token) {
          setFetchError('Session expirée. Veuillez vous reconnecter.');
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 404) {
          if (!cancelled) setFetchError('Produit introuvable.');
          return;
        }
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setFetchError('Session expirée. Veuillez vous reconnecter.');
          return;
        }
        if (!response.ok) throw new Error('Impossible de charger le produit.');

        const data: Product = await response.json();
        if (!cancelled) setProduct(data);
      } catch (err: any) {
        if (!cancelled) setFetchError(err.message || 'Erreur lors du chargement.');
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, productId, getAccessToken]);

  const handleChangeStatus = async (newStatus: number) => {
    setIsChangingStatus(true);
    setStatusError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${BACKEND_URL}/api/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Impossible de changer le statut.');
      }

      const updated: Product = await response.json();
      setProduct(updated);
    } catch (err: any) {
      console.error('[ChangeStatus] Error:', err);
      setStatusError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Non authentifié');

      const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Impossible de supprimer ce produit.');
      }

      router.push(`/${locale}/merchant/products`);
    } catch (err: any) {
      console.error('[DeleteProduct] Error:', err);
      setDeleteError(err.message || 'Une erreur est survenue.');
      setIsDeleting(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800">{fetchError || 'Produit introuvable.'}</p>
              <Link
                href={`/${locale}/merchant/products`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à mes produits
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[product.status] ?? STATUS_CONFIG[0];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Nav + actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            href={`/${locale}/merchant/products`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="back-to-products"
          >
            <ArrowLeft className="w-4 h-4" />
            Mes produits
          </Link>

          <div className="flex flex-wrap gap-2">
            {product.status === 0 && (
              <>
                <Link
                  href={`/${locale}/merchant/products/${productId}/edit`}
                  className="btn-outline inline-flex items-center gap-2 text-sm"
                  data-testid="edit-product-btn"
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </Link>
                <button
                  onClick={() => handleChangeStatus(1)}
                  disabled={isChangingStatus}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="publish-btn"
                >
                  {isChangingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {isChangingStatus ? 'En cours...' : 'Publier'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isChangingStatus}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="delete-btn"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </>
            )}

            {product.status === 1 && (
              <button
                onClick={() => handleChangeStatus(2)}
                disabled={isChangingStatus}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="suspend-btn"
              >
                {isChangingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                {isChangingStatus ? 'En cours...' : 'Suspendre'}
              </button>
            )}

            {product.status === 2 && (
              <button
                onClick={() => handleChangeStatus(1)}
                disabled={isChangingStatus}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="reactivate-btn"
              >
                {isChangingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                {isChangingStatus ? 'En cours...' : 'Réactiver'}
              </button>
            )}
          </div>
        </div>

        {/* Inline error alerts */}
        {deleteError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{deleteError}</p>
          </div>
        )}
        {statusError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{statusError}</p>
          </div>
        )}

        <div className="card-dashboard p-0 overflow-hidden">
          {/* Image gallery */}
          {product.media.length > 0 ? (
            <div>
              <img
                src={product.media[activeImageIndex]?.url}
                alt={product.title}
                className="w-full h-80 object-cover"
              />
              {product.media.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto border-b border-border">
                  {product.media.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeImageIndex
                          ? 'border-primary scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={m.url} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 bg-muted/20 flex flex-col items-center justify-center gap-2 border-b border-border">
              <Package className="w-12 h-12 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Pas d'image</span>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title + status */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-heading text-2xl font-bold text-foreground">{product.title}</h1>
              <span className={`inline-flex items-center gap-1.5 flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full ${statusCfg.className}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
            </div>

            {/* Price + availability */}
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-3xl font-bold text-primary">
                {product.price.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">{product.currency}</span>
              <span className={`inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 text-xs rounded-full ${
                product.isAvailable
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-muted/40 text-muted-foreground'
              }`}>
                {product.isAvailable
                  ? <><CheckCircle className="w-3 h-3" />Disponible</>
                  : <><XCircle className="w-3 h-3" />Indisponible</>
                }
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Description</h2>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              {product.sku && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />SKU
                  </p>
                  <p className="text-sm font-mono font-medium text-foreground">{product.sku}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Store className="w-3 h-3" />Commerce
                </p>
                <p className="text-sm font-medium text-foreground">{product.businessName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Créé le</p>
                <p className="text-sm text-foreground">{new Date(product.createdAt).toLocaleDateString(locale)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modifié le</p>
                <p className="text-sm text-foreground">{new Date(product.updatedAt).toLocaleDateString(locale)}</p>
              </div>
            </div>

            {/* Status notices */}
            {product.status === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Ce produit est en brouillon et n'est pas visible par les clients.
                  Cliquez sur <strong>Publier</strong> pour le rendre actif.
                </p>
              </div>
            )}
            {product.status === 2 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
                <PauseCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800">
                  Ce produit est suspendu et n'est pas visible par les clients.
                  Cliquez sur <strong>Réactiver</strong> pour le rendre à nouveau disponible.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
