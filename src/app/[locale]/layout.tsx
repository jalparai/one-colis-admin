// app/[locale]/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import LanguageSetter from './LanguageSetterProps';
import type { ReactNode } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

// Make the layout async if you need translations
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // Example: load translations dynamically
  // const translations = await fetchTranslations(params.locale);

  return (
    <html lang={params.locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageSetter locale={params.locale} />
        {children}
      </body>
    </html>
  );
}
