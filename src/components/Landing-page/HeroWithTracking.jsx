"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import warehouseImg from "../../../public/images/bg-1.jpg";

export default function HeroWithTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { t, i18n } = useTranslation("common");

  const handleTrackOrder = async () => {
    const trimmedOrder = orderNumber.trim();
    if (!trimmedOrder) {
      setErrorMessage(t("enterTrackingNumber"));
      setTrackingData(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setTrackingData(null);

    try {
      const res = await fetch(
        `https://cod-ecommerce-two.vercel.app/api/shared/track/${encodeURIComponent(trimmedOrder)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = json?.message || t("orderNotFound");
        setErrorMessage(message);
        return;
      }

      if (json?.data) {
        setTrackingData(json.data);
      } else {
        setErrorMessage(t("orderNotFound"));
      }
    } catch (err) {
      setErrorMessage(t("somethingWentWrong") || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const isArabic = i18n.language === "ar";

  return (
    <section
      className="relative h-[90vh] w-full overflow-hidden text-white"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Background Image */}
      <Image
        src={warehouseImg}
        alt={t("warehouseAlt")}
        fill
        className="object-cover z-0"
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content */}
      <div
        className={`relative z-20 container mx-auto px-4 flex flex-col items-center justify-center text-center h-full ${
          isArabic ? "text-center" : "text-center"
        }`}
      >
{/* <h1
  className="text-3xl md:text-5xl text-white font-bold mb-2 leading-tight lg:w-[60%]"
  // dir={i18n.language === "ar" ? "rtl" : "ltr"}
>
 {t("accelerateYour")}
  
  <span>{t("accelerateYour")} </span>
  <span className="text-[#2BC3F1]">{t("growth")} </span>
  <span className="text-[#E0B660]">{t("ecommerce")} </span>
  <span>{t("smartShipping")}</span>
</h1> */}

<h1
  className="text-3xl md:text-5xl font-bold mb-2 leading-tight lg:w-[60%]"
  dangerouslySetInnerHTML={{
    __html: t("accelerateYour"),
  }}
/>


     {/* <h2 className="text-2xl md:text-3xl font-semibold mb-4 leading-snug"> {t("with")}{" "} 
     <span className="text-[#dbb160]">{t("smartShipping")}</span> {t("technology")} </h2> */}

        {/* Feature Highlights */}
        <div
          className={`flex flex-wrap items-center gap-4 text-white font-medium text-sm lg:mb-8 mb-5 ${
            isArabic ? "justify-end" : "justify-center"
          }`}
        >
          <span>📦 {t("cashCollection")}</span>
          <span className="text-gray-400">|</span>
          <span>📲 {t("realTimeTracking")}</span>
          <span className="text-gray-400">|</span>
          <span>💰 {t("nextDayPayouts")}</span>
        </div>

        {/* Tracking Bar */}
        <div className="flex flex-col sm:flex-row items-center w-full max-w-2xl lg:bg-white/10 lg:backdrop-blur-md p-2 lg:rounded-full overflow-hidden lg:border lg:border-white/20 lg:shadow-md">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={t("enterTrackingNumber")}
            aria-label={t("enterTrackingNumber")}
            className="flex-1 lg:bg-transparent lg:w-auto w-full lg:border-none px-5 py-3 text-white placeholder-gray-300 focus:outline-none lg:backdrop-blur-none bg-white/10 backdrop-blur-md p-2 rounded-full overflow-hidden border border-white/20 shadow-md lg:shadow-none"
          />
          <button
            onClick={handleTrackOrder}
            aria-label={t("trackNow")}
            disabled={isLoading || !orderNumber.trim()}
            aria-busy={isLoading}
            className="bg-[#2BC3F1] lg:mt-0 text-center justify-center mt-2 lg:w-auto w-full hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                {t("loading") || "Loading"}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t("trackNow")}
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <p className="mt-3 text-red-300 text-sm font-medium">{errorMessage}</p>
        )}

        {/* Tracking Result */}
        {trackingData && <TrackingResult trackingData={trackingData} orderId={orderNumber.trim()} />}
      </div>

      {/* Bottom Wave Overlay */}
    {/* <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180 z-20 lg:block hidden"> <svg className="relative block w-[calc(130%+1.3px)] h-[100px] bottom-[10px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" > <path d="M0,0V46.29c47.3,22,104,39.57,166,39.57,89.09,0,172.63-43.94,261-43.94,57.59,0,113,19.78,168,35.14,70,19,136.43,26.74,206,5.82,61.46-18.3,119.6-46.72,185-57.91V0Z" fill="#2BC3F1" ></path> </svg> </div> */}
    </section>
  );
}

function TrackingResult({ trackingData, orderId }) {
  const { t, i18n } = useTranslation("common");
  const isArabic = i18n.language === "ar";

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString(i18n.language || undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return iso;
    }
  };

  const { status, statusHistory = [], lastUpdated } = trackingData || {};
  const timeline = [...statusHistory].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div
      className={`mt-6 bg-white/90 text-gray-800 p-4 rounded-md shadow-sm w-full max-w-2xl animate-fadeIn ${
        isArabic ? "text-right" : "text-left"
      }`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">{t("orderId") || "Order ID"}:</span>
          <span className="font-semibold">{orderId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">{t("status") || "Status"}:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
            {status}
          </span>
        </div>
      </div>

      {lastUpdated && (
        <p className="mt-1 text-xs text-gray-500">
          {t("lastUpdated") || "Last updated"}: {formatDateTime(lastUpdated)}
        </p>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t("statusHistory") || "Status history"}</h3>
        <ol className="relative border-s border-gray-200 pl-4">
          {timeline.length === 0 && (
            <li className="text-sm text-gray-500">{t("noHistory") || "No history available"}</li>
          )}
          {timeline.map((item, idx) => (
            <li key={item._id || idx} className="mb-3">
              <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-sky-400 border border-white" />
              <div className="text-sm">
                <span className="font-medium text-gray-800">{item.from} → {item.to}</span>
                <span className="ml-2 text-gray-500">{formatDateTime(item.at)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {(t("by") || "By")}: {item.by || "system"}
                {item.reason ? ` • ${item.reason}` : ""}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
