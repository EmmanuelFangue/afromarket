import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/request';

export default createMiddleware({
  // Liste des locales supportées
  locales,

  // Locale par défaut
  defaultLocale: 'fr',

  // Rediriger automatiquement vers /fr ou /en
  localePrefix: 'always'
});

export const config = {
  // Matcher pour toutes les routes sauf API, _next, assets
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
