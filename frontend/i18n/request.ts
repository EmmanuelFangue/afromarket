import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Langues supportées
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Valider que la locale fait partie des locales supportées
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
