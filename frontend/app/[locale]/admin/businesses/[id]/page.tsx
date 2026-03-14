'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { getMerchantBusinessById, approveBusiness, rejectBusiness } from '../../../../lib/api';
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

export default function AdminBusinessDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = pathname.split('/')[1] || 'fr';
  const businessId = params.id as string;

  const { user, isAuthenticated, isLoading } = useAuth();
  const [business, setBusiness] = useState<MerchantBusiness | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('admin'))) {
      router.push(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  useEffect(() => {
    if (!businessId) return;
    getMerchantBusinessById(businessId)
      .then(data => {
        setBusiness(data);
        setLoadingBiz(false);
      })
      .catch(() => {
        setError('Impossible de charger les données du commerce.');
        setLoadingBiz(false);
      });
  }, [businessId]);

  const handleApprove = async () => {
    if (!business) return;
    if (!confirm('Confirmer l\'approbation de ce commerce ?')) return;
    setIsApproving(true);
    setError(null);
    try {
      const updated = await approveBusiness(business.id);
      setBusiness(updated);
      setSuccessMessage('Commerce approuvé avec succès.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'approbation.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!business) return;
    if (rejectionReason.trim().length < 10) {
      setError('Le motif de rejet doit comporter au moins 10 caractères.');
      return;
    }
    setIsRejecting(true);
    setError(null);
    try {
      const updated = await rejectBusiness(business.id, rejectionReason.trim());
      setBusiness(updated);
      setSuccessMessage('Commerce rejeté.');
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading || loadingBiz) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error || 'Commerce non trouvé.'}</p>
      </div>
    );
  }

  const businessName = typeof business.name === 'object'
    ? (business.name[locale] || business.name['fr'] || Object.values(business.name)[0])
    : business.name;
  const businessDescription = typeof business.description === 'object'
    ? (business.description[locale] || business.description['fr'] || Object.values(business.description)[0])
    : business.description;

  const canAct = business.status === 'PendingValidation';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/${locale}/admin/businesses`} className="text-blue-600 hover:underline text-sm">
            ← Retour à la liste
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Détail du commerce</h1>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg">
            {successMessage}
          </div>
        )}
        {error && !showRejectModal && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{String(businessName)}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{business.categoryName}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${STATUS_STYLES[business.status]}`}>
              {STATUS_LABELS[business.status]}
            </span>
          </div>

          {/* Description */}
          {businessDescription && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{String(businessDescription)}</p>
            </div>
          )}

          {/* Coordonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-gray-700 dark:text-gray-300">Coordonnées</p>
              {business.phone && <p className="text-gray-600 dark:text-gray-400">Tél : {business.phone}</p>}
              {business.email && <p className="text-gray-600 dark:text-gray-400">Email : {business.email}</p>}
              {business.website && <p className="text-gray-600 dark:text-gray-400">Site : {business.website}</p>}
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700 dark:text-gray-300">Adresse</p>
              <p className="text-gray-600 dark:text-gray-400">
                {business.address.street}<br />
                {business.address.city}{business.address.province ? `, ${business.address.province}` : ''}<br />
                {business.address.postalCode} {business.address.country}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-3">
            Créé le {new Date(business.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
            {' · '}
            Mis à jour le {new Date(business.updatedAt).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA')}
          </div>

          {/* Actions */}
          {canAct && (
            <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproving ? 'Approbation...' : 'Approuver'}
              </button>
              <button
                onClick={() => { setShowRejectModal(true); setError(null); }}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Rejeter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de rejet */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirmer le rejet</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motif de rejet *
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Veuillez expliquer pourquoi ce commerce est rejeté..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{rejectionReason.length} / min. 10 caractères</p>

            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); setError(null); }}
                disabled={isRejecting}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || rejectionReason.trim().length < 10}
                className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
