import TopSellers from '@/components/TopSellers/TopSellers';
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
    
         <TopSellers />
    </div>
    </>
  )
}

export default page