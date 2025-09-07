// src/app/layout.tsx
import '../app/[locale]/globals.css';

export const metadata = {
  title: 'My App',
  description: 'Multi-language App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
