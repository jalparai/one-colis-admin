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

// Dialog imports (used for seller details modal)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Payout type — seller kept flexible to support different payload shapes
type Payout = {
  _id: string;
  seller?: any;
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
  const [updatingStatusId, setUpdatingStatusId] = React.useState<string | null>(null);

  // Seller details modal state
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsSellerId, setDetailsSellerId] = React.useState<string | null>(null);

  // fetched seller data
  const [sellerLoading, setSellerLoading] = React.useState(false);
  const [sellerError, setSellerError] = React.useState<string | null>(null);
  const [sellerData, setSellerData] = React.useState<any | null>(null);

  // Fetch payouts
  const fetchPayouts = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/payouts-managers/get-my-payouts",
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

  // Fetch seller details when modal opens or sellerId changes
  React.useEffect(() => {
    if (!detailsOpen) return;

    const id = detailsSellerId;
    if (!id) {
      setSellerError("Seller ID missing");
      setSellerData(null);
      return;
    }

    let cancelled = false;
    const fetchSeller = async () => {
      setSellerLoading(true);
      setSellerError(null);
      setSellerData(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get(
          `https://cod-ecommerce-two.vercel.app/api/payouts-managers/get-seller-by-id/${id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined, validateStatus: () => true }
        );

        if (cancelled) return;

        if (res?.data?.ok) {
          setSellerData(res.data.data ?? null);
        } else {
          setSellerData(res.data?.data ?? null);
          setSellerError(res?.data?.message ?? "Failed to load seller details");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch seller details", err);
          setSellerError("Network error while loading seller");
        }
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    };

    fetchSeller();
    return () => {
      cancelled = true;
    };
  }, [detailsOpen, detailsSellerId]);

  // Date filtering
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

  // Global filter
  const finalData = React.useMemo(() => {
    if (!globalFilter.trim()) return rangeFiltered;
    const q = globalFilter.toLowerCase();
    return rangeFiltered.filter(
      (p) =>
        (p.status ?? "").toLowerCase().includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q) ||
        p.amount.toString().includes(q) ||
        (p.seller?.name ?? "").toLowerCase().includes(q) ||
        (p.seller?.email ?? "").toLowerCase().includes(q)
    );
  }, [rangeFiltered, globalFilter]);

  // Known status options (include ones already present so users can re-use them)
  const statusOptions = React.useMemo(() => {
    const defaults = ["pending", "paid", "failed"];
    const fromData = payouts.map((p) => p.status).filter(Boolean) as string[];
    return Array.from(new Set([...defaults, ...fromData]));
  }, [payouts]);

  const handleStatusUpdate = React.useCallback(
    async (payoutId: string, status: string) => {
      if (!status?.trim()) return;

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        if (typeof window !== "undefined") window.alert("Missing auth token. Please sign in again.");
        return;
      }

      setUpdatingStatusId(payoutId);
      try {
        const res = await axios.patch(
          `https://cod-ecommerce-two.vercel.app/api/payouts-managers/update-payout-status/${payoutId}/status`,
          { status },
          { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
        );

        if (!res?.data?.ok) {
          const message = res?.data?.message ?? "Failed to update payout status";
          throw new Error(message);
        }

        setPayouts((prev) =>
          prev.map((p) => (p._id === payoutId ? { ...p, status, updatedAt: new Date().toISOString() } : p))
        );
      } catch (err) {
        console.error("Failed to update payout status", err);
        if (typeof window !== "undefined") {
          const message = err instanceof Error ? err.message : "Unable to update payout status.";
          window.alert(message);
        }
      } finally {
        setUpdatingStatusId(null);
      }
    },
    []
  );

  // Table columns (includes View Seller action)
  const columns: ColumnDef<Payout>[] = React.useMemo(
    () => [
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
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const sellerObj = row.original.seller;
          // try common id locations
          const sid = sellerObj?._id ?? sellerObj?.id ?? (typeof sellerObj === "string" ? sellerObj : null);
          const disabled = !sid;
          const payoutId = row.original._id;
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                title={disabled ? "Seller id missing — cannot view details" : "View seller details"}
                onClick={() => {
                  if (!disabled) {
                    setDetailsSellerId(String(sid));
                    setDetailsOpen(true);
                  }
                }}
              >
                View Seller
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" disabled={updatingStatusId === payoutId}>
                    {updatingStatusId === payoutId ? "Updating..." : "Update Status"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {statusOptions.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      disabled={updatingStatusId === payoutId || status === row.original.status}
                      onClick={() => handleStatusUpdate(payoutId, status)}
                    >
                      {status === row.original.status ? `${status} (current)` : status}
                    </DropdownMenuItem>
                  ))}
                  {/* <DropdownMenuItem
                    disabled={updatingStatusId === payoutId}
                    onClick={() => {
                      const custom =
                        typeof window !== "undefined"
                          ? window.prompt("Enter a custom status", row.original.status ?? "")
                          : null;
                      if (custom && custom.trim()) {
                        handleStatusUpdate(payoutId, custom.trim());
                      }
                    }}
                  >
                    Custom...
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleStatusUpdate, statusOptions, updatingStatusId]
  );

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
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 py-4">
        <Input
          placeholder="Search payouts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
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

        <div>
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

      {/* Pagination */}
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

      {/* Seller Details Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            // clear stale state
            setDetailsSellerId(null);
            setSellerData(null);
            setSellerError(null);
            setSellerLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seller details</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4 py-3">
            {sellerLoading ? (
              <div className="p-4">Loading seller...</div>
            ) : sellerError ? (
              <div className="p-4 text-sm text-red-600">{sellerError}</div>
            ) : !sellerData ? (
              <div className="p-4 text-sm text-muted-foreground">No seller data.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{sellerData.name}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Store Name</div>
                  <div className="font-medium">{sellerData.storeName ?? "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium lowercase">{sellerData.email}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="font-medium">{sellerData.phoneNumber ?? "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <div className="font-medium">{sellerData.role ?? "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">City</div>
                  <div className="font-medium">{sellerData.city ?? "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Registered</div>
                  <div className="font-medium">
                    {sellerData.createdAt ? new Date(sellerData.createdAt).toLocaleString() : "—"}
                  </div>
                </div>

                {sellerData.bankDetails && (
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">Bank Details</div>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      <div><strong>Account name:</strong> {sellerData.bankDetails.accountName ?? "—"}</div>
                      <div><strong>Account number:</strong> {sellerData.bankDetails.accountNumber ?? "—"}</div>
                      <div><strong>Bank:</strong> {sellerData.bankDetails.bankName ?? "—"}</div>
                      <div><strong>Bank code:</strong> {sellerData.bankDetails.bankCode ?? "—"}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t px-4 py-3 bg-white/60">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
