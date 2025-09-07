"use client";

import { useState } from "react";
import Image from "next/image";
import warehouseImg from "../../../public/images/bg-1.jpg";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HeroWithTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);

  const { t } = useTranslation("common");

  const handleTrackOrder = () => {
    if (orderNumber === "12345") {
      setOrderDetails({
        orderId: "12345",
        status: t("inTransit"),
        estimatedDelivery: "Sep 10, 2025",
        location: "Casablanca, Morocco",
      });
    } else {
      setOrderDetails({ error: t("orderNotFound") });
    }
  };

  return (
    <section className="relative h-[90vh] w-full overflow-hidden text-white">
      {/* Background Image */}
      <Image
        src={warehouseImg}
        alt={t("warehouseAlt")}
        fill
        className="object-cover z-0"
        priority
      />
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 flex flex-col items-center justify-center text-center h-full">
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {t("accelerateYour")}{" "}
          <span className="text-sky-400">{t("ecommerce")}</span> {t("growth")} <br />
          {t("with")} <span className="text-[#dbb160]">{t("smartShipping")}</span> {t("technology")}
        </h1>

        {/* Feature Highlights */}
        <div className="flex flex-wrap justify-center items-center gap-4 text-white font-medium text-sm mb-8">
          <span>📦 {t("cashCollection")}</span>
          <span className="text-gray-400">|</span>
          <span>📲 {t("realTimeTracking")}</span>
          <span className="text-gray-400">|</span>
          <span>💰 {t("nextDayPayouts")}</span>
        </div>

        {/* Tracking Bar */}
        <div className="flex flex-col sm:flex-row items-center w-full max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-full overflow-hidden border border-white/20 shadow-md">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={t("enterTrackingNumber")}
            className="flex-1 bg-transparent px-5 py-3 text-white placeholder-gray-300 focus:outline-none"
          />
          <button
            onClick={handleTrackOrder}
            className="bg-[#2BC3F1] hover:bg-sky-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition"
          >
            <Search className="w-4 h-4" />
            {t("trackNow")}
          </button>
        </div>

        {/* Tracking Result */}
        {orderDetails && (
          <div className="mt-6 bg-white/90 text-gray-800 p-4 rounded-md shadow-sm max-w-md w-full text-left">
            {orderDetails.error ? (
              <p className="text-red-600 font-medium">{orderDetails.error}</p>
            ) : (
              <>
                <p>
                  <strong>{t("orderId")}:</strong> {orderDetails.orderId}
                </p>
                <p>
                  <strong>{t("status")}:</strong> {orderDetails.status}
                </p>
                <p>
                  <strong>{t("estimatedDelivery")}:</strong> {orderDetails.estimatedDelivery}
                </p>
                <p>
                  <strong>{t("location")}:</strong> {orderDetails.location}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Optional Bottom Wave Overlay */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180 z-20">
        <svg
          className="relative block w-[calc(130%+1.3px)] h-[100px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.3,22,104,39.57,166,39.57,89.09,0,172.63-43.94,261-43.94,57.59,0,113,19.78,168,35.14,70,19,136.43,26.74,206,5.82,61.46-18.3,119.6-46.72,185-57.91V0Z"
            fill="#2BC3F1"
          ></path>
        </svg>
      </div>
    </section>
  );
}
