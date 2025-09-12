import { SellerTable } from '@/components/Seller/seller-table'
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
      <div className='flex justify-between'>

        <h1 className='text-2lx font-bold'>Seller</h1>
 
      </div>
         <SellerTable />
    </div>
    </>
  )
}

export default page