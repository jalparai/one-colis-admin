"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export default function AboutSection() {
  const { t } = useTranslation("common");

  const cards = useMemo(
    () => [
      {
        title: t("infrastructure.cards.warehouses.title"),
        desc: t("infrastructure.cards.warehouses.desc"),
        img: "/images/warehouse.jpg",
      },
      {
        title: t("infrastructure.cards.fleet.title"),
        desc: t("infrastructure.cards.fleet.desc"),
        img: "/truck-1.jpg",
      },
      {
        title: t("infrastructure.cards.professionals.title"),
        desc: t("infrastructure.cards.professionals.desc"),
        img: "/delivery-boy.jpg",
      },
    ],
    [t]
  );

  return (
    <section
      id="infrastructure"
      className="pt-24 px-4 relative overflow-hidden bg-white"
    >
      <div className="container mx-auto relative z-10 lg:w-[90%] w-[95%]">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {t("infrastructure.title.part1")}{" "}
            <span className="text-gray-800">{t("infrastructure.title.part2")}</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            {t("infrastructure.subtitle")}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {cards.map((card, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl shadow-lg group"
            >
              <Image
                src={card.img}
                alt={card.title}
                width={600}
                height={400}
                className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:via-black/50 transition-all"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{card.title}</h3>
                <p className="text-sm opacity-90">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
