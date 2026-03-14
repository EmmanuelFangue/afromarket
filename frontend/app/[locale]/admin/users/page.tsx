'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

const MOCK_USERS = [
  { id: '1', email: 'admin@afromarket.com', name: 'Admin', role: 'admin', createdAt: '2024-01-01' },
  { id: '2', email: 'merchant@afromarket.com', name: 'Merchant', role: 'merchant', createdAt: '2024-01-02' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:underline text-sm">
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Données de démonstration</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Nom', 'Email', 'Rôle', 'Inscrit le'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {MOCK_USERS.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
          La gestion complète des utilisateurs sera disponible dans une prochaine version.
        </p>
      </div>
    </div>
  );
}
