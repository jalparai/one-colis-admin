"use client";

import Image from "next/image";
import { useTranslation, Trans } from "react-i18next";
import CityTable from "./Pricing";
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
export default function DashSection() {
  const { t } = useTranslation("common");

  return (
   <section className="py-24 px-4 relative overflow-hidden">
      <div className="lg:w-[90%] w-[95%] m-auto">
        <div className="absolute inset-0 bg-[#111b3d]"></div>

        <div className="container mx-auto relative z-10">
          <div className="lg:flex w-full justify-end relative bottom-[102px]">
            <main className="relative overflow-hidden">
              <div className="absolute top-[-117px] inset-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1024 768" fill="none" className="w-full h-full opacity-30">
                  <path
                    d="M150 200 C400 300, 600 100, 900 300"
                    stroke="#00C0FF"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5 5"
                  />
                </svg>
              </div>

              <div className="relative z-10 pt-24 px-4 lg:text-left text-center" id="pricing">
                <h1 className="text-4xl text-white md:text-5xl font-bold mb-6 leading-tight drop-shadow-md">
                  {t("shippingSection.shipping_title")}
                </h1>
                <p className="text-lg text-white mb-10 opacity-80 lg:text-left text-center">
                  {t("shippingSection.shipping_subtitle")}
                </p>
              </div>
            </main>
            <CityTable />
          </div>

          <div className="text-center mb-16" id="dashboard">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t("shippingSection.dashboard_title")}
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              {t("shippingSection.dashboard_subtitle")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Management Dashboard */}
            <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-lg">
              <div className="pb-4">
                <h3 className="flex items-center space-x-2 text-white text-xl font-bold">
                  <BarChart3 className="h-5 w-5 text-blue-300" />
                  <span>{t("shippingSection.order_management")}</span>
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-white">5,247</div>
                    <div className="text-sm text-blue-200">
                      {t("shippingSection.active_orders")}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                    <div className="text-2xl font-bold text-green-400">89%</div>
                    <div className="text-sm text-blue-200">
                      {t("shippingSection.delivery_rate")}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">
                      {t("shippingSection.pending_pickup")}
                    </span>
                    <span className="text-sm font-medium text-white">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">
                      {t("shippingSection.in_transit")}
                    </span>
                    <span className="text-sm font-medium text-white">423</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-200">
                      {t("shippingSection.delivered")}
                    </span>
                    <span className="text-sm font-medium text-white">668</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Dashboard */}
         <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-lg">
  <div className="pb-4">
    <h3 className="flex items-center space-x-2 text-white text-xl font-bold">
      <CreditCard className="h-5 w-5 text-blue-300" />
      <span>{t("shippingSection.financial_overview")}</span>
    </h3>
  </div>
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
        <div className="text-2xl font-bold text-white">500,000 MAD</div>
        <div className="text-sm text-blue-200">
          {t("shippingSection.cod_collected")}
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
        <div className="text-2xl font-bold text-blue-300">35,000 MAD</div>
        <div className="text-sm text-blue-200">
          {t("shippingSection.pending_payout")}
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-blue-200">
          {t("shippingSection.todays_collection")}
        </span>
        <span className="text-sm font-medium text-green-400">+45,000 MAD</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-blue-200">
          {t("shippingSection.commission_rate")}
        </span>
        <span className="text-sm font-medium text-white">8.5%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-blue-200">
          {t("shippingSection.next_payout")}
        </span>
        <span className="text-sm font-medium text-white">
          {t("shippingSection.tomorrow")}
        </span>
      </div>
    </div>
  </div>
</div>

          </div>

          {/* Key Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-blue-300" />
              </div>
              <h4 className="font-semibold text-white mb-2">
                {t("shippingSection.real_time_tracking")}
              </h4>
              <p className="text-sm text-blue-200">
                {t("shippingSection.real_time_tracking_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-blue-300" />
              </div>
              <h4 className="font-semibold text-white mb-2">
                {t("shippingSection.advanced_analytics")}
              </h4>
              <p className="text-sm text-blue-200">
                {t("shippingSection.advanced_analytics_desc")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-blue-300" />
              </div>
              <h4 className="font-semibold text-white mb-2">
                {t("shippingSection.secure_payments")}
              </h4>
              <p className="text-sm text-blue-200">
                {t("shippingSection.secure_payments_desc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

  );
}
