'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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

const STATUS_LABEL: Record<number, { label: string; className: string }> = {
  0: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  1: { label: 'Actif', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
  2: { label: 'Suspendu', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
};

export default function ProductDetailPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1] || 'fr';
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  // Fetch product
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Chargement du produit...</p>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{fetchError || 'Produit introuvable.'}</p>
            <Link
              href={`/${locale}/merchant/products`}
              className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Retour à mes produits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = STATUS_LABEL[product.status] ?? STATUS_LABEL[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/${locale}/merchant/products`}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Mes produits
          </Link>

          <div className="flex gap-3">
            {product.status === 0 && (
              <>
                <Link
                  href={`/${locale}/merchant/products/${productId}/edit`}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => handleChangeStatus(1)}
                  disabled={isChangingStatus}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingStatus ? 'En cours...' : 'Publier'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isChangingStatus}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </>
            )}

            {product.status === 1 && (
              <button
                onClick={() => handleChangeStatus(2)}
                disabled={isChangingStatus}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingStatus ? 'En cours...' : 'Suspendre'}
              </button>
            )}

            {product.status === 2 && (
              <button
                onClick={() => handleChangeStatus(1)}
                disabled={isChangingStatus}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingStatus ? 'En cours...' : 'Réactiver'}
              </button>
            )}
          </div>
        </div>

        {deleteError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{deleteError}</p>
          </div>
        )}

        {statusError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{statusError}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Image gallery */}
          {product.media.length > 0 && (
            <div>
              <img
                src={product.media[activeImageIndex]?.url}
                alt={product.title}
                className="w-full h-80 object-cover"
              />
              {product.media.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {product.media.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        i === activeImageIndex
                          ? 'border-blue-500'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <img src={m.url} alt={`Miniature ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title + status */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.title}</h1>
              <span className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {product.price.toFixed(2)}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400">{product.currency}</span>
              <span className={`ml-4 px-2 py-0.5 text-xs rounded ${
                product.isAvailable
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {product.isAvailable ? 'Disponible' : 'Indisponible'}
              </span>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {product.sku && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SKU</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{product.sku}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Commerce</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{product.businessName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Créé le</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(product.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Modifié le</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(product.updatedAt).toLocaleDateString(locale)}
                </p>
              </div>
            </div>

            {/* Status notices */}
            {product.status === 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Ce produit est en brouillon et n'est pas visible par les clients.
                  Cliquez sur <strong>Publier</strong> pour le rendre actif.
                </p>
              </div>
            )}
            {product.status === 2 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
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
