import DeliveryNotesTable from "@/components/DeliveryNotes/DeliveryNotesTable";

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "fr" },
    { locale: "ar" },
  ];
}

export default function ReturnNotesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Return Notes</h1>
      </div>
      <DeliveryNotesTable />
    </div>
  );
}


