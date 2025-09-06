'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

const locales = [
  { code: 'en', label: 'English', flag: '/en.svg' },
  { code: 'fr', label: 'Français', flag: '/fr.svg' },
  { code: 'ar', label: 'العربية', flag: '/ar.svg' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLocale = params.locale as string;
  const current = locales.find((l) => l.code === currentLocale) || locales[0];

  const [open, setOpen] = useState(false);

  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    window.location.href = newPath;
  };

  return (
    <div className="relative z-50">
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all gap-2 min-w-[140px]"
      >
        <Image
          src={current.flag}
          alt={current.label}
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-gray-800 font-medium">{current.label}</span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-2 bg-white shadow-lg rounded-lg py-2 w-full">
          {locales.map((locale) => (
            <button
              key={locale.code}
              onClick={() => {
                setOpen(false);
                switchLanguage(locale.code);
              }}
              disabled={locale.code === currentLocale}
              className={`flex items-center w-full px-4 py-2 text-sm gap-2 hover:bg-gray-100 transition ${
                locale.code === currentLocale ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'
              }`}
            >
              <Image
                src={locale.flag}
                alt={locale.label}
                width={18}
                height={18}
                className="rounded-full"
              />
              {locale.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
