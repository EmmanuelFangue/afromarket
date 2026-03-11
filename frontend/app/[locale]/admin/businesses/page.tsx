'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminPendingBusinesses, getAdminAllBusinesses } from '../../../lib/api';
import { MerchantBusiness, BusinessStatus, PaginatedResult } from '../../../lib/types';

const STATUS_STYLES: Record<BusinessStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  PendingValidation: 'bg-yellow-100 text-yellow-800',
  Published: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Suspended: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<BusinessStatus, string> = {
  Draft: 'Brouillon',
  PendingValidation: 'En attente',
  Published: 'Publié',
  Rejected: 'Rejeté',
  Suspended: 'Suspendu',
};

type Tab = 'pending' | 'all';

export default function AdminBusinessesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('pending');
  const [result, setResult] = useState<PaginatedResult<MerchantBusiness> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user?.roles.includes('admin')) return;
    setLoading(true);
    try {
      const data = tab === 'pending'
        ? await getAdminPendingBusinesses(page, 20)
        : await getAdminAllBusinesses(page, 20);
      setResult(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab, page, isAuthenticated, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setPage(1);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:underline text-sm">
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commerces</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Tous
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : !result || result.items.length === 0 ? (
          <p className="text-gray-500">
            {tab === 'pending' ? 'Aucun commerce en attente de validation.' : 'Aucun commerce trouvé.'}
          </p>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {['Nom', 'Ville', 'Statut', 'Soumis le', 'Actions'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {result.items.map(biz => {
                    const name = typeof biz.name === 'object'
                      ? (biz.name[locale] || biz.name['fr'] || Object.values(biz.name)[0])
                      : biz.name;
                    return (
                      <tr key={biz.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {String(name)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {biz.address.city}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[biz.status]}`}>
                            {STATUS_LABELS[biz.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(biz.updatedAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/${locale}/admin/businesses/${biz.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Voir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {result.totalCount} résultat{result.totalCount > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Précédent
                </button>
                <span className="px-3 py-1 text-sm">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!result.hasNextPage}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
