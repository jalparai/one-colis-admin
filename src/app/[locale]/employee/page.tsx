import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/components/EmployeeDashboard/Home";
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function AdminIndexPage() {
  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      <Home />
    </ProtectedRoute>
  );
}

export default AdminIndexPage;