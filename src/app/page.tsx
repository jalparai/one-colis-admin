'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToDefaultLocale() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/en'); // Change to your default language
  }, [router]);

  return null;
}
