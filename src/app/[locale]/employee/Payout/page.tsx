
import { PayoutTable } from '@/components/EmployeeDashboard/Payout/Payout';
import React from 'react'
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