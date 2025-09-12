import { ThankYouPage } from '@/components/Landing-page/Thanku';
import React from 'react'

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params); // ✅ unwrap

  return (
   <ThankYouPage />
  )
}

