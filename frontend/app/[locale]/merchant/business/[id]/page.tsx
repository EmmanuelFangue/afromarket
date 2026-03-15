'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { getMerchantBusinessById, submitBusinessForReview } from '../../../../lib/api';
import { MerchantBusiness, BusinessStatus } from '../../../../lib/types';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Eye, Package, Send, MapPin, Phone, Mail, Globe, Tag, Loader2 } from 'lucide-react';

const STATUS_CONFIG: Record<BusinessStatus, { label: { fr: string; en: string }; class: string; icon: React.ComponentType<any>; bannerClass: string }> = {
  Draft: { label: { fr: 'Brouillon', en: 'Draft' }, class: 'status-draft', icon: Clock, bannerClass: '' },
  PendingValidation: { label: { fr: 'En attente de validation', en: 'Pending Review' }, class: 'status-pending', icon: Clock, bannerClass: 'bg-amber-50 border-amber-200' },
  Published: { label: { fr: 'Publié', en: 'Published' }, class: 'status-published', icon: CheckCircle, bannerClass: 'bg-emerald-50 border-emerald-200' },
  Rejected: { label: { fr: 'Rejeté', en: 'Rejected' }, class: 'status-rejected', icon: XCircle, bannerClass: 'bg-red-50 border-red-200' },
  Suspended: { label: { fr: 'Suspendu', en: 'Suspended' }, class: 'status-suspended', icon: AlertCircle, bannerClass: 'bg-orange-50 border-orange-200' },
};

export default function MerchantBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const businessId = params.id as string;

  const { user, isAuthenticated, isLoading } = useAuth();
  const [business, setBusiness] = useState<MerchantBusiness | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const t = {
    fr: {
      title: 'Gérer mon commerce',
      backToDashboard: 'Retour au tableau de bord',
      submitForReview: 'Soumettre pour validation',
      resubmit: 'Corriger et resoumettre',
      underReview: 'Votre commerce est en cours d\'examen. Un administrateur le validera sous peu.',
      viewPublic: 'Voir la page publique',
      manageProducts: 'Gérer les produits',
      rejectionReason: 'Motif de rejet',
      submitting: 'Soumission en cours...',
      submitSuccess: 'Commerce soumis à validation avec succès.',
      notFound: 'Commerce non trouvé.',
      category: 'Catégorie',
      address: 'Adresse',
      contact: 'Contact',
      tags: 'Tags',
      description: 'Description',
    },
    en: {
      title: 'Manage my business',
      backToDashboard: 'Back to dashboard',
      submitForReview: 'Submit for review',
      resubmit: 'Correct and resubmit',
      underReview: 'Your business is under review. An administrator will validate it shortly.',
      viewPublic: 'View public page',
      manageProducts: 'Manage products',
      rejectionReason: 'Rejection reason',
      submitting: 'Submitting...',
      submitSuccess: 'Business submitted for review successfully.',
      notFound: 'Business not found.',
      category: 'Category',
      address: 'Address',
      contact: 'Contact',
      tags: 'Tags',
      description: 'Description',
    }
  }[locale];

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('merchant'))) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  useEffect(() => {
    if (!businessId) return;
    getMerchantBusinessById(businessId)
      .then(data => {
        setBusiness(data);
        setLoadingBusiness(false);
      })
      .catch(() => {
        setError(t.notFound);
        setLoadingBusiness(false);
      });
  }, [businessId]);

  const handleSubmitForReview = async () => {
    if (!business) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await submitBusinessForReview(business.id);
      setBusiness(updated);
      setSuccessMessage(t.submitSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || t.notFound}</p>
          <Link href={`/${locale}/merchant/dashboard`} className="btn-primary">
            {t.backToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = business.status === 'Draft' || business.status === 'Rejected';
  const businessName = typeof business.name === 'object'
    ? (business.name[locale] || business.name['fr'] || Object.values(business.name)[0])
    : business.name;
  const businessDesc = typeof business.description === 'object'
    ? (business.description[locale] || business.description['fr'] || Object.values(business.description)[0])
    : business.description;
  const StatusIcon = STATUS_CONFIG[business.status].icon;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Back link */}
        <Link
          href={`/${locale}/merchant/dashboard`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToDashboard}
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2" data-testid="business-name">
              {String(businessName)}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[business.status].class}`}>
              <StatusIcon className="w-4 h-4" />
              {STATUS_CONFIG[business.status].label[locale]}
            </span>
          </div>
        </div>

        {/* Success/Error alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 animate-fade-in" data-testid="success-message">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl" data-testid="error-message">
            {error}
          </div>
        )}

        {/* Status-specific banners */}
        {business.status === 'Rejected' && business.rejectionReason && (
          <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-2xl animate-fade-in" data-testid="rejection-banner">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 mb-1">{t.rejectionReason}</p>
                <p className="text-red-700">{business.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {business.status === 'PendingValidation' && (
          <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in" data-testid="pending-banner">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800">{t.underReview}</p>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="card-dashboard mb-6" data-testid="action-bar">
          <div className="flex flex-wrap gap-3">
            {canSubmit && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
                data-testid="submit-review-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {business.status === 'Rejected' ? t.resubmit : t.submitForReview}
                  </>
                )}
              </button>
            )}
            {business.status === 'Published' && (
              <>
                <Link
                  href={`/${locale}/business/${business.id}`}
                  className="btn-outline flex items-center gap-2"
                  data-testid="view-public-btn"
                >
                  <Eye className="w-5 h-5" />
                  {t.viewPublic}
                </Link>
                <Link
                  href={`/${locale}/merchant/products?businessId=${business.id}`}
                  className="btn-primary flex items-center gap-2"
                  data-testid="manage-products-btn"
                >
                  <Package className="w-5 h-5" />
                  {t.manageProducts}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Category */}
          <div className="card-dashboard">
            <h3 className="font-heading font-semibold text-foreground mb-3">{t.category}</h3>
            <p className="text-muted-foreground">{business.categoryName}</p>
          </div>

          {/* Address */}
          <div className="card-dashboard">
            <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {t.address}
            </h3>
            <address className="text-muted-foreground not-italic leading-relaxed text-sm">
              {business.address.street}<br />
              {business.address.city}, {business.address.province} {business.address.postalCode}<br />
              {business.address.country}
            </address>
          </div>

          {/* Contact */}
          <div className="card-dashboard">
            <h3 className="font-heading font-semibold text-foreground mb-3">{t.contact}</h3>
            <div className="space-y-2">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone className="w-4 h-4" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="w-4 h-4" />
                  {business.email}
                </a>
              )}
              {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" />
                  {business.website}
                </a>
              )}
              {!business.phone && !business.email && !business.website && (
                <p className="text-muted-foreground text-sm">—</p>
              )}
            </div>
          </div>

          {/* Tags */}
          {business.tags && business.tags.length > 0 && (
            <div className="card-dashboard">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {t.tags}
              </h3>
              <div className="flex flex-wrap gap-2">
                {business.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {businessDesc && (
          <div className="card-dashboard">
            <h3 className="font-heading font-semibold text-foreground mb-3">{t.description}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{String(businessDesc)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
