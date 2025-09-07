'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToDefaultLocale() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/en'); // Default locale
  }, [router]);

  return null;
}
