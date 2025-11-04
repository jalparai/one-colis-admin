import StockTrendsPage from '@/components/StockTrend/StrockTrend';
import React from 'react'
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
         <StockTrendsPage />
    </div>
    </>
  )
}

export default page