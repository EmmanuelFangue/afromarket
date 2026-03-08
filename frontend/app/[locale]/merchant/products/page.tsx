'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function MerchantProductsPage() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

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

        const response = await fetch(`${backendUrl}/api/products/merchant/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Erreur lors du chargement des produits');

        const data = await response.json();
        if (!cancelled) setProducts(data);
      } catch (err: any) {
        console.error('[Products] Error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, getAccessToken]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mes produits
          </h1>
          <button
            onClick={() => router.push(`/${locale}/merchant/products/new`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter un produit
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {isLoadingProducts ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Chargement des produits...
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Vous n'avez pas encore de produits. Commencez par en ajouter un!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {products.map((product) => (
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
                      <span className="text-gray-400 dark:text-gray-500">Pas d'image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {product.price.toFixed(2)} ${product.currency}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.isAvailable
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {product.isAvailable ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push(`/${locale}/merchant/products/${product.id}`)}
                        className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
