
import React from 'react'
import { PayoutTable } from '@/components/Payout/Payout';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function PayoutPage() {
  return (
    <>
    <div className=''>
        <PayoutTable />
    </div>
    </>
  )
}

export default PayoutPage