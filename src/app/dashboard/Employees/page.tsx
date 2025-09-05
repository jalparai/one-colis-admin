import { DataTableDemo } from '@/components/Employee/employee-table'
import { AddEmployee } from '@/components/Employee/Add-employee'
import { Button } from '@/components/ui/button'
import React from 'react'

function Page() {
  return (
    <>
    <div className=''>
      <div className='flex justify-between'>

        <h1 className='text-2lx font-bold'>Employees</h1>
        {/* <Button>+ Add Employee</Button> */}
        <AddEmployee />
        
      </div>
        <DataTableDemo />
    </div>
    </>
  )
}

export default Page