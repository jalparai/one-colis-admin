"use client";

import * as React from "react";
import axios from "axios";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
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
import { ChevronDown, Copy } from "lucide-react";

// Payout type for seller view (no seller info shown)
type Payout = {
  _id: string;
  amount: number;
  fees: number;
  netAmount: number;
  status: string;
  method?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export default function MyPayoutsTable() {
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // rangeFilter now stored as { from?: "yyyy-mm-dd", to?: "yyyy-mm-dd" }
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({});

  // tokenKey - adjust if your app stores token under a different key
  const tokenKey = "token";

  const fetchPayouts = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const base = "https://cod-ecommerce-two.vercel.app";
      const url = `${base}/api/seller/my-payouts`;

      const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
      if (!token) {
        setError("Not authenticated. No token found in localStorage.");
        setPayouts([]);
        setLoading(false);
        return;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      console.debug("MyPayoutsTable: payouts response:", res?.status, res?.data);

      // Support multiple payload shapes
      let data: any[] = [];
      if (Array.isArray(res.data?.data)) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;
      else if (res.data?.data && Array.isArray(res.data.data.docs)) data = res.data.data.docs;
      else if (res.data?.data && Array.isArray(res.data.data.items)) data = res.data.data.items;
      else if (res.data?.payouts && Array.isArray(res.data.payouts)) data = res.data.payouts;
      else if (typeof res.data === "object" && Object.keys(res.data).length && Array.isArray(res.data.items)) data = res.data.items;
      else {
        data = res.data?.data || res.data || [];
        if (!Array.isArray(data)) data = [];
      }

      setPayouts(
        data.map((d: any) => ({
          _id: d._id || d.id || String(d._id || d.id || ""),
          amount: Number(d.amount || d.total || 0),
          fees: Number(d.fees || d.fee || 0),
          netAmount: Number(d.netAmount ?? d.net_amount ?? (d.amount || 0) - (d.fees || 0)),
          status: d.status || "pending",
          method: d.method || d.paymentMethod || d.channel || "",
          notes: d.notes || d.note || d.description || "",
          createdAt: d.createdAt || d.created_at || d.created || new Date().toISOString(),
          updatedAt: d.updatedAt || d.updated_at || d.updated || undefined,
        }))
      );
    } catch (err: any) {
      console.error("Error fetching payouts:", err?.response || err.message || err);
      if (err?.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(`Server error: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. Try again.");
      } else {
        setError(err.message || "Failed to fetch payouts");
      }
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [tokenKey]);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // --- date helpers ---
  const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
  };
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

  // Apply preset: sets dateFilter AND populates rangeFilter so both controls are in sync.
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
        const lwRef = new Date(today);
        lwRef.setDate(today.getDate() - 7);
        const lwStart = startOfWeek(lwRef);
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
    setRangeFilter({
      from: from ? formatISODate(from) : undefined,
      to: to ? formatISODate(to) : undefined,
    });
  };

  // unified date filtering: priority to explicit rangeFilter (from/to) — if none, use dateFilter preset
  const filteredByDate = React.useMemo(() => {
    if (!payouts || payouts.length === 0) return [];

    const hasFrom = !!rangeFilter.from;
    const hasTo = !!rangeFilter.to;

    // If user supplied a custom range (from or to) use it
    if (hasFrom || hasTo) {
      let fromBound: Date | null = null;
      let toBound: Date | null = null;
      if (hasFrom) {
        const parsed = new Date(rangeFilter.from as string);
        if (!Number.isNaN(parsed.getTime())) fromBound = startOfDay(parsed);
      }
      if (hasTo) {
        const parsed = new Date(rangeFilter.to as string);
        if (!Number.isNaN(parsed.getTime())) toBound = endOfDay(parsed);
      }

      return payouts.filter((p) => {
        const d = new Date(p.createdAt);
        if (isNaN(d.getTime())) return false;
        if (fromBound && toBound) return d >= fromBound && d <= toBound;
        if (fromBound) return d >= fromBound;
        if (toBound) return d <= toBound;
        return true;
      });
    }

    // Otherwise fallback to presets
    if (dateFilter === "all") return payouts;

    const now = new Date();
    let fromBound: Date | null = null;
    let toBound: Date | null = null;

    switch (dateFilter) {
      case "today":
        fromBound = startOfDay(now);
        toBound = endOfDay(now);
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        fromBound = startOfDay(y);
        toBound = endOfDay(y);
        break;
      }
      case "thisWeek":
        fromBound = startOfWeek(now);
        toBound = endOfWeek(now);
        break;
      case "lastWeek": {
        const lwRef = new Date(now);
        lwRef.setDate(now.getDate() - 7);
        const lwStart = startOfWeek(lwRef);
        fromBound = lwStart;
        toBound = endOfWeek(lwStart);
        break;
      }
      case "thisMonth":
        fromBound = startOfMonth(now);
        toBound = endOfMonth(now);
        break;
      case "lastMonth": {
        const lm = new Date(now);
        lm.setMonth(lm.getMonth() - 1);
        fromBound = startOfMonth(lm);
        toBound = endOfMonth(lm);
        break;
      }
    }

    if (!fromBound && !toBound) return payouts;
    return payouts.filter((p) => {
      const d = new Date(p.createdAt);
      if (isNaN(d.getTime())) return false;
      if (fromBound && toBound) return d >= fromBound && d <= toBound;
      if (fromBound) return d >= fromBound;
      if (toBound) return d <= toBound;
      return true;
    });
  }, [payouts, rangeFilter, dateFilter]);

  // Global + final filtering
  const finalData = React.useMemo(() => {
    const base = filteredByDate;
    if (!globalFilter.trim()) return base;
    const q = globalFilter.toLowerCase();
    return base.filter(
      (p) =>
        p.status?.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.amount.toString().includes(q) ||
        p.fees.toString().includes(q) ||
        p.netAmount.toString().includes(q) ||
        (p.method && p.method.toLowerCase().includes(q)) ||
        p._id.toLowerCase().includes(q)
    );
  }, [filteredByDate, globalFilter]);

  const columns: ColumnDef<Payout>[] = [
    {
      accessorKey: "_id",
      header: "Payout ID",
      cell: ({ row }) => {
        const id = row.original._id || "-";
        return (
          <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
            <span className="font-mono text-sm">{id.slice(0, 8)}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard?.writeText(id)}
              title="Copy payout ID"
              className="p-1"
            >
              <Copy size={14} />
            </Button>
          </div>
        );
      },
    },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => `₨ ${row.original.amount}` },
    { accessorKey: "fees", header: "Fees", cell: ({ row }) => `₨ ${row.original.fees}` },
    { accessorKey: "netAmount", header: "Net", cell: ({ row }) => `₨ ${row.original.netAmount}` },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium`}>{
          row.original.status?.charAt(0).toUpperCase() + (row.original.status?.slice(1) || "")
        }</span>
      ),
    },
    { accessorKey: "method", header: "Method", cell: ({ row }) => row.original.method || "-" },
    { accessorKey: "notes", header: "Notes", cell: ({ row }) => row.original.notes || "-" },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(row.original._id)}>
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                // show minimal details but avoid exposing seller info
                alert(
                  `Payout:
ID: ${row.original._id}
Amount: ${row.original.amount}
Status: ${row.original.status}
Method: ${row.original.method}
Notes: ${row.original.notes}`
                )
              }
            >
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: finalData,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <div className="w-full">
      {/* Status / Errors */}
      {error ? (
        <div className="mb-4 rounded-md border bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 py-4">
        <Input
          placeholder="Search payouts by id, amount, status, notes..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
          <label className="text-sm">From:</label>
          <Input
            type="date"
            value={rangeFilter.from || ""}
            onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value || undefined }))}
          />
          <label className="text-sm">To:</label>
          <Input
            type="date"
            value={rangeFilter.to || ""}
            onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value || undefined }))}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRangeFilter({});
              setDateFilter("all");
            }}
          >
            Clear
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {/* show a friendly label */}
              {dateFilter === "all" ? "Filter: All" :
               dateFilter === "today" ? "Filter: Today" :
               dateFilter === "yesterday" ? "Filter: Yesterday" :
               dateFilter === "thisWeek" ? "Filter: This Week" :
               dateFilter === "lastWeek" ? "Filter: Last Week" :
               dateFilter === "thisMonth" ? "Filter: This Month" :
               "Filter: Last Month"
              } <ChevronDown />
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        {loading ? (
          <div className="p-6 text-center">Loading payouts...</div>
        ) : (
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No payouts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
