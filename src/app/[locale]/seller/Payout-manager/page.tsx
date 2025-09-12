
import React from 'react'
import { DeliveryTable } from '@/components/Delivery-agent/delivery-agent-table'
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
      <div className='flex justify-between'>

        {/* <Button>+ Add Employee</Button> */}

        
      </div>
        <DeliveryTable />
    </div>
    </>
  )
}

export default PayoutPage