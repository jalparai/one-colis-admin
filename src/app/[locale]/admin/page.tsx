import React from "react";
// import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import Analyis from "@/components/analysis";
import ProtectedRoute from "@/components/ProtectedRoute";
// import data from "./data.json";
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
      {/* <SectionCards /> */}
    <ProtectedRoute allowedRoles={["admin"]}>
        <Analyis />
    </ProtectedRoute>
      {/* <DataTable data={data} /> */}
    </>
  );
}

export default AdminIndexPage;