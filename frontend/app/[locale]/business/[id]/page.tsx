'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getBusinessById, getProductsByBusiness } from '../../../lib/api';
import { Business, ProductDetail } from '../../../lib/types';
import ContactForm from '../../../components/ContactForm';
import { ArrowLeft, MapPin, Phone, Mail, Globe, Tag, Package, ExternalLink, Store } from 'lucide-react';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const t = {
    fr: {
      backToSearch: 'Retour à la recherche',
      contact: 'Contact',
      website: 'Visiter le site web',
      notFound: 'Commerce non trouvé',
      loading: 'Chargement...',
      error: 'Impossible de charger ce commerce',
      products: { title: 'Produits proposés', noProducts: 'Aucun produit disponible pour ce commerce.', loading: 'Chargement des produits...' },
      available: 'Disponible',
      unavailable: 'Indisponible',
      soldBy: 'Vendu par',
    },
    en: {
      backToSearch: 'Back to search',
      contact: 'Contact',
      website: 'Visit website',
      notFound: 'Business not found',
      loading: 'Loading...',
      error: 'Failed to load this business',
      products: { title: 'Products offered', noProducts: 'No products available for this business.', loading: 'Loading products...' },
      available: 'Available',
      unavailable: 'Unavailable',
      soldBy: 'Sold by',
    }
  }[locale];

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBusinessById(params.id as string, abortController.signal);

        if (!data) {
          setError(t.notFound);
          return;
        }

        setBusiness(data);

        setProductsLoading(true);
        try {
          const prodData = await getProductsByBusiness(params.id as string, 1, 20, abortController.signal);
          if (!abortController.signal.aborted) {
            setProducts(prodData.items);
          }
        } catch (prodErr: any) {
          if (prodErr.name !== 'AbortError') {
            console.error('Error fetching products:', prodErr);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setProductsLoading(false);
          }
        }
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
      fetchData();
    }

    return () => abortController.abort();
  }, [params.id]);

  const getBusinessName = (biz: Business): string => {
    try {
      const tr = typeof biz.nameTranslations === 'string' ? JSON.parse(biz.nameTranslations) : biz.nameTranslations;
      return tr[locale] || tr['fr'] || biz.name || '';
    } catch {
      return biz.name || '';
    }
  };

  const getBusinessDescription = (biz: Business): string => {
    try {
      const tr = typeof biz.descriptionTranslations === 'string' ? JSON.parse(biz.descriptionTranslations) : biz.descriptionTranslations;
      return tr[locale] || tr['fr'] || biz.description || '';
    } catch {
      return biz.description || '';
    }
  };

  const getProductTitle = (product: ProductDetail): string => {
    try {
      const tr = JSON.parse(product.titleTranslations);
      return tr[locale] || tr['fr'] || product.title || '';
    } catch {
      return product.title || '';
    }
  };

  const formatPrice = (price: number, currency: string): string => {
    try {
      return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency }).format(price);
    } catch {
      return `${price} ${currency}`;
    }
  };

  const getFirstImageUrl = (product: ProductDetail): string | null => {
    if (!product.media || product.media.length === 0) return null;
    return [...product.media].sort((a, b) => a.orderIndex - b.orderIndex)[0].url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton Hero */}
        <div className="h-64 md:h-80 bg-stone-200 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
          <div className="card-business p-8 animate-pulse space-y-4">
            <div className="h-10 bg-stone-200 rounded-xl w-3/4" />
            <div className="h-4 bg-stone-200 rounded-xl w-1/2" />
            <div className="h-24 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
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
              <Store className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-500">{error || t.notFound}</p>
          </div>
        </div>
      </div>
    );
  }

  const businessName = getBusinessName(business);
  const businessDescription = getBusinessDescription(business);

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
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors drop-shadow"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToSearch}
        </button>

        {/* Main Card */}
        <div className="card-business p-8 mb-6 animate-fade-in" data-testid="business-card">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3" data-testid="business-name">
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
                {business.tags.map((tag, index) => (
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

        {/* Products Section */}
        <div className="card-dashboard mb-6" data-testid="products-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground">{t.products.title}</h2>
          </div>

          {productsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border animate-pulse">
                  <div className="aspect-video bg-stone-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-5 bg-stone-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!productsLoading && products.length === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t.products.noProducts}</p>
            </div>
          )}

          {!productsLoading && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const imageUrl = getFirstImageUrl(product);
                const title = getProductTitle(product);
                return (
                  <Link
                    key={product.id}
                    href={`/${locale}/product/${product.id}`}
                    className="group border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all bg-white"
                    data-testid={`product-card-${product.id}`}
                  >
                    {/* Image */}
                    {imageUrl ? (
                      <div className="aspect-video bg-stone-100 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">{title}</h3>
                      <p className="font-bold text-primary text-lg">
                        {formatPrice(product.price, product.currency)}
                      </p>
                      <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isAvailable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {product.isAvailable ? t.available : t.unavailable}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact Form */}
        <ContactForm businessId={business.id} businessName={businessName} />
      </div>
    </div>
  );
}
