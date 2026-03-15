'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  MapPin, Phone, Mail, Globe, Tag, Package, ShoppingBag,
  Calendar, User, ExternalLink, Loader2,
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
  Draft:             { label: 'Brouillon',               bg: 'bg-stone-100',    text: 'text-stone-700',      Icon: Clock },
  PendingValidation: { label: 'En attente de validation', bg: 'bg-amber-100',    text: 'text-amber-800',      Icon: Clock },
  Published:         { label: 'Publié',                  bg: 'bg-emerald-100',  text: 'text-emerald-800',    Icon: CheckCircle },
  Rejected:          { label: 'Rejeté',                  bg: 'bg-red-100',      text: 'text-red-800',        Icon: XCircle },
  Suspended:         { label: 'Suspendu',                bg: 'bg-orange-100',   text: 'text-orange-800',     Icon: AlertTriangle },
};

const PRODUCT_STATUS_BADGE: Record<string, string> = {
  Active:    'bg-emerald-100 text-emerald-700',
  Draft:     'bg-stone-100 text-stone-600',
  Suspended: 'bg-orange-100 text-orange-700',
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
      <div className="min-h-screen bg-background">
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-secondary/20" />
        <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10 pb-12">
          <div className="h-6 w-32 bg-white/30 rounded mb-6" />
          <div className="card-business p-8 animate-pulse space-y-4">
            <div className="h-8 w-72 bg-stone-200 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-stone-200 rounded-full" />
              <div className="h-6 w-24 bg-stone-200 rounded-full" />
            </div>
            <div className="h-4 w-full bg-stone-200 rounded" />
            <div className="h-4 w-3/4 bg-stone-200 rounded" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-stone-200 rounded-xl" />
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
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/${locale}/admin/businesses`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </Link>
          <div className="card-business px-6 py-16 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">
              {loadError || 'Commerce introuvable.'}
            </p>
            <Link
              href={`/${locale}/admin/businesses`}
              className="text-sm text-primary hover:underline"
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

  const address = business.address
    ? [business.address.street, business.address.city, business.address.province]
        .filter(Boolean).join(', ')
    : null;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Banner ── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B4D3E' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10 pb-12">

        {/* ── Back button ── */}
        <Link
          href={`/${locale}/admin/businesses`}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors drop-shadow"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste de modération
        </Link>

        {/* ── Success banner ── */}
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* ── Action error (outside modal) ── */}
        {actionError && !showRejectModal && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* ── Main info card ── */}
        <div className="card-business p-8 mb-6 animate-fade-in" data-testid="business-card">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
                {businessName}
              </h1>
              <div className="flex flex-wrap gap-2">
                {business.categoryName && (
                  <span className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {business.categoryName}
                  </span>
                )}
                {business.address?.city && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {business.address.city}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${st.bg} ${st.text}`}>
                  <st.Icon className="w-4 h-4" />
                  {st.label}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {businessDesc && (
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {businessDesc}
            </p>
          )}

          {/* Contact section */}
          <div className="border-t border-border pt-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Coordonnées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Owner ID */}
              <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
                <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Propriétaire</p>
                  <p className="font-mono text-xs text-foreground break-all">{business.ownerId}</p>
                </div>
              </div>

              {/* Address */}
              {address && (
                <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-foreground">
                    {business.address?.street && <p>{business.address.street}</p>}
                    <p>
                      {business.address?.city}
                      {business.address?.province ? `, ${business.address.province}` : ''}
                    </p>
                    {(business.address?.postalCode || business.address?.country) && (
                      <p>{[business.address?.postalCode, business.address?.country].filter(Boolean).join(' · ')}</p>
                    )}
                    {(business.address?.latitude || business.address?.longitude) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {business.address.latitude?.toFixed(5)}, {business.address.longitude?.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Phone */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                >
                  <Phone className="w-5 h-5 text-primary group-hover:text-primary/80" />
                  <span className="text-primary font-medium text-sm">{business.phone}</span>
                </a>
              )}

              {/* Email */}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-primary group-hover:text-primary/80" />
                  <span className="text-primary font-medium text-sm">{business.email}</span>
                </a>
              )}

              {/* Website */}
              {business.website && business.website.match(/^https?:\/\//) && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                >
                  <Globe className="w-5 h-5 text-primary group-hover:text-primary/80" />
                  <span className="text-primary font-medium text-sm flex-1">Visiter le site</span>
                  <ExternalLink className="w-4 h-4 text-primary/60" />
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          {business.tags && business.tags.length > 0 && (
            <div className="border-t border-border pt-6 mt-6">
              <div className="flex flex-wrap gap-2">
                {business.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {business.status === 'Rejected' && business.rejectionReason && (
            <div className="border-t border-border pt-6 mt-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1.5">
                  Motif de rejet
                </p>
                <p className="text-sm text-red-700">{business.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="border-t border-border pt-4 mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Créé le {fmtDate(business.createdAt, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              MAJ le {fmtDate(business.updatedAt, locale)}
            </span>
            {business.publishedAt && (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" />
                Publié le {fmtDate(business.publishedAt, locale)}
              </span>
            )}
          </div>
        </div>

        {/* ── Products card ── */}
        <div className="card-dashboard mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Marchandises
              </h2>
            </div>
            {products !== null && (
              <span className="px-3 py-1 bg-stone-100 text-muted-foreground rounded-full text-xs font-medium">
                {products.totalCount} produit{products.totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!products || products.items.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Aucun produit enregistré pour ce commerce.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border -mx-6 px-0">
              {products.items.map((item) => {
                const firstImg = [...(item.media ?? [])]
                  .sort((a, b) => a.orderIndex - b.orderIndex)[0]?.url;
                return (
                  <li key={item.id} className="px-6 py-3 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                    {firstImg ? (
                      <img
                        src={firstImg}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-stone-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {productTitle(item, locale)}
                      </p>
                      <p className="text-sm text-primary font-semibold">
                        {fmtPrice(item.price, item.currency)}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        PRODUCT_STATUS_BADGE[item.status] ?? 'bg-stone-100 text-stone-600'
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
          <div className="card-dashboard">
            <h3 className="font-heading text-xl font-semibold text-foreground mb-5">
              Décision de modération
            </h3>

            {!approveConfirm ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setApproveConfirm(true); setActionError(null); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approuver
                </button>
                <button
                  onClick={() => { setShowRejectModal(true); setActionError(null); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeter
                </button>
              </div>
            ) : (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm text-emerald-800 mb-4 font-medium">
                  Confirmer la publication de « {businessName} » ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isApproving ? 'Publication…' : 'Confirmer l\'approbation'}
                  </button>
                  <button
                    onClick={() => setApproveConfirm(false)}
                    disabled={isApproving}
                    className="px-5 py-2 border border-border text-muted-foreground rounded-xl hover:bg-stone-50 transition-colors text-sm"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Rejeter le commerce
                </h3>
                <p className="text-sm text-muted-foreground">{businessName}</p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {actionError}
              </div>
            )}

            <label className="block text-sm font-medium text-foreground mb-2">
              Motif de rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Ex : Adresse incomplète, informations insuffisantes…"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none text-sm text-foreground bg-white"
              disabled={isRejecting}
            />
            <p className={`text-xs mt-1 ${rejectionReason.trim().length >= 10 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {rejectionReason.trim().length} / 10 caractères minimum
            </p>

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); setActionError(null); }}
                disabled={isRejecting}
                className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-stone-50 disabled:opacity-50 transition-colors text-muted-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || rejectionReason.trim().length < 10}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRejecting ? 'Rejet en cours…' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
