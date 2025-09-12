'use client';

import { usePathname, useRouter, useParams } from 'next/navigation';
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
        className="flex items-center bg-white px-2 py-2 rounded-full shadow-md hover:shadow-lg transition-all gap-2 min-w-[40px] lg:min-w-[140px] lg:px-4"
      >
        <Image
          src={current.flag}
          alt={current.label}
          width={30}
          height={30}
          className="rounded-sm"
        />
        {/* Hide label & arrow on mobile */}
        <span className="hidden lg:inline text-gray-800 font-medium">{current.label}</span>
        <ChevronDown className="hidden lg:inline w-4 h-4 text-gray-600" />
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
              className={`flex items-center w-full lg:px-4 justify-center lg:py-2 py-1 text-sm gap-2 hover:bg-gray-100 transition ${
                locale.code === currentLocale ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'
              }`}
            >
          <Image
  src={locale.flag}
  alt={locale.label}
  width={24}  // default mobile size
  height={24}
  className="rounded-sm lg:w-[18px] lg:h-[18px]"
/>

              <span className="hidden lg:inline">{locale.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
