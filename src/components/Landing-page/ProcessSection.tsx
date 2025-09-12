"use client";

import Image from "next/image";
import {
  UserCheck,
  PackageCheck,
  Truck,
  Route,
  Eye,
  CreditCard,
  Bell,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Shiping from "../../../public/Shipping.png"; // replace with actual path
import { useMemo } from "react";

export default function ProcessSection() {
  const { t } = useTranslation("common");

  const desktopSteps = useMemo(() => [
    { icon: UserCheck, title: t("happyCustomers"), angle: 0, color: "bg-green-500" },
    { icon: PackageCheck, title: t("createShipment"), angle: 45, color: "bg-blue-500" },
    { icon: Truck, title: t("wePickUp"), angle: 90, color: "bg-purple-500" },
    { icon: Route, title: t("smartRouting"), angle: 135, color: "bg-indigo-500" },
    { icon: Eye, title: t("liveTracking"), angle: 180, color: "bg-cyan-500" },
    { icon: CreditCard, title: t("codCollection"), angle: 225, color: "bg-yellow-500" },
    { icon: Bell, title: t("instantNotification"), angle: 270, color: "bg-orange-500" },
    { icon: DollarSign, title: t("nextDayPayout"), angle: 315, color: "bg-red-500" },
  ], [t]);

  const mobileSteps = useMemo(() => [
    { icon: PackageCheck, title: t("createShipment"), color: "bg-blue-500" },
    { icon: Truck, title: t("wePickUp"), color: "bg-purple-500" },
    { icon: Route, title: t("smartRouting"), color: "bg-indigo-500" },
    { icon: Eye, title: t("liveTracking"), color: "bg-cyan-500" },
    { icon: CreditCard, title: t("codCollection"), color: "bg-yellow-500" },
    { icon: Bell, title: t("instantNotification"), color: "bg-orange-500" },
    { icon: DollarSign, title: t("nextDayPayout"), color: "bg-red-500" },
    { icon: UserCheck, title: t("happyCustomers"), color: "bg-green-500" },
  ], [t]);

  const radius = 200; // circle radius for desktop steps

  return (
    <section
      id="process"
      className="py-16 px-4 bg-gradient-to-r from-[#111b3d] via-slate-800 to-[#111b3d] border-t border-slate-700 relative"
    >
      {/* Background Grid Overlay */}
      <div className="absolute z-[-1] inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[length:40px_40px]" />

      <div className="container mx-auto text-center">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t("shippingProcessTitle")}
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-16">
          {t("shippingProcessDescription")}
        </p>

        {/* Desktop Circle Diagram */}
        <div className="hidden md:block relative w-full max-w-4xl mx-auto mb-16">
          <div className="relative w-[500px] h-[500px] mx-auto">
            {/* Center Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-40 h-40 bg-[#131e3d] border-2 border-white rounded-full flex items-center justify-center shadow-2xl">
                <Image
                  src={Shiping}
                  alt={t("shippingAlt")}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>

            {/* Circular Steps */}
            {desktopSteps.map((step, index) => {
              const angleRad = (step.angle * Math.PI) / 180;
              const x = Math.cos(angleRad) * radius;
              const y = Math.sin(angleRad) * radius;

              return (
                <div
                  key={index}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                >
                  <div
                    className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-24 left-1/2 -translate-x-1/2 w-28 text-center">
                    <p className="text-white font-medium text-sm leading-tight">{step.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Vertical Steps */}
        <div className="block md:hidden space-y-6">
          {mobileSteps.map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`w-14 h-14 ${step.color} rounded-full flex items-center justify-center`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-white font-medium text-base">{step.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
