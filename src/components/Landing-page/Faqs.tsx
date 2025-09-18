"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t, i18n } = useTranslation("common");

  const isArabic = i18n.language === "ar";

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="max-w-3xl mx-auto px-4 py-12"
      id="Faq"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <h2 className="text-3xl font-bold text-center mb-4 ">
        {t("faqTitle")}
      </h2>
      <p className="text-center text-gray-600 mb-10">
        {t("faqIntro")}
      </p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border rounded-lg p-4 shadow-sm bg-white">
            {/* Question */}
            <button
              onClick={() => toggleFAQ(index)}
              className={`flex items-center w-full cursor-pointer justify-between ${
                isArabic ? "flex-row-reverse text-right" : "text-left"
              }`}
            >
              {/* For Arabic, show icon first (left) */}
              {isArabic && (openIndex === index ? <Minus className="w-5 h-5 text-gray-600 ml-2" /> : <Plus className="w-5 h-5 text-gray-600 ml-2" />)}
              <span className="font-medium text-lg">{faq.question}</span>
              {/* For LTR, icon stays on the right */}
              {!isArabic && (openIndex === index ? <Minus className="w-5 h-5 text-gray-600" /> : <Plus className="w-5 h-5 text-gray-600" />)}
            </button>

            {/* Answer */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? "max-h-40 mt-3" : "max-h-0"
              }`}
            >
              <p className={isArabic ? "text-right text-gray-600" : "text-gray-600"}>
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
