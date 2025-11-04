import { PickUpTable } from '@/components/EmployeeDashboard/ManagePickups/ManagePickup';
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
     
         <PickUpTable />
    </div>
    </>
  )
}

export default page