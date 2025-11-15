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
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({});

  // tokenKey - adjust if your app stores token under a different key
  const tokenKey = "token";

  const fetchPayouts = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const base = "https://cod-ecommerce-two.vercel.app"
      const url = `${base}/api/seller/my-payouts`;

      const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
      if (!token) {
        setError("Not authenticated. No token found in localStorage.");
        setPayouts([]);
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
        // final fallback: try to dig common locations
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

  // Date filters
  const filteredByDate = React.useMemo(() => {
    const now = new Date();
    return payouts.filter((p) => {
      const createdAt = new Date(p.createdAt);
      switch (dateFilter) {
        case "today":
          return createdAt.toDateString() === now.toDateString();
        case "yesterday": {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return createdAt.toDateString() === y.toDateString();
        }
        case "thisWeek": {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return createdAt >= weekStart && createdAt <= weekEnd;
        }
        case "lastWeek": {
          const lastWeekStart = new Date(now);
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          return createdAt >= lastWeekStart && createdAt <= lastWeekEnd;
        }
        case "thisMonth": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }
        case "lastMonth": {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
        }
        default:
          return true;
      }
    });
  }, [payouts, dateFilter]);

  // Range filter
  const rangeFiltered = React.useMemo(() => {
    return filteredByDate.filter((p) => {
      const createdAt = new Date(p.createdAt);
      const from = rangeFilter.from ? new Date(rangeFilter.from) : null;
      const to = rangeFilter.to ? new Date(rangeFilter.to) : null;
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
      return true;
    });
  }, [filteredByDate, rangeFilter]);

  // Global filter (search) — no seller fields
  const finalData = React.useMemo(() => {
    if (!globalFilter.trim()) return rangeFiltered;
    const q = globalFilter.toLowerCase();
    return rangeFiltered.filter(
      (p) =>
        p.status?.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.amount.toString().includes(q) ||
        p.fees.toString().includes(q) ||
        p.netAmount.toString().includes(q) ||
        (p.method && p.method.toLowerCase().includes(q)) ||
        p._id.toLowerCase().includes(q)
    );
  }, [rangeFiltered, globalFilter]);

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
            onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))}
          />
          <label className="text-sm">To:</label>
          <Input
            type="date"
            onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["all", "today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth"].map(
              (option) => (
                <DropdownMenuItem key={option} onClick={() => setDateFilter(option as any)}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </DropdownMenuItem>
              )
            )}
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
