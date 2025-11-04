import DeliveryFeeChecker from '@/components/SellerDashboard/CityFee/CityFee';
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
     
         <DeliveryFeeChecker />
    </div>
    </>
  )
}

export default page