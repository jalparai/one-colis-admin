
import React from 'react'
import DeliveredVsReturned from '@/components/DeliveredVsReturned/DeliveredVsReturned';
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
      <div className='flex justify-between'>

        {/* <Button>+ Add Employee</Button> */}

        
      </div>
        <DeliveredVsReturned />
    </div>
    </>
  )
}

export default DeliveredVsReturnedpage