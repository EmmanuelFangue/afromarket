'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  MapPin, Phone, Mail, Globe, Tag, Package, ShoppingBag,
  Calendar, User,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  getMerchantBusinessById,
  approveBusiness,
  rejectBusiness,
  getAdminProductsByBusiness,
} from '../../../../lib/api';
import { MerchantBusiness, BusinessStatus, BusinessProductsResponse } from '../../../../lib/types';

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BusinessStatus, {
  label: string;
  bg: string;
  text: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  Draft:             { label: 'Brouillon',               bg: 'bg-gray-100 dark:bg-gray-700',    text: 'text-gray-700 dark:text-gray-300',      Icon: Clock },
  PendingValidation: { label: 'En attente de validation', bg: 'bg-amber-100 dark:bg-amber-900',  text: 'text-amber-800 dark:text-amber-200',     Icon: Clock },
  Published:         { label: 'Publié',                  bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-800 dark:text-emerald-200', Icon: CheckCircle },
  Rejected:          { label: 'Rejeté',                  bg: 'bg-red-100 dark:bg-red-900',      text: 'text-red-800 dark:text-red-200',         Icon: XCircle },
  Suspended:         { label: 'Suspendu',                bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200',   Icon: AlertTriangle },
};

const PRODUCT_STATUS_BADGE: Record<string, string> = {
  Active:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
  Draft:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  Suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function localized(value: string | Record<string, string> | undefined, locale: string): string {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      const p = JSON.parse(value);
      return p[locale] || p['fr'] || Object.values(p)[0] as string || value;
    } catch {
      return value;
    }
  }
  return value[locale] || value['fr'] || Object.values(value)[0] || '';
}

function fmtDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmtPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

function productTitle(item: BusinessProductsResponse['items'][number], locale: string): string {
  try {
    if (item.titleTranslations) {
      const tr = JSON.parse(item.titleTranslations);
      return tr[locale] || tr['fr'] || item.title || '';
    }
  } catch { /* noop */ }
  return item.title || '';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminBusinessDetailPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useParams();
  const locale   = pathname.split('/')[1] || 'fr';
  const businessId = params.id as string;

  const { user, isAuthenticated, isLoading } = useAuth();

  // ── State ───────────────────────────────────────────────────────────────────
  const [business,  setBusiness]  = useState<MerchantBusiness | null>(null);
  const [products,  setProducts]  = useState<BusinessProductsResponse | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);

  const [approveConfirm, setApproveConfirm] = useState(false);
  const [isApproving,    setIsApproving]    = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting,     setIsRejecting]     = useState(false);

  const [actionError,     setActionError]     = useState<string | null>(null);
  const [successMessage,  setSuccessMessage]  = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!businessId || isLoading) return;

    setLoadingBiz(true);
    setLoadError(null);

    Promise.all([
      getMerchantBusinessById(businessId),
      getAdminProductsByBusiness(businessId, 5),
    ])
      .then(([biz, prods]) => {
        if (!biz) { setLoadError('Commerce introuvable.'); return; }
        setBusiness(biz);
        setProducts(prods);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoadingBiz(false));
  }, [businessId, isLoading]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!business) return;
    setIsApproving(true);
    setActionError(null);
    try {
      const updated = await approveBusiness(business.id);
      setBusiness(updated);
      setSuccessMessage('Commerce approuvé et publié avec succès.');
      setApproveConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur lors de l\'approbation.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!business) return;
    if (rejectionReason.trim().length < 10) {
      setActionError('Le motif doit comporter au moins 10 caractères.');
      return;
    }
    setIsRejecting(true);
    setActionError(null);
    try {
      const updated = await rejectBusiness(business.id, rejectionReason.trim());
      setBusiness(updated);
      setSuccessMessage('Commerce rejeté.');
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur lors du rejet.');
    } finally {
      setIsRejecting(false);
    }
  };

  // ── Render: loading ─────────────────────────────────────────────────────────
  if (isLoading || loadingBiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: load error ──────────────────────────────────────────────────────
  if (loadError || !business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/${locale}/admin/businesses`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow px-6 py-16 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 font-medium">
              {loadError || 'Commerce introuvable.'}
            </p>
            <Link
              href={`/${locale}/admin/businesses`}
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Voir la liste de modération
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const businessName = localized(business.nameTranslations || business.name, locale);
  const businessDesc = localized(business.descriptionTranslations || business.description, locale);
  const st           = STATUS_CONFIG[business.status] ?? STATUS_CONFIG.Draft;
  const canAct       = business.status === 'PendingValidation' || business.status === 'Draft';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Breadcrumb + title ── */}
        <div className="mb-6">
          <Link
            href={`/${locale}/admin/businesses`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste de modération
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Révision du commerce</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${st.bg} ${st.text}`}>
              <st.Icon className="w-3.5 h-3.5" />
              {st.label}
            </span>
          </div>
        </div>

        {/* ── Success banner ── */}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* ── Action error (outside modal) ── */}
        {actionError && !showRejectModal && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* ── Main info card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow divide-y divide-gray-100 dark:divide-gray-700 mb-4">

          {/* Header */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{businessName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{business.categoryName}</p>
            {businessDesc && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{businessDesc}</p>
            )}
          </div>

          {/* Coordonnées + Adresse */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Coordonnées
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="font-mono text-xs break-all">{business.ownerId}</span>
                </li>
                {business.phone && (
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    {business.phone}
                  </li>
                )}
                {business.email && (
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    {business.email}
                  </li>
                )}
                {business.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {business.website}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Adresse
              </p>
              <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
                <div>
                  {business.address?.street && <p>{business.address.street}</p>}
                  <p>
                    {business.address?.city}
                    {business.address?.province ? `, ${business.address.province}` : ''}
                  </p>
                  <p>
                    {[business.address?.postalCode, business.address?.country]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {(business.address?.latitude || business.address?.longitude) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {business.address.latitude?.toFixed(5)}, {business.address.longitude?.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {business.tags && business.tags.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {business.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {business.status === 'Rejected' && business.rejectionReason && (
            <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                Motif de rejet
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">{business.rejectionReason}</p>
            </div>
          )}

          {/* Dates */}
          <div className="px-6 py-4 flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Créé le {fmtDate(business.createdAt, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              MAJ le {fmtDate(business.updatedAt, locale)}
            </span>
            {business.publishedAt && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle className="w-3.5 h-3.5" />
                Publié le {fmtDate(business.publishedAt, locale)}
              </span>
            )}
          </div>
        </div>

        {/* ── Products card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-4">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Marchandises
                {products !== null && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs font-normal">
                    {products.totalCount}
                  </span>
                )}
              </h3>
            </div>
          </div>

          {!products || products.items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Package className="w-10 h-10 text-gray-300 dark:bg-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Aucun produit enregistré pour ce commerce.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-700">
              {products.items.map((item) => {
                const firstImg = [...(item.media ?? [])]
                  .sort((a, b) => a.orderIndex - b.orderIndex)[0]?.url;
                return (
                  <li key={item.id} className="px-5 py-3 flex items-center gap-4">
                    {firstImg ? (
                      <img
                        src={firstImg}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {productTitle(item, locale)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {fmtPrice(item.price, item.currency)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        PRODUCT_STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Action bar ── */}
        {canAct && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Décision de modération
            </h3>

            {!approveConfirm ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setApproveConfirm(true); setActionError(null); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approuver
                </button>
                <button
                  onClick={() => { setShowRejectModal(true); setActionError(null); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeter
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-3 font-medium">
                  Confirmer la publication de « {businessName} » ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isApproving ? 'Publication...' : 'Confirmer l\'approbation'}
                  </button>
                  <button
                    onClick={() => setApproveConfirm(false)}
                    disabled={isApproving}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Rejeter le commerce
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{businessName}</p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motif de rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Ex : Adresse incomplète, informations insuffisantes..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none text-sm"
              disabled={isRejecting}
            />
            <p className={`text-xs mt-1 ${rejectionReason.trim().length >= 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {rejectionReason.trim().length} / 10 caractères minimum
            </p>

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); setActionError(null); }}
                disabled={isRejecting}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || rejectionReason.trim().length < 10}
                className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isRejecting ? 'Rejet en cours...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
