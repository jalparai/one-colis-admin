// // components/admin/ExportButtons.js
// "use client";
// import React from "react";

// const exportEndpoints = [
//   { label: "Export Employees", url: "/api/adminb/bulk/employee/export/excal" },
// //   { label: "Export Sellers", url: "/api/adminb/bulk/seller/export/excal" },
// //   { label: "Export Warehouses", url: "/api/adminb/bulk/warehouse/export/excal" },
// //   { label: "Export Payout Managers", url: "/api/adminb/bulk/payout-manager/export/excel" },
// //   { label: "Export Delivery Agents", url: "/api/adminb/bulk/delivery-agents/export/excel" },
// ];

// export default function ExportButtons() {
//   const handleExport = async (url: string): Promise<void> => {
//     try {
//       const response = await fetch(url);
//       if (!response.ok) throw new Error("Failed to export data");
//       const blob = await response.blob();
//       const downloadUrl = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = downloadUrl;
//       a.download = "export.xlsx";
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(downloadUrl);
//     } catch (error) {
//       console.error(error);
//       alert("Error exporting file!");
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//       {exportEndpoints.map((item) => (
//         <button
//           key={item.label}
//           onClick={() => handleExport(item.url)}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           {item.label}
//         </button>
//       ))}
//     </div>
//   );
// }
