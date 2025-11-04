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
import { ArrowUpDown, ChevronDown } from "lucide-react";
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
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Stock = {
  _id: string;
  sku: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  createdAt: string;
};

export const stockColumns: ColumnDef<Stock>[] = [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        SKU
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("sku")}</div>,
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return <div>${(price ?? 0).toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => <div>{row.getValue("quantity")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date Added",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      return <div>{dateStr ? new Date(dateStr).toLocaleDateString() : "-"}</div>;
    },
  },
];

export function StocksTable() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // token helper (unchanged)
  function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    const keys = ["authToken", "token", "accessToken", "jwt", "sessionToken"];
    for (const k of keys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v) return v;
    }
    const cookieMatch = document.cookie.match(
      /(?:^|; )(?:authToken|token|accessToken|jwt|sessionToken)=([^;]+)/,
    );
    if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
    return null;
  }

  // 🟢 Fetch Stocks - now uses getAuthToken and normalizes response
  const fetchStocks = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      console.debug("Auth token:", token);

      if (!token) {
        console.warn("No token found. Please login.");
        setStocks([]); // explicit
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/seller/seller/stock",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.debug("fetchStocks response:", res);

      // Normalize possible response shapes:
      // - res.data may already be an array
      // - res.data.data may be the array
      // - res.data.stocks or res.data.items could be the array
      const payload = res.data;
      let final: Stock[] = [];

      if (Array.isArray(payload)) {
        final = payload;
      } else if (Array.isArray(payload?.data)) {
        final = payload.data;
      } else if (Array.isArray(payload?.stocks)) {
        final = payload.stocks;
      } else if (Array.isArray(payload?.items)) {
        final = payload.items;
      } else if (Array.isArray(payload?.result)) {
        final = payload.result;
      } else {
        // if payload is object and looks like { success: true, data: [...] } already covered,
        // otherwise try to coerce to array gracefully:
        final = Array.isArray(payload) ? payload : [];
      }

      setStocks(final);
      // for debugging: if final is empty but payload had something else, log payload
      if (final.length === 0) {
        console.warn("No stocks parsed from response. Full payload:", payload);
      }
    } catch (err: any) {
      console.error("Error fetching stock:", err.response?.data || err.message);
      // Optionally, if you want to show a specific UI message, set state for that
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // 🟡 Filter stocks by date
  const filteredData = React.useMemo(() => {
    if (dateFilter === "all") return stocks;

    const today = new Date();
    return stocks.filter((stock) => {
      if (!stock?.createdAt) return false;
      const date = new Date(stock.createdAt);

      switch (dateFilter) {
        case "today":
          return date.toDateString() === today.toDateString();
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return date.toDateString() === yesterday.toDateString();
        case "thisWeek":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(0, 0, 0, 0);
          return date >= weekStart;
        case "lastWeek":
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
          lastWeekStart.setHours(0, 0, 0, 0);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
          return date >= lastWeekStart && date < lastWeekEnd;
        case "thisMonth":
          return (
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          );
        case "lastMonth":
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          return (
            date.getMonth() === lastMonth.getMonth() &&
            date.getFullYear() === lastMonth.getFullYear()
          );
        default:
          return true;
      }
    });
  }, [dateFilter, stocks]);

  // 🧩 React Table Setup (added onColumnFiltersChange etc.)
  const table = useReactTable({
    data: filteredData,
    columns: stockColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  if (loading) return <p className="p-4">Loading stock...</p>;
  const exportEndpoints = [
    { label: "Export Stock", url: "https://cod-ecommerce-two.vercel.app/api/seller/stock/export" },
    //   { label: "Export Sellers", url: "/api/adminb/bulk/seller/export/excal" },
    //   { label: "Export Warehouses", url: "/api/adminb/bulk/warehouse/export/excal" },
    //   { label: "Export Payout Managers", url: "/api/adminb/bulk/payout-manager/export/excel" },
    //   { label: "Export Delivery Agents", url: "/api/adminb/bulk/delivery-agents/export/excel" },
  ];

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
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-2 flex-wrap">
        <Input
          placeholder="Filter by product..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {/* Date Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {dateFilter === "all"
                ? "All"
                : dateFilter.replace(/([A-Z])/g, " $1")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDateFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("today")}>Today</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>Yesterday</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("thisWeek")}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("lastWeek")}>Last Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("thisMonth")}>This Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("lastMonth")}>Last Month</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                <TableCell
                  colSpan={stockColumns.length}
                  className="h-24 text-center"
                >
                  No stock found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getRowModel().rows.length} items
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
