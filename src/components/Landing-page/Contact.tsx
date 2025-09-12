"use client";

import Image from "next/image";
import { useTranslation, Trans } from "react-i18next";

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
import { IconLocationPin } from '@tabler/icons-react';
import FooterLogo from "../../../public/images/One-Colis.png"

export default function Contact() {
  const { t } = useTranslation("common");

  return (
     <>
    <section id="contact" className="py-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{t("contact.title")}</h2>
          <p className="text-gray-600 mt-2">{t("contact.subtitle")}</p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col md:flex-row justify-center items-start gap-10 mb-10 px-6">
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
     </>
  );
}
