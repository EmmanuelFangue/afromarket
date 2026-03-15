import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe, Tag, ExternalLink, ArrowLeft } from 'lucide-react';
import ContactForm from '../../../components/ContactForm';
import ProductsSection from './products-section';
import { Business, BusinessProductsResponse } from '../../../lib/types';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchBusiness(id: string): Promise<Business | null> {
  try {
    const res = await fetch(`${API_URL}/api/business/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};
    return {
      ...data,
      city: addr.city ?? '',
      address: [addr.street, addr.city, addr.province].filter(Boolean).join(', '),
      location: { lat: addr.latitude ?? 0, lon: addr.longitude ?? 0 },
    } as Business;
  } catch {
    return null;
  }
}

async function fetchProducts(
  businessId: string,
  page: number,
  sort: string
): Promise<BusinessProductsResponse> {
  try {
    const params = new URLSearchParams({
      businessId,
      page: String(page),
      pageSize: '12',
      sort,
    });
    const res = await fetch(`${API_URL}/api/products?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
    return res.json();
  } catch {
    return { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  }
}

function getBusinessName(biz: Business, locale: string): string {
  try {
    const tr = typeof biz.nameTranslations === 'string' ? JSON.parse(biz.nameTranslations) : biz.nameTranslations;
    return tr[locale] || tr['fr'] || biz.name || '';
  } catch {
    return biz.name || '';
  }
}

function getBusinessDescription(biz: Business, locale: string): string {
  try {
    const tr = typeof biz.descriptionTranslations === 'string' ? JSON.parse(biz.descriptionTranslations) : biz.descriptionTranslations;
    return tr[locale] || tr['fr'] || biz.description || '';
  } catch {
    return biz.description || '';
  }
}

interface PageProps {
  params: { locale: string; id: string };
  searchParams: { page?: string; sort?: string };
}

export default async function BusinessDetailPage({ params, searchParams }: PageProps) {
  const locale = params.locale || 'fr';
  const page = Number(searchParams?.page ?? 1);
  const sort = searchParams?.sort ?? 'relevance';

  const business = await fetchBusiness(params.id);
  if (!business) notFound();

  const initialProducts = await fetchProducts(business.id, page, sort);

  const businessName = getBusinessName(business, locale);
  const businessDescription = getBusinessDescription(business, locale);

  const t = locale === 'en'
    ? { backToSearch: 'Back to search', contact: 'Contact', website: 'Visit website' }
    : { backToSearch: 'Retour à la recherche', contact: 'Contact', website: 'Visiter le site web' };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
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
        {/* Back button */}
        <Link
          href={`/${locale}/search`}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors drop-shadow"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSearch}
        </Link>

        {/* Main Card */}
        <div className="card-business p-8 mb-6 animate-fade-in" data-testid="business-card">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1
                className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3"
                data-testid="business-name"
              >
                {businessName}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {business.categoryName}
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  {business.city}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {businessDescription && (
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {businessDescription}
            </p>
          )}

          {/* Contact Section */}
          <div className="border-t border-border pt-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">{t.contact}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {business.address && (
                <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-foreground text-sm">{business.address}</span>
                </div>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                  data-testid="business-phone"
                >
                  <Phone className="w-5 h-5 text-primary group-hover:text-primary/80" />
                  <span className="text-primary font-medium text-sm">{business.phone}</span>
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                  data-testid="business-email"
                >
                  <Mail className="w-5 h-5 text-primary group-hover:text-primary/80" />
                  <span className="text-primary font-medium text-sm">{business.email}</span>
                </a>
              )}
              {business.website && business.website.match(/^https?:\/\//) && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
                  data-testid="business-website"
                >
                  <Globe className="w-5 h-5 text-primary group-hover:text-primary/80" />
                  <span className="text-primary font-medium text-sm flex-1">{t.website}</span>
                  <ExternalLink className="w-4 h-4 text-primary/60" />
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          {business.tags && business.tags.length > 0 && (
            <div className="border-t border-border pt-6 mt-6">
              <div className="flex flex-wrap gap-2">
                {business.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products Section — client component for sort + pagination */}
        <ProductsSection
          businessId={business.id}
          initialData={initialProducts}
          initialPage={page}
          initialSort={sort}
          locale={locale}
        />

        {/* Contact Form */}
        <ContactForm businessId={business.id} businessName={businessName} />
      </div>
    </div>
  );
}
