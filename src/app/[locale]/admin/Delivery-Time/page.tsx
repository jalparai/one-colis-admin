
import React from 'react'
import AverageDeliveryTimePage from '@/components/AverageDeliveryTimePage/AverageDeliveryTimePage';
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
        <AverageDeliveryTimePage />
    </div>
    </>
  )
}

export default page