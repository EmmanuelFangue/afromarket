import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const metadataByLocale: Record<string, Metadata> = {
    fr: {
      title: "AfroMarket - Annuaire géolocalisé",
      description: "Annuaire géolocalisé avec recherche par mots-clés, facettes et carte",
    },
    en: {
      title: "AfroMarket - Geolocated Directory",
      description: "Geolocated directory with keyword search, facets and map",
    },
  };

  return metadataByLocale[locale] ?? metadataByLocale.fr;
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
