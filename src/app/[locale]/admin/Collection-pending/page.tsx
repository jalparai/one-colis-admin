
import React from 'react'
import CollectedVsPendingPage from '@/components/Collection/Collection';
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function CollectionPage() {
  return (
    <>
    <div className=''>
      <div className='flex justify-between'>

        {/* <Button>+ Add Employee</Button> */}

        
      </div>
        <CollectedVsPendingPage />
    </div>
    </>
  )
}

export default CollectionPage