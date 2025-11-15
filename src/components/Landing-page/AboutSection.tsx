"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import AboutUsImage from "../../../public/truck-1.jpg"; // example

export default function AboutSection() {
  const { t, i18n } = useTranslation("common");
  const isArabic = i18n.language === "ar"; // check if current locale is Arabic

  return (
    <section
      id="About"
      dir={isArabic ? "rtl" : "ltr"}
      className="relative py-20 px-6 bg-white text-gray-800"
    >
      <div className="container mx-auto max-w-7xl grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left - Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg group">
          <Image
            src={AboutUsImage}
            alt="Shipping Partnership"
            className="rounded-2xl w-full h-[420px] object-cover transform group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 bg-black/30"></div>
          {/* <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white drop-shadow-lg">
            {t("about_heading")}
          </h3> */}
        </div>

        {/* Right - Text */}
        <div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-6 text-[#2BC3F1]"
            dangerouslySetInnerHTML={{ __html: t("about_title") }}
          />

          <p
            className="text-lg text-gray-600 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t("about_paragraph1") }}
          />

          <p className="text-gray-500 mb-8">{t("about_paragraph2")}</p>

          {/* Single nav wrapping CTA */}
          <nav>
            <a
              href="#contact"
              className="bg-[#2BC3F1] hover:bg-sky-400 text-white px-6 py-3 rounded-full w-fit font-semibold flex items-center gap-2 lg:overflow-auto overflow-x-scroll transition"
            >
              {t("about_button")}
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
}
