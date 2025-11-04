import { DeliveryAgentTable } from '@/components/EmployeeDashboard/DeliveryAgent/DeliveryAgent';
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
     
         <DeliveryAgentTable />
    </div>
    </>
  )
}

export default page