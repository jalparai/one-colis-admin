import { Button } from '@/components/ui/button'
import React from 'react'

import { EmployeesTable } from '@/components/Employee/employee-table';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function EmployeesPage() {
    // const { t } = useTranslation('common');
  
  return (
    <>
    <div className=''>
      <div className='flex justify-between'>
{/* <LanguageSwitcher /> */}
        {/* <h1 className="text-2xl font-bold">{t("employees")}</h1> */}
        {/* <Button>+ Add Employee</Button> */}
        {/* <AddEmployee /> */}
        
      </div>
        <EmployeesTable /> {/* ✅ use the correct component */}
 
    </div>
    </>
  )
}

export default EmployeesPage