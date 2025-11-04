import InvoicesTable from "@/components/Invoices/InvoicesTable";

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
    { locale: "ar" },
  ];
}

export default function AdminInvoicesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
      </div>
      <InvoicesTable />
    </div>
  );
}


