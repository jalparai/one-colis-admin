import { TicketsTable } from '@/components/SellerDashboard/SupportTickets/SupportTickets';
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
     
         <TicketsTable />
    </div>
    </>
  )
}

export default page