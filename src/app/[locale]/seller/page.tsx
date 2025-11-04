import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { HomeDashboard } from "@/components/SellerDashboard/Home";
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
      <HomeDashboard />

    </ProtectedRoute>
  );
}

export default AdminIndexPage;