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
        <div className="lg:px-4 flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex">
            <Image
              src={Logo}
              alt="Logo"
              className="lg:h-16 h-12 w-12 lg:w-auto"
            />
            <div>
              <h1 className="lg:text-3xl text-xl font-bold tracking-wide relative lg:top-3 top-2 lg:left-2 left-1">
                <span className="text-[#2BC3F1]">One</span>
                <span className="text-[#E0B660]">Colis</span>
              </h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#About"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.about")}
            </a>
            <a
              href="#process"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.process")}
            </a>
            <a
              href="#infrastructure"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.services")}
            </a>
            {/* <a
              href="#testimonials"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.testimonials")}
            </a> */}
            <a
              href="#pricing"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.pricing")}
            </a>
            {/* <a
              href="#Faq"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.faq")}
            </a> */}
            <a
              href="#contact"
              className="text-gray-800 hover:text-foreground transition-colors"
            >
              {t("footer.contact")}
            </a>
          </nav>

          {/* CTA Button (Desktop only) */}
          <Link
            href={`/${locale}/signup`}
            className="bg-[#2BC3F1] relative lg:left-[97px] hover:bg-sky-400 lg:block hidden text-white px-6 py-3 rounded-full font-semibold items-center gap-2 transition"
          >
            {t("header.getStarted", "Get Started")}
          </Link>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <nav className="flex flex-col space-y-2 p-4">
              <a
                href="#About"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.about")}
              </a>
              <a
                href="#process"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.process")}
              </a>
              <a
                href="#infrastructure"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.services")}
              </a>
              <a
                href="#testimonials"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.testimonials")}
              </a>
              <a
                href="#pricing"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.pricing")}
              </a>
              <a
                href="#Faq"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.faq")}
              </a>
              <a
                href="#contact"
                className="text-gray-800 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t("footer.contact")}
              </a>
              <button
                className="bg-[#2BC3F1] hover:bg-sky-600 text-white px-6 py-3 rounded-full font-semibold items-center gap-2 transition"
              >
                {t("header.getStarted", "Get Started")}
              </button>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
