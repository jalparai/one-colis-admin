
import React from 'react'
import PayoutHistoryPage from '@/components/PayoutHistory/PayoutHistory';
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
        <PayoutHistoryPage />
    </div>
    </>
  )
}

export default page