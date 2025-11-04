import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Home } from "@/components/warehouseDashobard/Home";
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function AdminIndexPage() {
  return (
    <ProtectedRoute allowedRoles={["warehouse"]}>
      <Home />
    </ProtectedRoute>
  );
}

export default AdminIndexPage;