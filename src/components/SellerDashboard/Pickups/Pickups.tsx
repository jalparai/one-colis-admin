"use client";

import * as React from "react";
import axios from "axios";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Pickup type
export type Pickup = {
  _id: string;
  items: { sku: string; productName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  notes: string;
  status: string;
  createdAt: string;
};

// Table columns
export const pickupColumns: ColumnDef<Pickup>[] = [
  {
    accessorKey: "items",
    header: "Product",
    cell: ({ row }) => {
      const items = row.getValue("items") as Pickup["items"];
      return (
        <div>
          {items.map((i, idx) => (
            <div key={idx}>
              {i.productName} ({i.sku})
            </div>
          ))}
        </div>
      );
    },
  },
  {
    id: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => {
      const items = row.getValue("items") as Pickup["items"];
      return (
        <div>
          {items.map((i, idx) => (
            <div key={idx}>dh-{i.unitPrice}</div>
          ))}
        </div>
      );
    },
  },
  {
    id: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const items = row.getValue("items") as Pickup["items"];
      return (
        <div>
          {items.map((i, idx) => (
            <div key={idx}>{i.quantity}</div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => <div>dh-{row.getValue("totalAmount")}</div>,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <div>{row.getValue("notes")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 rounded text-xs ${status === "pickup_requested"
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600"
            }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      return <div>{new Date(dateStr).toLocaleString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const pickup = row.original;
      const isReady = pickup.status === "ready";

      const handleRequestPickup = async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `https://cod-ecommerce-two.vercel.app/api/seller/orders/${pickup._id}/request-pickup`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert("✅ Pickup requested successfully");
        } catch (err: any) {
          console.error("Pickup request failed:", err.response?.data || err.message);
          alert(err.response?.data?.message || "❌ Failed to request pickup");
        }
      };

      return (
        <Button
          size="sm"
          variant="outline"
          disabled={!isReady}
          onClick={handleRequestPickup}
        >
          Request Pickup
        </Button>
      );
    },
  },
];

export function PickupsTable() {
  const [pickups, setPickups] = React.useState<Pickup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  const dateLabels: Record<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth",
    string
  > = {
    all: "All",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
  };

  const fetchPickups = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. Please login.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/seller/my-pickups",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPickups(res.data.data || []);
    } catch (err: any) {
      console.error("Error fetching pickups:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  // Date filter logic
  const filteredData = React.useMemo(() => {
    let data = [...pickups];
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(startOfWeek.getDate() - 1);
    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    data = data.filter((p) => {
      const created = new Date(p.createdAt);

      switch (dateFilter) {
        case "today":
          return created.toDateString() === now.toDateString();
        case "yesterday": {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return created.toDateString() === yesterday.toDateString();
        }
        case "thisWeek":
          return created >= startOfWeek;
        case "lastWeek":
          return created >= startOfLastWeek && created <= endOfLastWeek;
        case "thisMonth":
          return created >= startOfMonth;
        case "lastMonth":
          return created >= startOfLastMonth && created <= endOfLastMonth;
        default:
          return true;
      }
    });

    return data;
  }, [pickups, dateFilter]);

  const table = useReactTable({
    data: filteredData,
    columns: pickupColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  if (loading) return <p className="p-4">Loading pickups...</p>;

  const exportEndpoints = [
    { label: "Export Pickup", url: "https://cod-ecommerce-two.vercel.app/api/seller/reports/export-pickups" },
    //   { label: "Export Sellers", url: "/api/adminb/bulk/seller/export/excal" },
    //   { label: "Export Warehouses", url: "/api/adminb/bulk/warehouse/export/excal" },
    //   { label: "Export Payout Managers", url: "/api/adminb/bulk/payout-manager/export/excel" },
    //   { label: "Export Delivery Agents", url: "/api/adminb/bulk/delivery-agents/export/excel" },
  ];

    function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // common keys your app might use
  const keys = ["authToken", "token", "accessToken", "jwt", "sessionToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v) return v;
  }

  // cookie (non-httpOnly)
  const cookieMatch = document.cookie.match(
    /(?:^|; )(?:authToken|token|accessToken|jwt|sessionToken)=([^;]+)/,
  );
  if (cookieMatch) return decodeURIComponent(cookieMatch[1]);

  return null;
}



const handleExport = async (url: string): Promise<void> => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    let credentials: RequestCredentials | undefined = undefined;

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      // no credentials needed for token-based auth
    } else {
      // no token — try cookie-based auth: ask browser to include cookies
      credentials = "include"; // IMPORTANT: server must support CORS with credentials
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials,
    });

    if (!response.ok) {
      // get backend error text to help debugging
      const errorText = await response.text().catch(() => "(no body)");
      throw new Error(`Export failed: ${response.status} ${errorText}`);
    }

    const blob = await response.blob();
    const cd = response.headers.get("content-disposition");
    let filename = "export.xlsx";
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);
      if (match?.[1]) filename = decodeURIComponent(match[1]);
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error("handleExport error:", err);
    // show UI feedback here if you want
  }
};

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        <Input
          placeholder="Search by notes..."
          value={(table.getColumn("notes")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("notes")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

       {exportEndpoints.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            className="mb-3"
            onClick={() => handleExport(item.url)}
          >
            {item.label} Excel
          </Button>
        ))}

        {/* Date filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {dateLabels[dateFilter]}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(dateLabels) as (keyof typeof dateLabels)[]).map((key) => (
              <DropdownMenuItem key={key} onClick={() => setDateFilter(key)}>
                {dateLabels[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={pickupColumns.length} className="h-24 text-center">
                  No pickups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredRowModel().rows.length} items
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
