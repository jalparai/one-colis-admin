
import React from 'react'
import CityFeePage from '@/components/FeeCity';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function CityFeepage() {
  return (
    <>
    <div className=''>
      <div className='flex justify-between'>

        {/* <Button>+ Add Employee</Button> */}

        
      </div>
        <CityFeePage />
    </div>
    </>
  )
}

export default CityFeepage