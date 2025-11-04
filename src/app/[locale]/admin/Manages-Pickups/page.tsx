
import React from 'react'
import { PickUpTable } from '@/components/MangesPickups/Pickups';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function DeliveredVsReturnedpage() {
  return (
    <>
    <div className=''>
        <PickUpTable />
    </div>
    </>
  )
}

export default DeliveredVsReturnedpage