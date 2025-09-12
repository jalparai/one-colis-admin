"use client";

import Image from "next/image";
import { useTranslation } from 'react-i18next';

import {
  Truck,
  Package,
  MapPin,
  BarChart3,
  Users,
  Shield,
  CheckCircle,
  ArrowRight,
  Warehouse,
  CreditCard,
  Eye,
  Bell,
  Route,
  UserCheck,
  PackageCheck,
  DollarSign,
  Star,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  RotateCcw,
  Repeat,
  HandCoins,
  Building2,
    Facebook, Twitter, Linkedin,
    LocationEditIcon,
    PhoneCall,
    MailIcon
} from "lucide-react"
export default function Commitments() {
  const { t } = useTranslation("common");

const commitments = [
  {
    icon: <Truck className="h-6 w-6 text-[#E0B660]" />,
    title: t("commitments.items.delivery.title"),
    description: t("commitments.items.delivery.desc"),
  },
  {
    icon: <RotateCcw className="h-6 w-6 text-[#E0B660]" />,
    title: t("commitments.items.returns.title"),
    description: t("commitments.items.returns.desc"),
  },
  {
    icon: <Repeat className="h-6 w-6 text-[#E0B660]" />,
    title: t("commitments.items.exchange.title"),
    description: t("commitments.items.exchange.desc"),
  },
  {
    icon: <HandCoins className="h-6 w-6 text-[#E0B660]" />,
    title: t("commitments.items.cash.title"),
    description: t("commitments.items.cash.desc"),
  },
  {
    icon: <Warehouse className="h-6 w-6 text-[#E0B660]" />,
    title: t("commitments.items.warehouse.title"),
    description: t("commitments.items.warehouse.desc"),
  },
];
  return (
    <section className="p-6 pb-10 md:px-8 bg-[#2BC3F1]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
              {t("infrastructure.commitments.title")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {commitments.map((item, index) => (
                <div
                  key={index}
                  className="group bg-white border border-gray-100 rounded-2xl shadow-md p-4 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center m-auto w-14 h-14 mb-4 rounded-full bg-gray-50 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {t(item.title)}
                  </h3>
                  <p className="text-sm text-gray-600">{t(item.description)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
  );
}
