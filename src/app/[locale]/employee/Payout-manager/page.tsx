
import { PayoutTable } from '@/components/EmployeeDashboard/Payout-manager/payout-table';
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
      <div className='flex justify-between'>

        {/* <Button>+ Add Employee</Button> */}

        
      </div>
        <PayoutTable />
    </div>
    </>
  )
}

export default PayoutPage