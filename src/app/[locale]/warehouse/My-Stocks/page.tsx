import { WarehouseProductsTable } from '@/components/warehouseDashobard/GetMySTock';
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
     
         <WarehouseProductsTable />
    </div>
    </>
  )
}

export default page