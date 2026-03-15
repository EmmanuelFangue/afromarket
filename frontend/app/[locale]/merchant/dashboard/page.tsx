'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMyBusinesses } from '../../../lib/api';
import { MerchantBusiness, BusinessStatus } from '../../../lib/types';
import { Plus, Eye, Package, Settings, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Store, TrendingUp, ShoppingBag } from 'lucide-react';

const STATUS_CONFIG: Record<BusinessStatus, { label: { fr: string; en: string }; class: string; icon: React.ComponentType<any> }> = {
  Draft: { label: { fr: 'Brouillon', en: 'Draft' }, class: 'status-draft', icon: Clock },
  PendingValidation: { label: { fr: 'En attente de validation', en: 'Pending Review' }, class: 'status-pending', icon: Clock },
  Published: { label: { fr: 'Publié', en: 'Published' }, class: 'status-published', icon: CheckCircle },
  Rejected: { label: { fr: 'Rejeté', en: 'Rejected' }, class: 'status-rejected', icon: XCircle },
  Suspended: { label: { fr: 'Suspendu', en: 'Suspended' }, class: 'status-suspended', icon: AlertCircle },
};

export default function MerchantDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const [businesses, setBusinesses] = useState<MerchantBusiness[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  const t = {
    fr: {
      welcome: 'Bonjour',
      subtitle: 'Bienvenue sur votre espace commerçant AfroMarket',
      createBusiness: 'Créer un commerce',
      myBusinesses: 'Mes commerces',
      noBusiness: 'Vous n\'avez pas encore de commerce',
      noBusinessDesc: 'Créez votre premier commerce pour commencer à vendre sur AfroMarket',
      createFirst: 'Créer mon premier commerce',
      manage: 'Gérer',
      viewPublic: 'Voir la page',
      manageProducts: 'Gérer les produits',
      submitReview: 'Soumettre pour validation',
      underReview: 'En cours d\'examen',
      correctResubmit: 'Corriger et resoumettre',
      rejectionReason: 'Motif de rejet',
      pipeline: { draft: 'Brouillon', review: 'Validation', published: 'Publié' },
      stats: { total: 'Total commerces', published: 'Publiés', pending: 'En attente' },
      quickActions: 'Actions rapides',
      addProduct: 'Ajouter un produit',
      viewOrders: 'Voir les commandes',
      settings: 'Paramètres',
    },
    en: {
      welcome: 'Hello',
      subtitle: 'Welcome to your AfroMarket merchant space',
      createBusiness: 'Create a business',
      myBusinesses: 'My businesses',
      noBusiness: 'You don\'t have any business yet',
      noBusinessDesc: 'Create your first business to start selling on AfroMarket',
      createFirst: 'Create my first business',
      manage: 'Manage',
      viewPublic: 'View page',
      manageProducts: 'Manage products',
      submitReview: 'Submit for review',
      underReview: 'Under review',
      correctResubmit: 'Correct and resubmit',
      rejectionReason: 'Rejection reason',
      pipeline: { draft: 'Draft', review: 'Review', published: 'Published' },
      stats: { total: 'Total businesses', published: 'Published', pending: 'Pending' },
      quickActions: 'Quick actions',
      addProduct: 'Add a product',
      viewOrders: 'View orders',
      settings: 'Settings',
    }
  }[locale];

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const stats = {
    total: businesses.length,
    published: businesses.filter(b => b.status === 'Published').length,
    pending: businesses.filter(b => b.status === 'PendingValidation').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 mb-8">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-10">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">
              {t.welcome}, {user?.name || user?.email?.split('@')[0]} !
            </h1>
            <p className="text-white/80 text-lg">{t.subtitle}</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1655720357872-ce227e4164ba?w=400&h=300&fit=crop"
            alt=""
            className="hidden md:block absolute right-8 bottom-0 w-64 h-48 object-cover rounded-t-2xl opacity-90"
          />
        </div>

        {/* Status Pipeline Strip */}
        <div className="card-dashboard mb-8" data-testid="status-pipeline">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.pipeline.draft}</p>
                  <p className="font-semibold text-foreground">{businesses.filter(b => b.status === 'Draft').length}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.pipeline.review}</p>
                  <p className="font-semibold text-foreground">{stats.pending}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.pipeline.published}</p>
                  <p className="font-semibold text-foreground">{stats.published}</p>
                </div>
              </div>
            </div>
            <Link
              href={`/${locale}/merchant/business/new`}
              className="btn-primary flex items-center gap-2"
              data-testid="create-business-btn"
            >
              <Plus className="w-5 h-5" />
              {t.createBusiness}
            </Link>
          </div>
        </div>

        {/* Businesses Section */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">{t.myBusinesses}</h2>

          {loadingBiz ? (
            <div className="card-dashboard text-center py-12">
              <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="card-dashboard text-center py-12" data-testid="empty-state">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{t.noBusiness}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t.noBusinessDesc}</p>
              <Link
                href={`/${locale}/merchant/business/new`}
                className="btn-primary inline-flex items-center gap-2"
                data-testid="create-first-business-btn"
              >
                <Plus className="w-5 h-5" />
                {t.createFirst}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz) => {
                const name = typeof biz.name === 'object'
                  ? (biz.name[locale] || biz.name['fr'] || Object.values(biz.name)[0])
                  : biz.name;
                const StatusIcon = STATUS_CONFIG[biz.status].icon;

                return (
                  <div key={biz.id} className="card-business group" data-testid={`business-card-${biz.id}`}>
                    {/* Cover placeholder with pattern */}
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231B4D3E' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[biz.status].class}`}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CONFIG[biz.status].label[locale]}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-1 line-clamp-1">
                        {String(name)}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {biz.address.city} · {biz.categoryName}
                      </p>

                      {/* Rejection reason */}
                      {biz.status === 'Rejected' && biz.rejectionReason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-xs font-medium text-red-700 mb-1">{t.rejectionReason}:</p>
                          <p className="text-sm text-red-600">{biz.rejectionReason}</p>
                        </div>
                      )}

                      {/* Actions based on status */}
                      <div className="flex flex-wrap gap-2">
                        {biz.status === 'Draft' && (
                          <Link
                            href={`/${locale}/merchant/business/${biz.id}`}
                            className="flex-1 btn-primary py-2 text-sm text-center"
                            data-testid={`submit-review-btn-${biz.id}`}
                          >
                            {t.submitReview}
                          </Link>
                        )}
                        {biz.status === 'PendingValidation' && (
                          <span className="flex-1 bg-amber-50 text-amber-700 rounded-full py-2 text-sm text-center font-medium">
                            {t.underReview}
                          </span>
                        )}
                        {biz.status === 'Published' && (
                          <>
                            <Link
                              href={`/${locale}/business/${biz.id}`}
                              className="flex-1 btn-outline py-2 text-sm text-center flex items-center justify-center gap-1"
                              data-testid={`view-public-btn-${biz.id}`}
                            >
                              <Eye className="w-4 h-4" />
                              {t.viewPublic}
                            </Link>
                            <Link
                              href={`/${locale}/merchant/products?businessId=${biz.id}`}
                              className="flex-1 btn-primary py-2 text-sm text-center flex items-center justify-center gap-1"
                              data-testid={`manage-products-btn-${biz.id}`}
                            >
                              <Package className="w-4 h-4" />
                              {t.manageProducts}
                            </Link>
                          </>
                        )}
                        {biz.status === 'Rejected' && (
                          <Link
                            href={`/${locale}/merchant/business/${biz.id}`}
                            className="flex-1 bg-red-600 text-white rounded-full py-2 text-sm text-center font-medium hover:bg-red-700 transition-colors"
                            data-testid={`resubmit-btn-${biz.id}`}
                          >
                            {t.correctResubmit}
                          </Link>
                        )}
                        <Link
                          href={`/${locale}/merchant/business/${biz.id}`}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          title={t.manage}
                          data-testid={`manage-btn-${biz.id}`}
                        >
                          <Settings className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card-dashboard">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">{t.quickActions}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push(`/${locale}/merchant/products/new`)}
              className="flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors text-left"
              data-testid="quick-action-add-product"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium text-foreground">{t.addProduct}</span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/merchant/orders`)}
              className="flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors text-left"
              data-testid="quick-action-orders"
            >
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <span className="font-medium text-foreground">{t.viewOrders}</span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/merchant/settings`)}
              className="flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors text-left"
              data-testid="quick-action-settings"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-accent" />
              </div>
              <span className="font-medium text-foreground">{t.settings}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
