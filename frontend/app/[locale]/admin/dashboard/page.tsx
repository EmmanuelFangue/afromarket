'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminAllBusinesses, getAdminPendingBusinesses } from '../../../lib/api';
import { Store, Users, TrendingUp, Clock, CheckCircle, AlertTriangle, ArrowRight, Shield } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [stats, setStats] = useState({ pending: 0, published: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const t = {
    fr: {
      title: 'Administration',
      welcome: 'Bienvenue sur le panneau d\'administration',
      stats: { pending: 'En attente', published: 'Publiés', total: 'Total commerces' },
      pendingAlert: 'commerce(s) en attente de validation',
      viewPending: 'Voir les commerces en attente',
      manageBusinesses: 'Gérer les commerces',
      manageUsers: 'Gérer les utilisateurs',
      quickLinks: 'Accès rapides',
    },
    en: {
      title: 'Administration',
      welcome: 'Welcome to the admin panel',
      stats: { pending: 'Pending', published: 'Published', total: 'Total businesses' },
      pendingAlert: 'business(es) pending validation',
      viewPending: 'View pending businesses',
      manageBusinesses: 'Manage businesses',
      manageUsers: 'Manage users',
      quickLinks: 'Quick links',
    }
  }[locale];

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">{t.title}</h1>
              <p className="text-muted-foreground">{t.welcome}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-dashboard animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-dashboard" data-testid="stat-pending">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.stats.pending}</p>
                  <p className="text-4xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="card-dashboard" data-testid="stat-published">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.stats.published}</p>
                  <p className="text-4xl font-bold text-emerald-600">{stats.published}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="card-dashboard" data-testid="stat-total">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t.stats.total}</p>
                  <p className="text-4xl font-bold text-primary">{stats.total}</p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Store className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Alert */}
        {stats.pending > 0 && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl" data-testid="pending-alert">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <p className="font-medium text-amber-800">
                  {stats.pending} {t.pendingAlert}
                </p>
              </div>
              <Link
                href={`/${locale}/admin/businesses`}
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-full font-medium hover:bg-amber-700 transition-colors"
                data-testid="view-pending-link"
              >
                {t.viewPending}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">{t.quickLinks}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${locale}/admin/businesses`}
              className="card-dashboard hover:shadow-lg hover:-translate-y-1 transition-all flex items-center gap-4"
              data-testid="link-businesses"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Store className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{t.manageBusinesses}</h3>
                <p className="text-sm text-muted-foreground">{stats.total} commerces</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </Link>
            <Link
              href={`/${locale}/admin/users`}
              className="card-dashboard hover:shadow-lg hover:-translate-y-1 transition-all flex items-center gap-4"
              data-testid="link-users"
            >
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{t.manageUsers}</h3>
                <p className="text-sm text-muted-foreground">Gestion des utilisateurs</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
