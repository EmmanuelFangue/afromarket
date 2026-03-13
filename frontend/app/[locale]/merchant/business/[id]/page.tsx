'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { getMerchantBusinessById, submitBusinessForReview } from '../../../../lib/api';
import { MerchantBusiness, BusinessStatus } from '../../../../lib/types';

const STATUS_STYLES: Record<BusinessStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  PendingValidation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const STATUS_LABELS: Record<BusinessStatus, string> = {
  Draft: 'Brouillon',
  PendingValidation: 'En attente de validation',
  Published: 'Publié',
  Rejected: 'Rejeté',
  Suspended: 'Suspendu',
};

export default function MerchantBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1] || 'fr';
  const businessId = params.id as string;

  const { user, isAuthenticated, isLoading } = useAuth();
  const [business, setBusiness] = useState<MerchantBusiness | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setError('Impossible de charger les données du commerce.');
        setLoadingBusiness(false);
      });
  }, [businessId]);

  const handleSubmitForReview = async () => {
    if (!business) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await submitBusinessForReview(business.id);
      setBusiness(updated);
      setSuccessMessage('Commerce soumis à validation avec succès.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingBusiness) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error || 'Commerce non trouvé.'}</p>
      </div>
    );
  }

  const canSubmit = business.status === 'Draft' || business.status === 'Rejected';
  const businessName = typeof business.name === 'object'
    ? (business.name[locale] || business.name['fr'] || Object.values(business.name)[0])
    : business.name;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/${locale}/merchant/dashboard`} className="text-blue-600 hover:underline text-sm">
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Gérer mon commerce</h1>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          {/* Nom + statut */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{String(businessName)}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${STATUS_STYLES[business.status]}`}>
              {STATUS_LABELS[business.status]}
            </span>
          </div>

          {/* Motif de rejet */}
          {business.status === 'Rejected' && business.rejectionReason && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Motif de rejet :</p>
              <p className="text-sm text-red-600 dark:text-red-400">{business.rejectionReason}</p>
            </div>
          )}

          {/* Info sous validation */}
          {business.status === 'PendingValidation' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Votre commerce est en cours d&apos;examen. Un administrateur le validera sous peu.
              </p>
            </div>
          )}

          {/* Détails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2">
            <div><span className="font-medium">Catégorie :</span> {business.categoryName}</div>
            <div><span className="font-medium">Ville :</span> {business.address.city}</div>
            {business.phone && <div><span className="font-medium">Téléphone :</span> {business.phone}</div>}
            {business.email && <div><span className="font-medium">Email :</span> {business.email}</div>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {canSubmit && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? 'Soumission en cours...'
                  : business.status === 'Rejected'
                    ? 'Resoumettre à validation'
                    : 'Soumettre à validation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
