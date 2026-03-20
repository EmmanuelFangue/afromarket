'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Item, ItemStatus, PaginatedResult } from '../../../lib/types';
import { getItems, activateItem, suspendItem, deleteItem } from '../../../lib/api';

interface Props {
  businessId: string;
  locale: string;
}

const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  [ItemStatus.Draft]: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  [ItemStatus.Active]: { label: 'Actif', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  [ItemStatus.Suspended]: { label: 'Suspendu', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

export default function ProductsManager({ businessId, locale }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<PaginatedResult<Item> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getItems(businessId, page);
      setResult(data);
    } catch {
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [businessId, page]);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (id: string) => {
    setActionId(id);
    try {
      const updated = await activateItem(id);
      setResult(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === id ? updated : i)
      } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'activation');
    } finally {
      setActionId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActionId(id);
    try {
      const updated = await suspendItem(id);
      setResult(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === id ? updated : i)
      } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suspension');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return;
    setActionId(id);
    try {
      await deleteItem(id);
      setResult(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== id),
        totalCount: prev.totalCount - 1,
      } : prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression');
    } finally {
      setActionId(null);
    }
  };

  if (loading && !result) {
    return <div className="text-center py-12 text-gray-500">Chargement des produits...</div>;
  }

  const items = result?.items ?? [];
  const totalPages = result ? Math.ceil(result.totalCount / 20) : 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {result?.totalCount ?? 0} produit{(result?.totalCount ?? 0) !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => router.push(`/${locale}/merchant/products/new`)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Ajouter un produit
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Fermer</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun produit pour l'instant.</p>
          <button
            onClick={() => router.push(`/${locale}/merchant/products/new`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter votre premier produit
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {items.map(item => {
              const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG[ItemStatus.Draft];
              const isBusy = actionId === item.id;
              const thumb = item.media[0]?.url;

              return (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {thumb ? (
                      <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: item.currency }).format(item.price)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === ItemStatus.Draft && (
                      <button
                        onClick={() => handleActivate(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Activer
                      </button>
                    )}
                    {item.status === ItemStatus.Active && (
                      <button
                        onClick={() => handleSuspend(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
                      >
                        Suspendre
                      </button>
                    )}
                    {item.status === ItemStatus.Suspended && (
                      <button
                        onClick={() => handleActivate(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Réactiver
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/${locale}/merchant/products/${item.id}/edit`)}
                      className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Modifier
                    </button>
                    {item.status === ItemStatus.Draft && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
