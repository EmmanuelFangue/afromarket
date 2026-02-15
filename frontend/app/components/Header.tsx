'use client';

import { useAuth } from '../contexts/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const t = useTranslations('header');
  const locale = useLocale();

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          AfroMarket
        </Link>

        <nav className="flex items-center gap-4">
          <LanguageSwitcher />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300">
                {user?.email}
              </span>

              {user?.roles.includes('merchant') && (
                <Link
                  href={`/${locale}/merchant/dashboard`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('dashboard')}
                </Link>
              )}

              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/auth/login`}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
