import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Store, ChevronRight, Tag, MapPin } from 'lucide-react';
import ProductGallery from './product-gallery';
import { ProductDetail } from '../../../lib/types';

export const revalidate = 120;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchProduct(id: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getLocalizedText(
  jsonString: string,
  fallback: string,
  locale: string,
): string {
  try {
    const tr =
      typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return tr[locale] || tr['fr'] || fallback;
  } catch {
    return fallback;
  }
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, id } = await params;
  const locale = localeParam === 'en' ? 'en' : 'fr';
  const product = await fetchProduct(id);

  if (!product || product.status !== 'Active') {
    return { title: locale === 'fr' ? 'Produit introuvable' : 'Product not found' };
  }

  const title = getLocalizedText(product.titleTranslations, product.title, locale);
  const description = getLocalizedText(
    product.descriptionTranslations,
    product.description,
    locale,
  ).substring(0, 160);
  const firstImage = product.media[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: firstImage ? [{ url: firstImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstImage ? [firstImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale: localeParam, id } = await params;
  const locale = (localeParam === 'en' ? 'en' : 'fr') as 'fr' | 'en';

  const product = await fetchProduct(id);

  if (!product || product.status !== 'Active') {
    notFound();
  }

  console.log(
    JSON.stringify({
      event: 'product_view',
      productId: product.id,
      businessId: product.businessId,
      locale,
      timestamp: new Date().toISOString(),
    }),
  );

  const t = {
    fr: {
      backToSearch: 'Retour à la recherche',
      availability: 'Disponibilité',
      available: 'Disponible',
      unavailable: 'Indisponible',
      sku: 'Référence',
      soldBy: 'Vendu par',
      viewBusiness: 'Voir le commerce',
      description: 'Description',
    },
    en: {
      backToSearch: 'Back to search',
      availability: 'Availability',
      available: 'Available',
      unavailable: 'Unavailable',
      sku: 'SKU',
      soldBy: 'Sold by',
      viewBusiness: 'View business',
      description: 'Description',
    },
  }[locale];

  const title = getLocalizedText(product.titleTranslations, product.title, locale);
  const description = getLocalizedText(
    product.descriptionTranslations,
    product.description,
    locale,
  );

  const formattedPrice = (() => {
    try {
      return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: product.currency || 'CAD',
      }).format(product.price);
    } catch {
      return `${product.price} ${product.currency}`;
    }
  })();

  const sortedMedia = [...product.media].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Back link */}
        <Link
          href={`/${locale}/search`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          data-testid="back-link"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t.backToSearch}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image gallery — client component for interactivity */}
          <ProductGallery media={sortedMedia} title={title} />

          {/* Product info */}
          <div className="space-y-6" data-testid="product-info">
            {/* Title & price */}
            <div>
              <h1
                className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3"
                data-testid="product-title"
              >
                {title}
              </h1>
              <p className="font-heading text-4xl font-bold text-primary" data-testid="product-price">
                {formattedPrice}
              </p>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
              {product.isAvailable ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t.availability}</p>
                    <p className="font-semibold text-emerald-700">{t.available}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-stone-400" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t.availability}</p>
                    <p className="font-semibold text-stone-500">{t.unavailable}</p>
                  </div>
                </>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">{t.sku}:</span>
                <span className="text-sm font-mono text-foreground">{product.sku}</span>
              </div>
            )}

            {/* Sold by */}
            <div className="border-t border-border pt-5">
              <p className="text-sm text-muted-foreground mb-3">{t.soldBy}</p>
              <Link
                href={`/${locale}/business/${product.businessId}`}
                className="inline-flex items-center gap-3 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors group w-full"
                data-testid="sold-by-link"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{product.businessName}</p>
                  {product.businessCity && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" aria-hidden="true" />
                      {product.businessCity}
                    </p>
                  )}
                  <p className="text-xs text-primary mt-0.5">{t.viewBusiness}</p>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="card-dashboard mt-8" data-testid="product-description">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
              {t.description}
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
