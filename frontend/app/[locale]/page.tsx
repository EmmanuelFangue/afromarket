'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, UtensilsCrossed, ShoppingBag, Scissors, Shirt, ChefHat, ArrowRight, MapPin, Star } from 'lucide-react';

const CATEGORIES = [
  { id: 'restaurant', icon: UtensilsCrossed, name: { fr: 'Restaurant africain', en: 'African Restaurant' }, color: 'bg-orange-500' },
  { id: 'grocery', icon: ShoppingBag, name: { fr: 'Épicerie africaine', en: 'African Grocery' }, color: 'bg-emerald-500' },
  { id: 'hair', icon: Scissors, name: { fr: 'Coiffure afro', en: 'Afro Hair Salon' }, color: 'bg-purple-500' },
  { id: 'clothing', icon: Shirt, name: { fr: 'Vêtements africains', en: 'African Clothing' }, color: 'bg-blue-500' },
  { id: 'catering', icon: ChefHat, name: { fr: 'Services traiteur', en: 'Catering Services' }, color: 'bg-red-500' },
];

const CATEGORY_IMAGES: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1653981608672-aea09b857b20?w=600&h=400&fit=crop',
  grocery: 'https://images.unsplash.com/photo-1764784290159-a8ed4b30edcf?w=600&h=400&fit=crop',
  hair: 'https://images.unsplash.com/photo-1723541104653-5e478f84e687?w=600&h=400&fit=crop',
  clothing: 'https://images.unsplash.com/photo-1760907949889-eb62b7fd9f75?w=600&h=400&fit=crop',
  catering: 'https://images.unsplash.com/photo-1773040835762-ace903c83f36?w=600&h=400&fit=crop',
};

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fr') as 'fr' | 'en';
  const [searchQuery, setSearchQuery] = useState('');

  const t = {
    fr: {
      heroTitle: 'Découvrez les saveurs et talents de l\'Afrique',
      heroSubtitle: 'Le premier annuaire des commerces africains et caribéens au Canada',
      searchPlaceholder: 'Rechercher un restaurant, une épicerie, un salon...',
      searchBtn: 'Rechercher',
      categories: 'Explorez par catégorie',
      featured: 'Commerces en vedette',
      findBusiness: 'Trouver un commerce',
      listBusiness: 'Référencer mon commerce',
      ctaTitle: 'Vous êtes commerçant ?',
      ctaSubtitle: 'Rejoignez AfroMarket et atteignez des milliers de clients au Canada',
      ctaBtn: 'Créer mon profil gratuitement',
      viewAll: 'Voir tout',
      cities: 'Montréal · Toronto · Ottawa',
    },
    en: {
      heroTitle: 'Discover the flavors and talents of Africa',
      heroSubtitle: 'The premier directory for African and Caribbean businesses in Canada',
      searchPlaceholder: 'Search for a restaurant, grocery, salon...',
      searchBtn: 'Search',
      categories: 'Explore by category',
      featured: 'Featured businesses',
      findBusiness: 'Find a business',
      listBusiness: 'List my business',
      ctaTitle: 'Are you a merchant?',
      ctaSubtitle: 'Join AfroMarket and reach thousands of customers in Canada',
      ctaBtn: 'Create my profile for free',
      viewAll: 'View all',
      cities: 'Montreal · Toronto · Ottawa',
    }
  }[locale];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/${locale}/search`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B4D3E' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground rounded-full px-4 py-2 mb-6 animate-fade-in">
              <MapPin className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">{t.cities}</span>
            </div>

            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-in animate-delay-100">
              {t.heroTitle}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in animate-delay-200">
              {t.heroSubtitle}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="animate-fade-in animate-delay-300">
              <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-xl shadow-primary/5 border border-border">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full h-12 pl-12 pr-4 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    data-testid="hero-search-input"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center gap-2"
                  data-testid="hero-search-btn"
                >
                  <Search className="w-5 h-5" />
                  <span>{t.searchBtn}</span>
                </button>
              </div>
            </form>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mt-6 animate-fade-in animate-delay-400">
              {CATEGORIES.slice(0, 3).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${locale}/search?category=${cat.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-border rounded-full text-sm font-medium text-foreground transition-colors"
                  data-testid={`category-pill-${cat.id}`}
                >
                  <cat.icon className="w-4 h-4 text-primary" />
                  {cat.name[locale]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Bento Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              {t.categories}
            </h2>
            <Link
              href={`/${locale}/search`}
              className="hidden sm:flex items-center gap-2 text-primary font-medium hover:underline"
              data-testid="categories-view-all"
            >
              {t.viewAll}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Large tile - Restaurant */}
            <Link
              href={`/${locale}/search?category=restaurant`}
              className="col-span-2 row-span-2 group relative overflow-hidden rounded-3xl aspect-square md:aspect-auto"
              data-testid="category-tile-restaurant"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
              <img
                src={CATEGORY_IMAGES.restaurant}
                alt="Restaurant africain"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${CATEGORIES[0].color} rounded-2xl mb-3`}>
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-white">
                  {CATEGORIES[0].name[locale]}
                </h3>
              </div>
            </Link>

            {/* Other categories */}
            {CATEGORIES.slice(1).map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/search?category=${cat.id}`}
                className="group relative overflow-hidden rounded-3xl aspect-square"
                data-testid={`category-tile-${cat.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                <img
                  src={CATEGORY_IMAGES[cat.id]}
                  alt={cat.name[locale]}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <div className={`inline-flex items-center justify-center w-10 h-10 ${cat.color} rounded-xl mb-2`}>
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    {cat.name[locale]}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-16">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                  {t.ctaTitle}
                </h2>
                <p className="text-lg text-white/80 max-w-xl">
                  {t.ctaSubtitle}
                </p>
              </div>
              <Link
                href={`/${locale}/auth/register`}
                className="whitespace-nowrap bg-white text-primary rounded-full px-8 py-4 font-semibold transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] active:scale-95 shadow-lg flex items-center gap-2"
                data-testid="cta-register-btn"
              >
                {t.ctaBtn}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-heading font-bold text-xl">A</span>
              </div>
              <span className="font-heading font-bold text-xl text-foreground">AfroMarket</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} AfroMarket. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/search`} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                {t.findBusiness}
              </Link>
              <Link href={`/${locale}/auth/register`} className="text-muted-foreground hover:text-primary text-sm transition-colors">
                {t.listBusiness}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
