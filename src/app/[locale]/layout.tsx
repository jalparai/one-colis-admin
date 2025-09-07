import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LanguageSetter from "./LanguageSetterProps";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
  params,
}: any) {   // <-- use `any` here to satisfy TS
  return (
    <html lang={params.locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageSetter locale={params.locale} />
        {children}
      </body>
    </html>
  );
}
