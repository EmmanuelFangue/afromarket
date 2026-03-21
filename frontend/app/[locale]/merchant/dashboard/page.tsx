'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { BusinessDetail } from '../../../lib/types';
import { getMyBusinesses } from '../../../lib/api';
import BusinessProfile from './business-profile';
import ProductsManager from './products-manager';
import MessagesInbox from './messages-inbox';

type Tab = 'business' | 'products' | 'messages';

function DashboardContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split('/')[1] || 'fr';

  const activeTab = (searchParams.get('tab') as Tab) || 'business';

  const [businesses, setBusinesses] = useState<BusinessDetail[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetail | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [businessError, setBusinessError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, locale, pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setLoadingBusinesses(true);
      setBusinessError(null);
      try {
        const data = await getMyBusinesses();
        setBusinesses(data);
        if (data.length > 0) setSelectedBusiness(data[0]);
      } catch {
        setBusinessError('Erreur lors du chargement de vos commerces');
      } finally {
        setLoadingBusinesses(false);
      }
    })();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const setTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'business', label: 'Mon commerce' },
    { id: 'products', label: 'Mes produits' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue, {user?.name || user?.email}
          </p>
        </div>

        {/* Business selector (if multiple) */}
        {businesses.length > 1 && (
          <div className="mb-4">
            <select
              value={selectedBusiness?.id || ''}
              onChange={e => {
                const b = businesses.find(b => b.id === e.target.value);
                if (b) setSelectedBusiness(b);
              }}
              className="px-3 py-2 border border-border rounded-xl bg-input text-sm text-foreground"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tab navigation */}
        <div className="border-b border-border mb-6">
          <nav className="-mb-px flex gap-1" aria-label="Onglets du tableau de bord">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          {loadingBusinesses ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : businessError ? (
            <div className="text-center py-12 text-destructive">{businessError}</div>
          ) : !selectedBusiness ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore de commerce.</p>
              <button
                onClick={() => router.push(`/${locale}/merchant/business/new`)}
                className="btn-primary"
              >
                Créer mon commerce
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'business' && (
                <BusinessProfile
                  business={selectedBusiness}
                  locale={locale}
                  onUpdated={updated => {
                    setSelectedBusiness(updated);
                    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
                  }}
                />
              )}
              {activeTab === 'products' && (
                <ProductsManager
                  businessId={selectedBusiness.id}
                  locale={locale}
                />
              )}
              {activeTab === 'messages' && (
                <MessagesInbox businessId={selectedBusiness.id} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
