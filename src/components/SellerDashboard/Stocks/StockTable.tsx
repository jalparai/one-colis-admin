"use client";

import * as React from "react";
import axios from "axios";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return <div>{(price ?? 0).toFixed(2)} DH</div>;
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // NEW: from / to date range (ISO yyyy-mm-dd strings)
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  // NEW: pagination state - default pageSize set to 50 so the table shows > 10 items
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 50 });

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
        final = Array.isArray(payload) ? payload : [];
      }

// normalize quantity to a non-negative integer (treat missing / invalid / negative as 0)
const safeFinal: Stock[] = final.map((item: any) => ({
  ...item,
  quantity: (() => {
    const n = Number(item?.quantity);
    if (!Number.isFinite(n)) return 0;
    // treat negative values (e.g. -1) as 0
    return Math.max(0, Math.floor(n));
  })(),
}));

setStocks(safeFinal);
      if (final.length === 0) {
        console.warn("No stocks parsed from response. Full payload:", payload);
      }
    } catch (err: any) {
      console.error("Error fetching stock:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // helper: strip time (set to start of day)
  const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  // helper: end of day (set to 23:59:59.999)
  const endOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
  };

  // additional helpers for presets
  const startOfWeek = (d: Date) => {
    const c = new Date(d);
    c.setDate(c.getDate() - c.getDay());
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfWeek = (d: Date) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return endOfDay(e);
  };
  const startOfMonth = (d: Date) => {
    const c = new Date(d.getFullYear(), d.getMonth(), 1);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfMonth = (d: Date) => {
    const c = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return endOfDay(c);
  };
  const formatISODate = (d: Date) => d.toISOString().slice(0, 10);

  // Apply preset: sets dateFilter AND updates fromDate/toDate so both controls stay in sync.
  const applyPreset = (preset: typeof dateFilter) => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case "all":
        from = null;
        to = null;
        break;
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday": {
        const y = new Date();
        y.setDate(today.getDate() - 1);
        from = startOfDay(y);
        to = endOfDay(y);
        break;
      }
      case "thisWeek":
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      case "lastWeek": {
        const lwStart = startOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
        from = lwStart;
        to = endOfWeek(lwStart);
        break;
      }
      case "thisMonth":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "lastMonth": {
        const lm = new Date();
        lm.setMonth(lm.getMonth() - 1);
        from = startOfMonth(lm);
        to = endOfMonth(lm);
        break;
      }
    }

    setDateFilter(preset);
    setFromDate(from ? formatISODate(from) : "");
    setToDate(to ? formatISODate(to) : "");
  };

  // 🟡 Filter stocks by date (now supports From/To range; range takes priority but preset fills the range)
  const filteredData = React.useMemo(() => {
    // if no stocks yet
    if (!stocks || stocks.length === 0) return [];

    // If user provided a from/to range (either), use that priority
    const useRange = !!(fromDate || toDate);
    if (useRange) {
      let from: Date | null = null;
      let to: Date | null = null;
      if (fromDate) {
        const parsed = new Date(fromDate);
        if (!Number.isNaN(parsed.getTime())) from = startOfDay(parsed);
      }
      if (toDate) {
        const parsed = new Date(toDate);
        if (!Number.isNaN(parsed.getTime())) to = endOfDay(parsed);
      }

      return stocks.filter((stock) => {
        if (!stock?.createdAt) return false;
        const d = new Date(stock.createdAt);
        if (isNaN(d.getTime())) return false;
        if (from && to) {
          return d >= from && d <= to;
        } else if (from) {
          return d >= from;
        } else if (to) {
          return d <= to;
        } else {
          return true;
        }
      });
    }

    // otherwise fallback to existing preset dateFilter behavior
    if (dateFilter === "all") return stocks;

    const today = new Date();
    return stocks.filter((stock) => {
      if (!stock?.createdAt) return false;
      const date = new Date(stock.createdAt);
      if (isNaN(date.getTime())) return false;

      switch (dateFilter) {
        case "today":
          return date.toDateString() === today.toDateString();
        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return date.toDateString() === yesterday.toDateString();
        }
        case "thisWeek": {
          const weekStart = startOfWeek(today);
          const weekEnd = endOfWeek(today);
          return date >= weekStart && date <= weekEnd;
        }
        case "lastWeek": {
          const lastWeekStart = startOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
          const lastWeekEnd = endOfWeek(lastWeekStart);
          return date >= lastWeekStart && date <= lastWeekEnd;
        }
        case "thisMonth": {
          const sm = startOfMonth(today);
          const em = endOfMonth(today);
          return date >= sm && date <= em;
        }
        case "lastMonth": {
          const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const sm = startOfMonth(lm);
          const em = endOfMonth(lm);
          return date >= sm && date <= em;
        }
        default:
          return true;
      }
    });
  }, [dateFilter, stocks, fromDate, toDate]);

  // 🧩 React Table Setup (added onColumnFiltersChange etc.)
  const table = useReactTable({
    data: filteredData,
    columns: stockColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
  });

  if (loading) return <p className="p-4">Loading stock...</p>;

  const exportEndpoints = [
    { label: "Export Stock", url: "https://cod-ecommerce-two.vercel.app/api/seller/stock/export" },
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
      } else {
        credentials = "include";
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials,
      });

      if (!response.ok) {
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
        <div className="flex items-center gap-2">
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
              <DropdownMenuItem onClick={() => applyPreset("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("yesterday")}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("thisWeek")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("lastWeek")}>Last Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("thisMonth")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("lastMonth")}>Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* From / To date inputs (functional range) */}
          <div className="flex items-center gap-2">
            <label className="text-sm mr-1">From:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
              className="max-w-[160px]"
            />
            <label className="text-sm mr-1 ml-2">To:</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
              className="max-w-[160px]"
            />

            {/* Clear range button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setDateFilter("all");
              }}
            >
              Clear
            </Button>
          </div>
        </div>

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
