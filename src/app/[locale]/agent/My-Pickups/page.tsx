import { DeliveryPickupsTable } from '@/components/AgentDashoard/Mypickups';
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
     
         <DeliveryPickupsTable />
    </div>
    </>
  )
}

export default page