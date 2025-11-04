
import React from 'react'
import  MyPayoutsTable  from '@/components/Seller/payout';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function Page() {
  return (
    <>
    <div className=''>
        <MyPayoutsTable />
    </div>
    </>
  )
}

export default Page