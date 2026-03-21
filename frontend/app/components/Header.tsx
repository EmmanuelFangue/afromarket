'use client';

import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Search, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'fr';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = {
    fr: {
      search: 'Rechercher',
      login: 'Connexion',
      register: 'Inscription',
      dashboard: 'Mon espace',
      admin: 'Administration',
      logout: 'Déconnexion',
      loading: 'Chargement...'
    },
    en: {
      search: 'Search',
      login: 'Login',
      register: 'Sign up',
      dashboard: 'My space',
      admin: 'Administration',
      logout: 'Logout',
      loading: 'Loading...'
    }
  }[locale as 'fr' | 'en'] || {
    search: 'Rechercher',
    login: 'Connexion',
    register: 'Inscription',
    dashboard: 'Mon espace',
    admin: 'Administration',
    logout: 'Déconnexion',
    loading: 'Chargement...'
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2"
            data-testid="header-logo"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xl">A</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground hidden sm:block">
              AfroMarket
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}/search`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
              data-testid="header-search-link"
            >
              <Search className="w-4 h-4" />
              {t.search}
            </Link>

            <LanguageSwitcher />

            {isLoading ? (
              <span className="text-muted-foreground text-sm">{t.loading}</span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                {user?.roles.includes('merchant') && (
                  <Link
                    href={`/${locale}/merchant/dashboard`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium"
                    data-testid="header-merchant-dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t.dashboard}
                  </Link>
                )}

                {user?.roles.includes('admin') && (
                  <Link
                    href={`/${locale}/admin/dashboard`}
                    className="flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
                    data-testid="header-admin-link"
                  >
                    <Shield className="w-4 h-4" />
                    {t.admin}
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-4 border-l border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground font-medium max-w-[120px] truncate">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    data-testid="header-logout-btn"
                    title={t.logout}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/auth/login`}
                  className="btn-outline py-2 px-5 text-sm"
                  data-testid="header-login-btn"
                >
                  {t.login}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="btn-primary py-2 px-5 text-sm"
                  data-testid="header-register-btn"
                >
                  {t.register}
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              <Link
                href={`/${locale}/search`}
                className="flex items-center gap-2 p-3 text-foreground hover:bg-muted rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-search-link"
              >
                <Search className="w-5 h-5" />
                {t.search}
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.roles.includes('merchant') && (
                    <Link
                      href={`/${locale}/merchant/dashboard`}
                      className="flex items-center gap-2 p-3 text-foreground hover:bg-muted rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-merchant-dashboard"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      {t.dashboard}
                    </Link>
                  )}
                  {user?.roles.includes('admin') && (
                    <Link
                      href={`/${locale}/admin/dashboard`}
                      className="flex items-center gap-2 p-3 text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-admin-link"
                    >
                      <Shield className="w-5 h-5" />
                      {t.admin}
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors w-full text-left"
                    data-testid="mobile-logout-btn"
                  >
                    <LogOut className="w-5 h-5" />
                    {t.logout}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href={`/${locale}/auth/login`}
                    className="btn-outline text-center"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-login-btn"
                  >
                    {t.login}
                  </Link>
                  <Link
                    href={`/${locale}/auth/register`}
                    className="btn-primary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-register-btn"
                  >
                    {t.register}
                  </Link>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <LanguageSwitcher />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
