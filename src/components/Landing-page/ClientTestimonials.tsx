"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function ClientTestimonials() {
  const { t } = useTranslation("common");

  const testimonials = [
    {
      name: "Salma T",
      role: t("casablancaBoutique"),
      image: "/client-profile-1.png",
      text: t("testimonial1"),
    },
    {
      name: "Ahmed S.",
      role: t("agadirArtisan"),
      image: "/client-profile-2.png",
      text: t("testimonial2"),
    },
    {
      name: "Youssef L",
      role: t("rabatElectronics"),
      image: "/client-profile-3.png",
      text: t("testimonial3"),
    },
    {
      name: "Nadia B",
      role: t("fesBeauty"),
      image: "/client-profile-2.png",
      text: t("testimonial4"),
    },
    {
      name: "Karim E.",
      role: t("tangierHomeDecor"),
      image: "/client-profile-2.png",
      text: t("testimonial5"),
    },
    {
      name: "Laila M",
      role: t("marrakechHandmade"),
      image: "/client-profile-2.png",
      text: t("testimonial6"),
    },
  ];

  const repeated = [...testimonials, ...testimonials];

  return (
    <section className="bg-gray-50 py-16 overflow-hidden" id="testimonials">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {t("whatClientsSay")}
        </h2>
        <p className="text-lg text-gray-600 mb-12 w-[95%] lg:w-[90%] mx-auto">
          {t("testimonialIntro")}
        </p>

        {/* Auto-scroll container */}
        <div className="relative overflow-hidden">
          <div className="flex space-x-6 animate-slide-slow px-1">
            {repeated.map((tData, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 p-6 w-[320px] flex-shrink-0 relative"
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={tData.image}
                    alt={tData.name}
                    width={50}
                    height={50}
                    className="rounded-full object-cover mr-4"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{tData.name}</p>
                    <p className="text-sm text-gray-500">{tData.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed relative z-10">
                  <span className="text-3xl text-gray-300 absolute top-[-10px] left-[-10px] z-0">
                    &ldquo;
                  </span>
                  {tData.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <button className="bg-[#2BC3F1] m-auto hover:bg-sky-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition">
            {t("scaleBusiness")}
          </button>
        </div>
      </div>

      {/* Inline CSS for animation */}
      <style jsx>{`
        @keyframes slide-slow {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-slide-slow {
          animation: slide-slow 60s linear infinite;
        }
      `}</style>
    </section>
  );
}
