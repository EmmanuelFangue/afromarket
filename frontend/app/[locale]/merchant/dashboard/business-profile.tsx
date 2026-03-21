'use client';

import { useState } from 'react';
import { BusinessDetail, BusinessStatus } from '../../../lib/types';
import { updateBusiness } from '../../../lib/api';

interface Props {
  business: BusinessDetail;
  locale: string;
  onUpdated: (b: BusinessDetail) => void;
}

const STATUS_LABELS: Record<number, { label: string; className: string }> = {
  [BusinessStatus.Draft]: { label: 'Brouillon', className: 'status-draft' },
  [BusinessStatus.PendingValidation]: { label: 'En attente', className: 'status-pending' },
  [BusinessStatus.Published]: { label: 'Publié', className: 'status-published' },
  [BusinessStatus.Rejected]: { label: 'Rejeté', className: 'status-rejected' },
  [BusinessStatus.Suspended]: { label: 'Suspendu', className: 'status-suspended' },
};

const canEdit = (status: number) =>
  status === BusinessStatus.Draft || status === BusinessStatus.Rejected;

const inputClass = 'w-full px-3 py-2 border border-border rounded-xl bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors';

export default function BusinessProfile({ business, locale, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nameFr: tryParseTranslation(business.nameTranslations, 'fr') || business.name,
    nameEn: tryParseTranslation(business.nameTranslations, 'en') || '',
    descriptionFr: tryParseTranslation(business.descriptionTranslations, 'fr') || business.description,
    descriptionEn: tryParseTranslation(business.descriptionTranslations, 'en') || '',
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || '',
    tags: business.tags.join(', '),
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBusiness(business.id, {
        nameTranslations: { fr: form.nameFr, en: form.nameEn },
        descriptionTranslations: { fr: form.descriptionFr, en: form.descriptionEn },
        phone: form.phone,
        email: form.email,
        website: form.website,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onUpdated(updated);
      setIsEditing(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = STATUS_LABELS[business.status] ?? { label: String(business.status), className: 'status-draft' };

  return (
    <div className="space-y-6">
      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{business.name}</h2>
          <p className="text-sm text-muted-foreground">{business.categoryName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          {canEdit(business.status) && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {business.status === BusinessStatus.Rejected && business.rejectionReason && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="text-sm font-medium text-destructive">Motif de rejet :</p>
          <p className="text-sm text-destructive/80 mt-1">{business.rejectionReason}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nom (français)
              </label>
              <input
                value={form.nameFr}
                onChange={e => setForm(f => ({ ...f, nameFr: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nom (anglais)
              </label>
              <input
                value={form.nameEn}
                onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (français)
            </label>
            <textarea
              value={form.descriptionFr}
              onChange={e => setForm(f => ({ ...f, descriptionFr: e.target.value }))}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (anglais)
            </label>
            <textarea
              value={form.descriptionEn}
              onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Site web</label>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="cuisine, africain, plats chauds"
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setIsEditing(false); setError(null); }}
              className="px-4 py-2 text-sm text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      ) : (
        /* Read-only view */
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-foreground">{business.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {business.phone && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Téléphone</h3>
                <p className="text-foreground">{business.phone}</p>
              </div>
            )}
            {business.email && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                <p className="text-foreground">{business.email}</p>
              </div>
            )}
            {business.website && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Site web</h3>
                <a href={business.website} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:underline break-all">
                  {business.website}
                </a>
              </div>
            )}
          </div>

          {business.address && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Adresse</h3>
              <p className="text-foreground">
                {[business.address.street, business.address.city, business.address.province, business.address.country]
                  .filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {business.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {business.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-sm rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!canEdit(business.status) && (
            <p className="text-sm text-muted-foreground italic">
              {business.status === BusinessStatus.Published
                ? 'La modification est disponible uniquement pour les commerces en brouillon ou rejetés.'
                : 'Ce commerce ne peut pas être modifié dans son état actuel.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function tryParseTranslation(raw: string, lang: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed[lang] ?? null;
  } catch {
    return null;
  }
}
