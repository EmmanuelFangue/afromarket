'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function MerchantSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Paramètres
        </h1>

        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Profil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <p className="text-gray-900 dark:text-white">{user?.name || 'Non défini'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rôles
              </label>
              <p className="text-gray-900 dark:text-white">
                {user?.roles.join(', ') || 'Aucun rôle'}
              </p>
            </div>
          </div>
        </div>

        {/* Business Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Informations commerciales
          </h2>
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            Configuration à venir
          </div>
        </div>
      </div>
    </div>
  );
}
