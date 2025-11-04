import { DeliveryCollectionTable } from '@/components/SellerDashboard/DeliveryCollection/Delivery';
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
     
         <DeliveryCollectionTable />
    </div>
    </>
  )
}

export default page