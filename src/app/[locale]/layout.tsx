import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css'; // go up one level
import LanguageSetter from './LanguageSetterProps';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageSetter locale={params.locale} />
        {children}
      </body>
    </html>
  );
}
