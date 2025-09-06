'use client';

import { useEffect } from 'react';
import i18n from '../../i18n';

interface LanguageSetterProps {
  locale: string;
}

export default function LanguageSetter({ locale }: LanguageSetterProps) {
  useEffect(() => {
    async function changeLang() {
      if (locale && i18n.language !== locale) {
        await i18n.changeLanguage(locale);
      }
    }
    changeLang();
  }, [locale]);

  return null;
}
