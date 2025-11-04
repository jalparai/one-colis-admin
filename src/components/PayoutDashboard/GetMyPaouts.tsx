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
import { ChevronDown } from "lucide-react";

// ✅ Correct Payout type including seller info
type Payout = {
  _id: string;
  seller: {
    name: string;
    email: string;
  };
  amount: number;
  fees: number;
  netAmount: number;
  status: string;
  method: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function MyPayoutsTable() {
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({});

  // ✅ Fetch payouts
  const fetchPayouts = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/payouts-managers/get-my-payouts",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Correct data extraction
      setPayouts(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching payouts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // ✅ Date filtering
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

  // ✅ Range filter
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

  // ✅ Global filter (search)
  const finalData = React.useMemo(() => {
    if (!globalFilter.trim()) return rangeFiltered;
    const q = globalFilter.toLowerCase();
    return rangeFiltered.filter(
      (p) =>
        p.status.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.amount.toString().includes(q) ||
        p.seller.name.toLowerCase().includes(q) ||
        p.seller.email.toLowerCase().includes(q)
    );
  }, [rangeFiltered, globalFilter]);

  // ✅ Table columns
  const columns: ColumnDef<Payout>[] = [
    {
      accessorKey: "seller.name",
      header: "Seller Name",
      cell: ({ row }) => row.original.seller?.name || "-",
    },
    {
      accessorKey: "seller.email",
      header: "Seller Email",
      cell: ({ row }) => row.original.seller?.email || "-",
    },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "fees", header: "Fees" },
    { accessorKey: "netAmount", header: "Net Amount" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "method", header: "Method" },
    { accessorKey: "notes", header: "Notes" },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
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
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  });

  if (loading) return <p className="p-4">Loading payouts...</p>;

  return (
    <div className="w-full">
      {/* 🔹 Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 py-4">
        <Input
          placeholder="Search payouts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-center gap-2">
          <label>From:</label>
          <Input
            type="date"
            onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))}
          />
          <label>To:</label>
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

      {/* 🔹 Table */}
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
            {table.getRowModel().rows.length > 0 ? (
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No payouts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 🔹 Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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
