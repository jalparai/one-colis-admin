"use client";
import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Logo from "../../../public/One-Colis.png";
import LanguageSwitcher from "../LanguageSwitcher";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation();

  return (
    <div className="border-b border-border bg-white sticky top-0 z-50">
      <header className="container mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src={Logo}
              alt="Logo"
              className="h-10 w-10 lg:h-16 lg:w-auto"
              priority
            />
            <h1 className="lg:ml-2 lg:text-3xl text-xl font-bold tracking-wide">
              <span className="text-[#2BC3F1]">One</span>
              <span className="text-[#E0B660]">Colis</span>
            </h1>
          </div>

          {/* Desktop Nav (lg and up) */}
          <nav className="hidden lg:flex items-center space-x-6">
            <a href="#About" className="text-gray-800 hover:text-foreground transition-colors">
              {t("footer.about")}
            </a>
            <a href="#process" className="text-gray-800 hover:text-foreground transition-colors">
              {t("footer.process")}
            </a>
            <a href="#infrastructure" className="text-gray-800 hover:text-foreground transition-colors">
              {t("footer.services")}
            </a>
            <a href="#pricing" className="text-gray-800 hover:text-foreground transition-colors">
              {t("footer.pricing")}
            </a>
            <a href="#contact" className="text-gray-800 hover:text-foreground transition-colors">
              {t("footer.contact")}
            </a>
          </nav>
<div className="flex gap-2">
 {/* CTA Button (lg and up) */}
          <Link
            href={`/${locale}/signup`}
            className="bg-[#2BC3F1] hover:bg-sky-400 text-[14px] lg:text-[16px] inline-block text-white px-3 lg:px-6 py-2 lg:py-2 rounded-full font-semibold transition"
          >
            {t("header.getStarted", "Get Started")}
          </Link>

          {/* Language Switcher */}
          <LanguageSwitcher />
</div>
         

          {/* Mobile Menu Button (below lg) */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown (below lg) */}
        {isOpen && (
          <div className="lg:hidden bg-background border-t border-border">
            <nav className="flex flex-col space-y-2 p-4">
              <a href="#About" onClick={() => setIsOpen(false)} className="text-gray-800 hover:text-foreground transition-colors">
                {t("footer.about")}
              </a>
              <a href="#process" onClick={() => setIsOpen(false)} className="text-gray-800 hover:text-foreground transition-colors">
                {t("footer.process")}
              </a>
              <a href="#infrastructure" onClick={() => setIsOpen(false)} className="text-gray-800 hover:text-foreground transition-colors">
                {t("footer.services")}
              </a>
              <a href="#pricing" onClick={() => setIsOpen(false)} className="text-gray-800 hover:text-foreground transition-colors">
                {t("footer.pricing")}
              </a>
              <a href="#contact" onClick={() => setIsOpen(false)} className="text-gray-800 hover:text-foreground transition-colors">
                {t("footer.contact")}
              </a>

              {/* CTA inside mobile menu */}
              {/* <Link
                href={`/${locale}/signup`}
                onClick={() => setIsOpen(false)}
                className="bg-[#2BC3F1] hover:bg-sky-600 text-white px-6 py-3 rounded-full font-semibold text-center transition"
              >
                {t("header.getStarted", "Get Started")}
              </Link> */}
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
