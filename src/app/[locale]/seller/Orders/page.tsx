
import React from 'react'
import { OrderTable } from '@/components/SellerDashboard/Orders/order-table';
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
        <OrderTable />
    </div>
    </>
  )
}

export default PayoutPage