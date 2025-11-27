import { EmployeeOrdersTable } from '@/components/EmployeeDashboard/EmployeeOrderTable/EmployeeOrderTable';
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
        <EmployeeOrdersTable />
      </div>
    </>
  )
}

export default page