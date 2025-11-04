import { SellerTable } from '@/components/EmployeeDashboard/Seller/AddSellers';
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
     
         <SellerTable />
    </div>
    </>
  )
}

export default page