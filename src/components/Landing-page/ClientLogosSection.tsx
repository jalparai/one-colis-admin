"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

const logos = [
  "/client-1.png",
  "/client-2.png",
  "/client-3.png",
  "/client-4.png",
  "/client-5.png",
  "/client-6.png",
  "/client-7.png",
  "/client-8.png",
  "/client-9.png",
  "/client-10.png",
];

export default function ClientLogosSection() {
  const repeated = [...logos, ...logos]; // repeat for infinite scroll
  const { t } = useTranslation(); // hook from react-i18next

  return (
    <section className="bg-gray-50 py-12 overflow-hidden">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
        {t("title_client")}
      </h2>

      <div className="relative w-full overflow-hidden">
        <div className="scroll-track">
          {repeated.map((logo, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center mx-6 bg-white shadow-md rounded-xl p-2 min-w-[100px] h-[60px]"
            >
              <Image
                src={logo}
                alt={`Logo ${idx + 1}`}
                width={100}
                height={50}
                className="object-contain h-full w-auto"
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scroll-track {
          display: flex;
          width: max-content;
          animation: scroll 25s linear infinite;
          white-space: nowrap;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
