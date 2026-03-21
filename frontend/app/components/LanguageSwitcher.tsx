'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: 'fr' | 'en') => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={() => switchLanguage('fr')}
        disabled={locale === 'fr' || isPending}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          locale === 'fr'
            ? 'bg-primary text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage('en')}
        disabled={locale === 'en' || isPending}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          locale === 'en'
            ? 'bg-primary text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        EN
      </button>
    </div>
  );
}
