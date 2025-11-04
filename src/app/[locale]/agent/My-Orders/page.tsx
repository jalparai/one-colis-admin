import { DeliveryOrdersTable } from '@/components/AgentDashoard/MyOrder/GetOrder';
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
     
         <DeliveryOrdersTable />
    </div>
    </>
  )
}

export default page