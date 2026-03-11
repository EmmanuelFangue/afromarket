'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getMyBusinesses } from '../../../lib/api';
import { MerchantBusiness, BusinessStatus } from '../../../lib/types';

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

export default function MerchantDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [businesses, setBusinesses] = useState<MerchantBusiness[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('merchant'))) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  useEffect(() => {
    if (isAuthenticated && user?.roles.includes('merchant')) {
      getMyBusinesses()
        .then(setBusinesses)
        .catch(() => {})
        .finally(() => setLoadingBiz(false));
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <Link
            href={`/${locale}/merchant/business/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Créer mon commerce
          </Link>
        </div>

        {loadingBiz ? (
          <p className="text-gray-500">Chargement des commerces...</p>
        ) : businesses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Vous n&apos;avez pas encore de commerce.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              Créez votre profil de commerce pour commencer à ajouter des produits.
            </p>
            <Link
              href={`/${locale}/merchant/business/new`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer mon commerce
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.map(biz => {
              const name = typeof biz.name === 'object'
                ? (biz.name[locale] || biz.name['fr'] || Object.values(biz.name)[0])
                : biz.name;
              return (
                <div key={biz.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{String(name)}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{biz.address.city} · {biz.categoryName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[biz.status]}`}>
                      {STATUS_LABELS[biz.status]}
                    </span>
                    <Link
                      href={`/${locale}/merchant/business/${biz.id}`}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Gérer
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
