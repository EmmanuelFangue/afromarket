import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // output: 'standalone', // Commented out for dev mode
};

export default withNextIntl(nextConfig);
