'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getPublicProductById } from '../../../lib/api';
import { ProductDetail } from '../../../lib/types';
import { ArrowLeft, Package, CheckCircle, XCircle, Store, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const t = {
    fr: {
      backToSearch: 'Retour à la recherche',
      notFound: 'Produit non trouvé',
      error: 'Impossible de charger ce produit',
      loading: 'Chargement...',
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
      notFound: 'Product not found',
      error: 'Failed to load this product',
      loading: 'Loading...',
      availability: 'Availability',
      available: 'Available',
      unavailable: 'Unavailable',
      sku: 'SKU',
      soldBy: 'Sold by',
      viewBusiness: 'View business',
      description: 'Description',
    }
  }[locale];

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicProductById(params.id as string, abortController.signal);
        if (!data) {
          setError(t.notFound);
          return;
        }
        setProduct(data);
        setActiveImageIndex(0);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(t.error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (params.id) {
      fetchProduct();
    }

    return () => abortController.abort();
  }, [params.id]);

  const getLocalizedText = (jsonString: string, fallback: string): string => {
    try {
      const tr = JSON.parse(jsonString);
      return tr[locale] || tr['fr'] || fallback;
    } catch {
      return fallback;
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    try {
      return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency }).format(price);
    } catch {
      return `${price} ${currency}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-4 w-32 bg-stone-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-stone-200 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-stone-200 rounded-xl w-3/4 animate-pulse" />
              <div className="h-10 bg-stone-200 rounded-xl w-1/3 animate-pulse" />
              <div className="h-6 bg-stone-200 rounded-xl w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToSearch}
          </button>
          <div className="card-dashboard text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-500">{error || t.notFound}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedMedia = [...product.media].sort((a, b) => a.orderIndex - b.orderIndex);
  const title = getLocalizedText(product.titleTranslations, product.title);
  const description = getLocalizedText(product.descriptionTranslations, product.description);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSearch}
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          {/* Image Gallery */}
          <div className="space-y-3" data-testid="product-gallery">
            {sortedMedia.length > 0 ? (
              <>
                {/* Main image */}
                <div className="relative aspect-square bg-stone-100 rounded-2xl overflow-hidden group">
                  <img
                    src={sortedMedia[activeImageIndex].url}
                    alt={sortedMedia[activeImageIndex].altText || title}
                    className="w-full h-full object-cover"
                  />
                  {/* Navigation arrows for multiple images */}
                  {sortedMedia.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(i => Math.max(0, i - 1))}
                        disabled={activeImageIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md disabled:opacity-30 hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(i => Math.min(sortedMedia.length - 1, i + 1))}
                        disabled={activeImageIndex === sortedMedia.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md disabled:opacity-30 hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-foreground" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {sortedMedia.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {sortedMedia.map((media, index) => (
                      <button
                        key={media.id}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          index === activeImageIndex
                            ? 'border-primary shadow-sm scale-105'
                            : 'border-transparent hover:border-stone-300'
                        }`}
                        data-testid={`thumbnail-${index}`}
                      >
                        <img
                          src={media.url}
                          alt={media.altText || `${title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* No image placeholder */
              <div className="aspect-square bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl flex items-center justify-center">
                <Package className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6" data-testid="product-info">
            {/* Title & Price */}
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3" data-testid="product-title">
                {title}
              </h1>
              <p className="font-heading text-4xl font-bold text-primary" data-testid="product-price">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
              {product.isAvailable ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t.availability}</p>
                    <p className="font-semibold text-emerald-700">{t.available}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-stone-400" />
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
                <Tag className="w-4 h-4 text-muted-foreground" />
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
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{product.businessName}</p>
                  <p className="text-xs text-muted-foreground">{t.viewBusiness}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="card-dashboard mt-8" data-testid="product-description">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">{t.description}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
