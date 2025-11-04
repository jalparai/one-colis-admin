import TopAgentsPage from '@/components/TopAgents/TopAgents';
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
         <TopAgentsPage />
    </div>
    </>
  )
}

export default page