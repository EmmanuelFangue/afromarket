'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminPendingBusinesses, getAdminAllBusinesses, approveBusiness, rejectBusiness } from '../../../lib/api';
import { MerchantBusiness, BusinessStatus, PaginatedResult } from '../../../lib/types';
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, Search, X, Loader2, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG: Record<BusinessStatus, { label: { fr: string; en: string }; class: string }> = {
  Draft: { label: { fr: 'Brouillon', en: 'Draft' }, class: 'status-draft' },
  PendingValidation: { label: { fr: 'En attente', en: 'Pending' }, class: 'status-pending' },
  Published: { label: { fr: 'Publié', en: 'Published' }, class: 'status-published' },
  Rejected: { label: { fr: 'Rejeté', en: 'Rejected' }, class: 'status-rejected' },
  Suspended: { label: { fr: 'Suspendu', en: 'Suspended' }, class: 'status-suspended' },
};

type Tab = 'all' | 'pending' | 'published' | 'rejected';

export default function AdminBusinessesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('pending');
  const [result, setResult] = useState<PaginatedResult<MerchantBusiness> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<MerchantBusiness | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const t = {
    fr: {
      title: 'Commerces',
      backToDashboard: 'Tableau de bord',
      tabs: { all: 'Tous', pending: 'En attente', published: 'Publiés', rejected: 'Rejetés' },
      table: { name: 'Nom', owner: 'Propriétaire', city: 'Ville', category: 'Catégorie', submitted: 'Soumis le', status: 'Statut', actions: 'Actions' },
      approve: 'Approuver',
      reject: 'Rejeter',
      view: 'Voir',
      noPending: 'Aucun commerce en attente de validation.',
      noBusinesses: 'Aucun commerce trouvé.',
      rejectModal: { title: 'Rejeter le commerce', reason: 'Motif de rejet', placeholder: 'Expliquez pourquoi ce commerce est rejeté...', cancel: 'Annuler', confirm: 'Confirmer le rejet' },
      results: 'résultat(s)',
      previous: 'Précédent',
      next: 'Suivant',
    },
    en: {
      title: 'Businesses',
      backToDashboard: 'Dashboard',
      tabs: { all: 'All', pending: 'Pending', published: 'Published', rejected: 'Rejected' },
      table: { name: 'Name', owner: 'Owner', city: 'City', category: 'Category', submitted: 'Submitted', status: 'Status', actions: 'Actions' },
      approve: 'Approve',
      reject: 'Reject',
      view: 'View',
      noPending: 'No businesses pending validation.',
      noBusinesses: 'No businesses found.',
      rejectModal: { title: 'Reject business', reason: 'Rejection reason', placeholder: 'Explain why this business is rejected...', cancel: 'Cancel', confirm: 'Confirm rejection' },
      results: 'result(s)',
      previous: 'Previous',
      next: 'Next',
    }
  }[locale];

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user?.roles.includes('admin')) return;
    setLoading(true);
    try {
      let data: PaginatedResult<MerchantBusiness>;
      if (tab === 'pending') {
        data = await getAdminPendingBusinesses(page, 20);
      } else {
        const status = tab === 'all' ? undefined : tab === 'published' ? 'Published' : 'Rejected';
        data = await getAdminAllBusinesses(page, 20, status);
      }
      setResult(data);

      // Get pending count for badge
      const pending = await getAdminPendingBusinesses(1, 1);
      setPendingCount(pending.totalCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab, page, isAuthenticated, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setPage(1);
  };

  const handleApprove = async (business: MerchantBusiness) => {
    setActionLoading(business.id);
    try {
      await approveBusiness(business.id);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (business: MerchantBusiness) => {
    setSelectedBusiness(business);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedBusiness || !rejectReason.trim()) return;
    setActionLoading(selectedBusiness.id);
    try {
      await rejectBusiness(selectedBusiness.id, rejectReason);
      setRejectModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/${locale}/admin/dashboard`}
            className="text-muted-foreground hover:text-primary transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">{t.title}</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6" data-testid="tabs">
          {(['all', 'pending', 'published', 'rejected'] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => handleTabChange(tabKey)}
              className={`relative px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === tabKey
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tabKey}`}
            >
              {t.tabs[tabKey]}
              {tabKey === 'pending' && pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="card-dashboard text-center py-12">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        ) : !result || result.items.length === 0 ? (
          <div className="card-dashboard text-center py-12">
            <p className="text-muted-foreground">
              {tab === 'pending' ? t.noPending : t.noBusinesses}
            </p>
          </div>
        ) : (
          <>
            <div className="card-dashboard overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="businesses-table">
                  <thead>
                    <tr className="bg-stone-50 border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.name}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t.table.city}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t.table.category}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t.table.submitted}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.status}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.items.map((biz) => {
                      const name = typeof biz.name === 'object'
                        ? (biz.name[locale] || biz.name['fr'] || Object.values(biz.name)[0])
                        : biz.name;
                      const isActionLoading = actionLoading === biz.id;

                      return (
                        <tr key={biz.id} className="hover:bg-stone-50 transition-colors" data-testid={`business-row-${biz.id}`}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-foreground">{String(name)}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{biz.address.city}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">{biz.address.city}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground hidden lg:table-cell">{biz.categoryName}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">
                            {new Date(biz.updatedAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[biz.status].class}`}>
                              {STATUS_CONFIG[biz.status].label[locale]}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {biz.status === 'PendingValidation' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(biz)}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                    data-testid={`approve-btn-${biz.id}`}
                                  >
                                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    {t.approve}
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(biz)}
                                    disabled={isActionLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                                    data-testid={`reject-btn-${biz.id}`}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    {t.reject}
                                  </button>
                                </>
                              )}
                              <Link
                                href={`/${locale}/admin/businesses/${biz.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                                data-testid={`view-btn-${biz.id}`}
                              >
                                <Eye className="w-4 h-4" />
                                {t.view}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {result.totalCount} {t.results}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
                  data-testid="pagination-prev"
                >
                  {t.previous}
                </button>
                <span className="px-4 py-2 text-sm font-medium">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!result.hasNextPage}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
                  data-testid="pagination-next"
                >
                  {t.next}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="reject-modal">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-semibold text-foreground">{t.rejectModal.title}</h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">{t.rejectModal.reason}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="input-default h-auto py-3"
                placeholder={t.rejectModal.placeholder}
                data-testid="reject-reason-input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="btn-outline"
                data-testid="reject-cancel-btn"
              >
                {t.rejectModal.cancel}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === selectedBusiness.id}
                className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                data-testid="reject-confirm-btn"
              >
                {actionLoading === selectedBusiness.id && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.rejectModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
