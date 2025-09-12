import React from "react";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import data from "./data.json";
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function AdminIndexPage() {
  return (
    <>
      <SectionCards />
      <div>
      </div>
      {/* <DataTable data={data} /> */}
    </>
  );
}

export default AdminIndexPage;