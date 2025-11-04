
import React from 'react'
import SellerReports from '@/components/SellerDashboard/reports/reports';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function Page() {
  return (
    <>
    <div className=''>
        <SellerReports />
    </div>
    </>
  )
}

export default Page