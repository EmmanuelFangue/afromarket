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
  [ItemStatus.Draft]: { label: 'Brouillon', className: 'status-draft' },
  [ItemStatus.Active]: { label: 'Actif', className: 'status-published' },
  [ItemStatus.Suspended]: { label: 'Suspendu', className: 'status-suspended' },
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
      setError(e instanceof Error ? e.message : "Erreur lors de l'activation");
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
    return <div className="text-center py-12 text-muted-foreground">Chargement des produits...</div>;
  }

  const items = result?.items ?? [];
  const totalPages = result ? Math.ceil(result.totalCount / 20) : 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {result?.totalCount ?? 0} produit{(result?.totalCount ?? 0) !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => router.push(`/${locale}/merchant/products/new`)}
          className="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          + Ajouter un produit
        </button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Fermer</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground mb-4">Aucun produit pour l'instant.</p>
          <button
            onClick={() => router.push(`/${locale}/merchant/products/new`)}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Ajouter votre premier produit
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {items.map(item => {
              const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG[ItemStatus.Draft];
              const isBusy = actionId === item.id;
              const thumb = item.media[0]?.url;

              return (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-card hover:bg-muted/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {thumb ? (
                      <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
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
                        className="px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 transition-colors"
                      >
                        Activer
                      </button>
                    )}
                    {item.status === ItemStatus.Active && (
                      <button
                        onClick={() => handleSuspend(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs bg-warning text-white rounded-lg hover:bg-warning/90 disabled:opacity-50 transition-colors"
                      >
                        Suspendre
                      </button>
                    )}
                    {item.status === ItemStatus.Suspended && (
                      <button
                        onClick={() => handleActivate(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 transition-colors"
                      >
                        Réactiver
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/${locale}/merchant/products/${item.id}/edit`)}
                      className="px-3 py-1.5 text-xs text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Modifier
                    </button>
                    {item.status === ItemStatus.Draft && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 disabled:opacity-50 transition-colors"
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
                className="px-4 py-2 text-sm border border-border rounded-xl disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-border rounded-xl disabled:opacity-50 hover:bg-muted transition-colors"
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
