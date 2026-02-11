import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfroMarket - Annuaire géolocalisé",
  description: "Annuaire géolocalisé avec recherche par mots-clés, facettes et carte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
