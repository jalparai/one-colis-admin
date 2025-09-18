import React from "react";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import data from "./data.json";
import ProtectedRoute from "@/components/ProtectedRoute";
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function AdminIndexPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <SectionCards />
      <div>
      </div>
      {/* <DataTable data={data} /> */}
    </ProtectedRoute>
  );
}

export default AdminIndexPage;