'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  PendingValidation: 'En attente de validation',
  Published: 'Publié',
  Rejected: 'Rejeté',
  Suspended: 'Suspendu',
};

export default function MerchantDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const [businesses, setBusinesses] = useState<MerchantBusiness[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    if (isAuthenticated) {
      getMyBusinesses()
        .then(setBusinesses)
        .catch(() => {})
        .finally(() => setLoadingBiz(false));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Bienvenue, {user?.name || user?.email}
          </p>
        </div>

        {/* Section commerce */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mon commerce</h2>
            <Link
              href={`/${locale}/merchant/business/new`}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Créer un commerce
            </Link>
          </div>
          {loadingBiz ? (
            <p className="text-gray-500 text-sm">Chargement...</p>
          ) : businesses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                Vous n&apos;avez pas encore de commerce.
              </p>
              <Link href={`/${locale}/merchant/business/new`} className="text-blue-600 hover:underline text-sm">
                Créer mon commerce →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {businesses.map(biz => {
                const name = typeof biz.name === 'object'
                  ? (biz.name[locale] || biz.name['fr'] || Object.values(biz.name)[0])
                  : biz.name;
                return (
                  <div key={biz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{String(name)}</p>
                      <p className="text-xs text-gray-500">{biz.address.city} · {biz.categoryName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[biz.status]}`}>
                        {STATUS_LABELS[biz.status]}
                      </span>
                      <Link href={`/${locale}/merchant/business/${biz.id}`} className="text-xs text-blue-600 hover:underline">
                        Gérer
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Produits" value="0" icon="📦" color="blue" />
          <StatCard title="Commandes" value="0" icon="🛒" color="green" />
          <StatCard title="Revenus" value="0 $CAD" icon="💰" color="yellow" />
          <StatCard title="Clients" value="0" icon="👥" color="purple" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionButton
              label="Ajouter un produit"
              icon="➕"
              onClick={() => router.push(`/${locale}/merchant/products/new`)}
            />
            <QuickActionButton
              label="Voir les commandes"
              icon="📋"
              onClick={() => router.push(`/${locale}/merchant/orders`)}
            />
            <QuickActionButton
              label="Paramètres"
              icon="⚙️"
              onClick={() => router.push(`/${locale}/merchant/settings`)}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Activité récente
          </h2>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucune activité récente
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface QuickActionButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
}

function QuickActionButton({ label, icon, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-900 dark:text-white font-medium">{label}</span>
    </button>
  );
}
