"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast"; // ✅ import toast
import {
  Facebook, Twitter, Linkedin,
  MailIcon, PhoneCall
} from "lucide-react";
import { IconLocationPin } from "@tabler/icons-react";
import FooterLogo from "../../../public/images/One-Colis.png";

export default function Contact() {
  const { t, i18n } = useTranslation("common");
  const isArabic = i18n.language === "ar";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("https://cod-ecommerce-two.vercel.app/api/shared/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (res.ok) {
        toast.success(t("contact.successMessage") || "Message sent successfully 🎉");
        setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" });
      } else {
        toast.error(t("contact.errorMessage") || "Failed to send message ❌");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section id="contact" className="py-20 bg-gray-50" dir={isArabic ? "rtl" : "ltr"}>
        <div className="text-center mb-12 ">
          <h2 className="text-3xl font-bold text-gray-800">{t("contact.title")}</h2>
          <p className="text-gray-600 mt-2">{t("contact.subtitle")}</p>
        </div>

        {/* Contact Info */}
        <div className={`flex flex-col md:flex-row lg:justify-center lg:items-center gap-10 mb-10 px-6 ${isArabic ? "md:flex-row-reverse" : ""}`}>
          <div className="flex items-center space-x-3 md:space-x-3 md:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-full">
              <IconLocationPin />
            </div>
            <span className="text-gray-800 font-medium ml-2">{t("contact.address")}</span>
          </div>
          <div className="flex items-center space-x-3 md:space-x-3 md:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-full">
              <MailIcon />
            </div>
            <span className="text-gray-800 font-medium ml-2">{t("contact.email")}</span>
          </div>
          <div className="flex items-center space-x-3 md:space-x-3 md:space-x-reverse">
            <div className="bg-blue-100 p-3 rounded-full">
              <PhoneCall />
            </div>
            <span className="text-gray-800 font-medium ml-2">{t("contact.phone")}</span>
          </div>
        </div>

        {/* Form & Map */}
        <div className="container mx-auto w-[95%] lg:w-[90%] lg:px-6 px-2 grid md:grid-cols-2 gap-10 items-start">
          {/* Contact Form */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className={`text-2xl font-bold text-gray-800 mb-6 ${isArabic ? "text-right" : ""}`}>
              {t("contact.formTitle")}
            </h3>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder={t("contact.firstName")} className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full" required />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder={t("contact.lastName")} className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full" required />
              </div>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t("contact.emailPlaceholder")} className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full" required />
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder={t("contact.subject")} className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full" required />
              <textarea name="message" rows={4} value={formData.message} onChange={handleChange} placeholder={t("contact.message")} className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full" required></textarea>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#2BC3F1] hover:bg-sky-400 disabled:opacity-70 disabled:cursor-not-allowed 
             text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    {t("Sending...") || "Sending..."}
                  </>
                ) : (
                  t("contact.send")
                )}
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
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg shadow-md"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-10" dir={isArabic ? "rtl" : "ltr"}>
        <div className="container mx-auto px-6 text-center space-y-6">
          <div className={`flex justify-center items-center space-x-2 ${isArabic ? "space-x-reverse" : ""}`}>
            <Image src={FooterLogo} alt="Footer Logo" className="w-50" />
          </div>

          {/* Links */}
          <div className={`flex flex-wrap justify-center gap-6 text-sm text-gray-400 ${isArabic ? "flex-row-reverse" : ""}`}>
            <a href="#About" className="hover:text-white transition-colors">{t("footer.about")}</a>
            <a href="#process" className="hover:text-white transition-colors">{t("footer.process")}</a>
            <a href="#infrastructure" className="hover:text-white transition-colors">{t("footer.services")}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{t("footer.testimonials")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("footer.pricing")}</a>
            <a href="#Faq" className="hover:text-white transition-colors">{t("footer.faq")}</a>
            <a href="#contact" className="hover:text-white transition-colors">{t("footer.contact")}</a>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center space-x-6 text-gray-400 ">
            <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
          </div>

          {/* Copyright */}
          <p className={`text-xs text-gray-500 ${isArabic ? "text-right" : ""}`}>{t("footer.rights")}</p>
        </div>
      </footer>
    </>
  );
}
