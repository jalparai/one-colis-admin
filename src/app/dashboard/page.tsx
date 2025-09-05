import React from "react";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import data from "./data.json";

function AdminIndexPage() {
  return (
    <>
      <SectionCards />
      <div>
      </div>
      <DataTable data={data} />
    </>
  );
}

export default AdminIndexPage;