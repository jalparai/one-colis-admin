import { SupportTicketsTable } from '@/components/SupportTicks/SupportTicks';
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
         <SupportTicketsTable />
    </div>
    </>
  )
}

export default page