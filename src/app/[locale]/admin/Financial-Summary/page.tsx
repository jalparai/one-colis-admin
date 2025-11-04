
import React from 'react'
import FinancialSummaryPage from '@/components/Financials/financials';
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
        <FinancialSummaryPage />
    </div>
    </>
  )
}
// p
export default page