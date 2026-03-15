'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { getCategories, createBusiness } from '../../../../lib/api';
import { Category } from '../../../../lib/types';
import { ArrowLeft, ArrowRight, Check, UtensilsCrossed, ShoppingBag, Scissors, Shirt, ChefHat, MapPin, Phone, Mail, Globe, Tag, Loader2 } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'restaurant': UtensilsCrossed,
  'grocery': ShoppingBag,
  'hair': Scissors,
  'clothing': Shirt,
  'catering': ChefHat,
};

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
  tags: string[];
}

const INITIAL_FORM: FormData = {
  nameFr: '', nameEn: '', descriptionFr: '', descriptionEn: '',
  categoryId: '', phone: '', email: '', website: '',
  street: '', city: '', province: 'Québec', postalCode: '',
  country: 'Canada', tags: [],
};

const STEPS = [
  { id: 1, key: 'identity', icon: UtensilsCrossed },
  { id: 2, key: 'location', icon: MapPin },
  { id: 3, key: 'contact', icon: Phone },
];

export default function NewBusinessWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const { user, isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const t = {
    fr: {
      title: 'Enregistrer mon commerce',
      steps: { identity: 'Identité', location: 'Localisation', contact: 'Contact & Confirmation' },
      nameFr: 'Nom du commerce (Français)',
      nameEn: 'Nom du commerce (Anglais)',
      descFr: 'Description (Français)',
      descEn: 'Description (Anglais)',
      category: 'Catégorie',
      selectCategory: 'Sélectionnez une catégorie',
      street: 'Adresse',
      city: 'Ville',
      province: 'Province',
      postalCode: 'Code postal',
      country: 'Pays',
      phone: 'Téléphone',
      email: 'Email',
      website: 'Site web (optionnel)',
      tags: 'Tags (mots-clés)',
      tagsPlaceholder: 'Appuyez sur Entrée pour ajouter',
      back: 'Retour',
      next: 'Suivant',
      saveDraft: 'Enregistrer en brouillon',
      create: 'Créer mon commerce',
      creating: 'Création en cours...',
      required: 'Champs requis',
      optional: 'Optionnel',
      summary: 'Résumé',
      validation: {
        nameFr: 'Le nom en français est requis',
        category: 'La catégorie est requise',
        street: 'L\'adresse est requise',
        city: 'La ville est requise',
      },
      backToDashboard: 'Retour au tableau de bord',
    },
    en: {
      title: 'Register my business',
      steps: { identity: 'Identity', location: 'Location', contact: 'Contact & Confirmation' },
      nameFr: 'Business name (French)',
      nameEn: 'Business name (English)',
      descFr: 'Description (French)',
      descEn: 'Description (English)',
      category: 'Category',
      selectCategory: 'Select a category',
      street: 'Address',
      city: 'City',
      province: 'Province',
      postalCode: 'Postal code',
      country: 'Country',
      phone: 'Phone',
      email: 'Email',
      website: 'Website (optional)',
      tags: 'Tags (keywords)',
      tagsPlaceholder: 'Press Enter to add',
      back: 'Back',
      next: 'Next',
      saveDraft: 'Save as draft',
      create: 'Create my business',
      creating: 'Creating...',
      required: 'Required fields',
      optional: 'Optional',
      summary: 'Summary',
      validation: {
        nameFr: 'French name is required',
        category: 'Category is required',
        street: 'Address is required',
        city: 'City is required',
      },
      backToDashboard: 'Back to dashboard',
    }
  }[locale];

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

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const validateStep = (stepNum: number): boolean => {
    setError(null);
    if (stepNum === 1) {
      if (!form.nameFr) { setError(t.validation.nameFr); return false; }
      if (!form.categoryId) { setError(t.validation.category); return false; }
    }
    if (stepNum === 2) {
      if (!form.street) { setError(t.validation.street); return false; }
      if (!form.city) { setError(t.validation.city); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step) && step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

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
        },
        tags: form.tags.length > 0 ? form.tags : undefined,
      });
      router.push(`/${locale}/merchant/business/${business.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du commerce.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === form.categoryId);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back link */}
        <Link
          href={`/${locale}/merchant/dashboard`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToDashboard}
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8">{t.title}</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10" data-testid="wizard-progress">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-3 ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step > s.id ? 'bg-primary text-white' : step === s.id ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`hidden sm:block font-medium ${step === s.id ? 'text-primary' : ''}`}>
                  {t.steps[s.key as keyof typeof t.steps]}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-12 md:w-24 h-1 mx-2 md:mx-4 rounded ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="card-dashboard">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl" data-testid="form-error">
              {error}
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in" data-testid="step-identity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.nameFr} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nameFr}
                    onChange={handleChange('nameFr')}
                    className="input-default"
                    data-testid="input-name-fr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.nameEn} <span className="text-muted-foreground text-xs">({t.optional})</span>
                  </label>
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={handleChange('nameEn')}
                    className="input-default"
                    data-testid="input-name-en"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t.category} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const IconComponent = CATEGORY_ICONS[cat.name.toLowerCase().includes('restaurant') ? 'restaurant' :
                      cat.name.toLowerCase().includes('épicerie') || cat.name.toLowerCase().includes('grocery') ? 'grocery' :
                      cat.name.toLowerCase().includes('coiffure') || cat.name.toLowerCase().includes('hair') ? 'hair' :
                      cat.name.toLowerCase().includes('vêtement') || cat.name.toLowerCase().includes('clothing') ? 'clothing' : 'catering'] || ChefHat;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, categoryId: cat.id }))}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          form.categoryId === cat.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid={`category-btn-${cat.id}`}
                      >
                        <IconComponent className={`w-6 h-6 mb-2 ${form.categoryId === cat.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`text-sm font-medium ${form.categoryId === cat.id ? 'text-primary' : 'text-foreground'}`}>
                          {cat.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t.descFr}</label>
                  <textarea
                    value={form.descriptionFr}
                    onChange={handleChange('descriptionFr')}
                    rows={4}
                    className="input-default h-auto py-3"
                    data-testid="input-desc-fr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.descEn} <span className="text-muted-foreground text-xs">({t.optional})</span>
                  </label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={handleChange('descriptionEn')}
                    rows={4}
                    className="input-default h-auto py-3"
                    data-testid="input-desc-en"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in" data-testid="step-location">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t.street} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.street}
                    onChange={handleChange('street')}
                    className="input-default pl-12"
                    data-testid="input-street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.city} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={handleChange('city')}
                    className="input-default"
                    data-testid="input-city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t.province}</label>
                  <select
                    value={form.province}
                    onChange={handleChange('province')}
                    className="input-default"
                    data-testid="input-province"
                  >
                    <option value="Québec">Québec</option>
                    <option value="Ontario">Ontario</option>
                    <option value="British Columbia">British Columbia</option>
                    <option value="Alberta">Alberta</option>
                    <option value="Manitoba">Manitoba</option>
                    <option value="Saskatchewan">Saskatchewan</option>
                    <option value="Nova Scotia">Nova Scotia</option>
                    <option value="New Brunswick">New Brunswick</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t.postalCode}</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={handleChange('postalCode')}
                    className="input-default"
                    placeholder="H2X 1Y4"
                    data-testid="input-postal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t.country}</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={handleChange('country')}
                    className="input-default"
                    disabled
                    data-testid="input-country"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Confirmation */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in" data-testid="step-contact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      className="input-default pl-12"
                      placeholder="+1 (514) 555-0123"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      className="input-default pl-12"
                      data-testid="input-email"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t.website}</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={handleChange('website')}
                    className="input-default pl-12"
                    placeholder="https://"
                    data-testid="input-website"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t.tags}</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagAdd}
                    className="input-default pl-12"
                    placeholder={t.tagsPlaceholder}
                    data-testid="input-tags"
                  />
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200" data-testid="summary-card">
                <h3 className="font-heading font-semibold text-foreground mb-4">{t.summary}</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t.nameFr}:</dt>
                    <dd className="font-medium text-foreground">{form.nameFr || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t.category}:</dt>
                    <dd className="font-medium text-foreground">{selectedCategory?.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t.city}:</dt>
                    <dd className="font-medium text-foreground">{form.city || '-'}</dd>
                  </div>
                  {form.phone && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t.phone}:</dt>
                      <dd className="font-medium text-foreground">{form.phone}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={prevStep}
              className={`btn-outline flex items-center gap-2 ${step === 1 ? 'invisible' : ''}`}
              data-testid="btn-prev"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </button>

            <div className="flex items-center gap-3">
              {step === 3 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
                  data-testid="btn-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.creating}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {t.create}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary flex items-center gap-2"
                  data-testid="btn-next"
                >
                  {t.next}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
