import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Home } from "@/components/AgentDashoard/Home";
export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
      { locale: "ar" },
  ];
}
function AdminIndexPage() {
  return (
    <ProtectedRoute allowedRoles={["deliveryagent"]}>
      <Home />
    </ProtectedRoute>
  );
}

export default AdminIndexPage;