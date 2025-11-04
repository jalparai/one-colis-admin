import { PickupsTable } from '@/components/SellerDashboard/Pickups/Pickups';
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
     
         <PickupsTable />
    </div>
    </>
  )
}

export default page