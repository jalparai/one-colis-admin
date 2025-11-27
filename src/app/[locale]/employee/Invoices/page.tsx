import InvoicesTableAdmin from "@/components/EmployeeDashboard/Invoices/Invoices";

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
    { locale: "ar" },
  ];
}

export default function SellerInvoicesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Invoices</h1>
      </div>
      <InvoicesTableAdmin />
    </div>
  );
}


