
// import { useState,useEffect } from 'react';
import * as React from 'react';


import Header from '@/components/Landing-page/Header';

import ClientLogosSection from '@/components/Landing-page/ClientLogosSection';
import ClientTestimonials from '@/components/Landing-page/ClientTestimonials';
import HeroWithTracking from '../../components/Landing-page/HeroWithTracking';
import { notFound } from 'next/navigation';
import FAQ from '@/components/Landing-page/Faqs';
import AboutSection from '@/components/Landing-page/AboutSection';
import ProcessSection from '@/components/Landing-page/ProcessSection';
import Commitments from "@/components/Landing-page/Commitments";
import DashSection from "@/components/Landing-page/DashboardSection";
import Contact from "@/components/Landing-page/Contact";
import ServiceSection from '@/components/Landing-page/Services';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params); // ✅ unwrap

  if (!["en", "fr", "ar"].includes(locale)) {
    notFound();
  }


  return (
    <div className="min-h-screen bg-background">

<Header />
     <HeroWithTracking />
   {/* Commitments Section */}
     <Commitments />
      {/* Hero Section */}



{/* Partnership / About Us Section */}
<AboutSection />

<ServiceSection />

      {/* Shipping Process Section */}
<ProcessSection />


      {/* Infrastructure Section */}
    {/* Infrastructure Section */}


<ClientLogosSection />


      {/* Dashboard Preview Section */}
      <DashSection />

    
<ClientTestimonials />
<FAQ />
    {/* Contact Section */}
{/* Contact Section */}
{/* Contact Section */}
    <Contact />
    </div>
  )
}
