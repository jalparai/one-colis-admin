import TopProductsPage from '@/components/TopProducts/TopProducts';
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
         <TopProductsPage />
    </div>
    </>
  )
}

export default page