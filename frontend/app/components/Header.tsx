'use client';

import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          AfroMarket
        </Link>

        <nav className="flex items-center gap-4">
          {isLoading ? (
            <div className="text-gray-500">Chargement...</div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300">
                {user?.email}
              </span>

              {user?.roles.includes('merchant') && (
                <Link
                  href={`/${locale}/merchant/dashboard`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tableau de bord
                </Link>
              )}

              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/auth/login`}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
