import { MyPayoutsTable } from '@/components/PayoutDashboard/GetMyPaouts';
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
     
         <MyPayoutsTable />
    </div>
    </>
  )
}

export default page