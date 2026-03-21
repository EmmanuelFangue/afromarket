'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getBusinessById } from '../../../lib/api';
import { Business } from '../../../lib/types';
import ContactForm from '../../../components/ContactForm';
import { MapPin, Phone, Mail, Globe, ArrowLeft } from 'lucide-react';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('businessDetails');

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinessById(params.id as string, abortController.signal);

        if (!data) {
          setError(t('notFound'));
          return;
        }

        setBusiness(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching business:', err);
          setError(t('error'));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (params.id) {
      fetchBusiness();
    }

    return () => {
      abortController.abort();
    };
  }, [params.id, t]);

  const getBusinessName = (business: Business): string => {
    try {
      const translations = typeof business.nameTranslations === 'string'
        ? JSON.parse(business.nameTranslations)
        : business.nameTranslations;
      return translations[locale] || translations['fr'] || business.name || '';
    } catch {
      return business.name || '';
    }
  };

  const getBusinessDescription = (business: Business): string => {
    try {
      const translations = typeof business.descriptionTranslations === 'string'
        ? JSON.parse(business.descriptionTranslations)
        : business.descriptionTranslations;
      return translations[locale] || translations['fr'] || business.description || '';
    } catch {
      return business.description || '';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-primary hover:text-primary/80 flex items-center gap-2 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToSearch')}
        </button>
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl">
          {error || t('notFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-primary hover:text-primary/80 flex items-center gap-2 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToSearch')}
      </button>

      {/* Business header */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-8 mb-6">
        <h1 className="font-heading text-3xl font-bold text-card-foreground mb-4">
          {getBusinessName(business)}
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {business.categoryName}
          </span>
          <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
            {business.city}
          </span>
        </div>

        <p className="text-foreground text-lg leading-relaxed mb-6">
          {getBusinessDescription(business)}
        </p>

        {/* Contact section */}
        <div className="border-t border-border pt-6">
          <h2 className="font-heading text-xl font-semibold text-card-foreground mb-4">
            {t('contact')}
          </h2>

          <div className="space-y-3">
            {business.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">{business.address}</span>
              </div>
            )}

            {business.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                  {business.phone}
                </a>
              </div>
            )}

            {business.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                <a href={`mailto:${business.email}`} className="text-primary hover:underline">
                  {business.email}
                </a>
              </div>
            )}

            {business.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
                {business.website.match(/^https?:\/\//) ? (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {t('website')}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{business.website}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {business.tags && business.tags.length > 0 && (
          <div className="border-t border-border pt-6 mt-6">
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Form */}
      <ContactForm
        businessId={business.id}
        businessName={getBusinessName(business)}
      />
    </div>
  );
}
