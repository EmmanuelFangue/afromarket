'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { getCategories, createBusiness } from '../../../../lib/api';
import { Category } from '../../../../lib/types';

interface FormData {
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  categoryId: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
}

const INITIAL_FORM: FormData = {
  nameFr: '', nameEn: '', descriptionFr: '', descriptionEn: '',
  categoryId: '', phone: '', email: '', website: '',
  street: '', city: '', province: '', postalCode: '',
  country: 'Canada', latitude: '', longitude: '',
};

export default function NewBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles.includes('merchant'))) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isLoading, isAuthenticated, user, locale, router]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameFr || !form.categoryId || !form.street || !form.city) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const business = await createBusiness({
        name: { fr: form.nameFr, en: form.nameEn || form.nameFr },
        description: { fr: form.descriptionFr, en: form.descriptionEn || form.descriptionFr },
        categoryId: form.categoryId,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        address: {
          street: form.street,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
          country: form.country,
          latitude: form.latitude ? parseFloat(form.latitude) : undefined,
          longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        },
      });
      router.push(`/${locale}/merchant/business/${business.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du commerce.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  const inputClass = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/${locale}/merchant/dashboard`} className="text-blue-600 hover:underline text-sm">
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Enregistrer mon commerce</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">{error}</div>
          )}

          {/* Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom du commerce (Français) *</label>
              <input type="text" value={form.nameFr} onChange={handleChange('nameFr')} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Nom du commerce (Anglais)</label>
              <input type="text" value={form.nameEn} onChange={handleChange('nameEn')} className={inputClass} />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Description (Français)</label>
              <textarea value={form.descriptionFr} onChange={handleChange('descriptionFr')} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description (Anglais)</label>
              <textarea value={form.descriptionEn} onChange={handleChange('descriptionEn')} rows={3} className={inputClass} />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className={labelClass}>Catégorie *</label>
            <select value={form.categoryId} onChange={handleChange('categoryId')} className={inputClass} required>
              <option value="">-- Sélectionner une catégorie --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Téléphone</label>
              <input type="tel" value={form.phone} onChange={handleChange('phone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={handleChange('email')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Site web (optionnel)</label>
              <input type="url" value={form.website} onChange={handleChange('website')} className={inputClass} />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Adresse</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Adresse *</label>
                <input type="text" value={form.street} onChange={handleChange('street')} className={inputClass} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ville *</label>
                  <input type="text" value={form.city} onChange={handleChange('city')} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Province</label>
                  <input type="text" value={form.province} onChange={handleChange('province')} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Code postal</label>
                  <input type="text" value={form.postalCode} onChange={handleChange('postalCode')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pays</label>
                  <input type="text" value={form.country} onChange={handleChange('country')} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Latitude</label>
                  <input type="number" step="any" value={form.latitude} onChange={handleChange('latitude')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input type="number" step="any" value={form.longitude} onChange={handleChange('longitude')} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer mon commerce'}
          </button>
        </form>
      </div>
    </div>
  );
}
