import { StocksTable } from '@/components/Stocks/Stock';
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
         <StocksTable />
    </div>
    </>
  )
}

export default page