import React from 'react'
import RevenueByCityPage from '@/components/RevenueCity/RevenueCity';

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function page() {
  return (
    <>
    <div className=''>
         <RevenueByCityPage  />
    </div>
    </>
  )
}

export default page