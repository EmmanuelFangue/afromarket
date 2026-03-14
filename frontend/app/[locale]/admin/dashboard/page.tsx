'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminAllBusinesses, getAdminPendingBusinesses } from '../../../lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [stats, setStats] = useState({ pending: 0, published: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  useEffect(() => {
    if (!isAuthenticated || !user?.roles.includes('admin')) return;
    Promise.all([
      getAdminPendingBusinesses(1, 1),
      getAdminAllBusinesses(1, 1),
    ])
      .then(([pending, all]) => {
        setStats({
          pending: pending.totalCount,
          published: Math.max(all.totalCount - pending.totalCount, 0),
          total: all.totalCount,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Tableau de bord admin</h1>

        {loadingStats ? (
          <p className="text-gray-500">Chargement des statistiques...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">En attente</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-4xl font-bold text-green-600">{stats.published}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Publiés</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Total</p>
              </div>
            </div>

            {stats.pending > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {stats.pending} commerce{stats.pending > 1 ? 's' : ''} en attente de validation
                </p>
                <Link
                  href={`/${locale}/admin/businesses`}
                  className="mt-2 inline-block text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
                >
                  Voir les commerces en attente →
                </Link>
              </div>
            )}

            <Link
              href={`/${locale}/admin/businesses`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Gérer les commerces
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
