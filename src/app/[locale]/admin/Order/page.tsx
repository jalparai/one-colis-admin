
import React from 'react'
import { OrdersTable } from '@/components/Order/Orders';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function OrderPage() {
  return (
    <>
    <div className=''>
      <div className='flex justify-between'>

        {/* <Button>+ Add Employee</Button> */}

        
      </div>
        <OrdersTable />
    </div>
    </>
  )
}

export default OrderPage