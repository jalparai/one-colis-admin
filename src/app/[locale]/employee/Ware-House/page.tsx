import { EmployeeWarehousesTable } from '@/components/EmployeeDashboard/WareHouses/WareHouse';
import React from 'react'
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
         <EmployeeWarehousesTable />
    </div>
    </>
  )
}

export default page