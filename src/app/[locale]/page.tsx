'use client';
import { useTranslation } from 'react-i18next';
// import { useState,useEffect } from 'react';
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
import * as React from 'react';

import Image from "next/image"
import Shiping from "../../../public/Shipping.png"
import Header from '@/components/Landing-page/Header';
import FooterLogo from "../../../public/images/One-Colis.png"
import AboutUsImage from "../../../public/about-us.jpeg"
import CityTable from "../../components/Landing-page/Pricing"
import ClientLogosSection from '@/components/Landing-page/ClientLogosSection';
import ClientTestimonials from '@/components/Landing-page/ClientTestimonials';
import { IconLocationPin } from '@tabler/icons-react';
import HeroWithTracking from '../../components/Landing-page/HeroWithTracking';
import { notFound } from 'next/navigation';
import FAQ from '@/components/Landing-page/Faqs';
import AboutSection from '@/components/Landing-page/AboutSection';
import ProcessSection from '@/components/Landing-page/ProcessSection';

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!['en', 'fr', 'ar'].includes(locale)) {
    notFound();
  }

  const { t } = useTranslation('common'); // your translation hook

  

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
    <div className="min-h-screen bg-background">

<Header />
     <HeroWithTracking />
   {/* Commitments Section */}
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
      {/* Hero Section */}



{/* Partnership / About Us Section */}
<AboutSection />



      {/* Shipping Process Section */}
<ProcessSection />


      {/* Infrastructure Section */}
    {/* Infrastructure Section */}
    <section
      id="infrastructure"
      className="pt-24 px-4 relative overflow-hidden bg-white"
    >
      <div className="container mx-auto relative z-10 lg:w-[90%] w-[95%]">
        
        {/* Title */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {t("infrastructure.title.part1")}{" "}
            <span className="text-gray-800">{t("infrastructure.title.part2")}</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            {t("infrastructure.subtitle")}
          </p>
        </div>

        {/* Showcase Cards */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {[
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
          ].map((item, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl shadow-lg group"
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:via-black/50 transition-all"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
                <p className="text-sm opacity-90">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

     
      </div>
    </section>

<ClientLogosSection />


      {/* Dashboard Preview Section */}
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


    
<ClientTestimonials />
<FAQ />
    {/* Contact Section */}
{/* Contact Section */}
{/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{t("contact.title")}</h2>
          <p className="text-gray-600 mt-2">{t("contact.subtitle")}</p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 mb-10 px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <IconLocationPin />
            </div>
            <span className="text-gray-800 font-medium">{t("contact.address")}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <MailIcon />
            </div>
            <span className="text-gray-800 font-medium">{t("contact.email")}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <PhoneCall />
            </div>
            <span className="text-gray-800 font-medium">{t("contact.phone")}</span>
          </div>
        </div>

        {/* Contact Form + Map */}
        <div className="container mx-auto w-[95%] lg:w-[90%] px-6 grid md:grid-cols-2 gap-10 items-start">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t("contact.formTitle")}</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={t("contact.firstName")}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                />
                <input
                  type="text"
                  placeholder={t("contact.lastName")}
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                />
              </div>
              <input
                type="email"
                placeholder={t("contact.emailPlaceholder")}
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
              />
              <input
                type="text"
                placeholder={t("contact.subject")}
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
              />
              <textarea
                rows={4}
                placeholder={t("contact.message")}
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
              ></textarea>
              <button
                type="submit"
                className="bg-[#2BC3F1] hover:bg-sky-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition"
              >
                {t("contact.send")}
              </button>
            </form>
          </div>

          {/* Map */}
           <div className="h-full w-full">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3313.0698766409105!2d-5.5670024!3d33.86209!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda05be9d3327959%3A0xa13ce6535da819cf!2sOneColis!5e0!3m2!1sen!2s!4v1756999806488!5m2!1sen!2s"
        width="100%"
        height="500"
        style={{ border: 0 }}
        // allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="rounded-lg shadow-md"
      ></iframe>
    </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-10">
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className="flex justify-center items-center space-x-2">
            <Image src={FooterLogo} alt="Footer Logo" className="w-50" />
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <a href="#About" className="hover:text-white transition-colors">{t("footer.about")}</a>
            <a href="#process" className="hover:text-white transition-colors">{t("footer.process")}</a>
            <a href="#infrastructure" className="hover:text-white transition-colors">{t("footer.services")}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{t("footer.testimonials")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("footer.pricing")}</a>
            <a href="#Faq" className="hover:text-white transition-colors">{t("footer.faq")}</a>
            <a href="#contact" className="hover:text-white transition-colors">{t("footer.contact")}</a>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500">{t("footer.rights")}</p>
        </div>
      </footer>
    </div>
  )
}
