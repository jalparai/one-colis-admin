import { AddWearhouse } from '@/components/Warehouse/add-wearhouse'
import { WearHouseTable } from '@/components/Warehouse/wearhouse-table'
import React from 'react'

function page() {
  return (
    <>
    <div className=''>
      <div className='flex justify-between'>

        <h1 className='text-2lx font-bold'>Ware Houses</h1>
 {/* <AddWearhouse /> */}
      </div>
         <WearHouseTable />
    </div>
    </>
  )
}

export default page