"use client";

import * as React from "react";
import axios from "axios";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddSeller } from "./Add-seller";
import { AddStockDialog } from "./AddStockDialog";
import { ImportExportButtons } from "@/components/ui/import-export-buttons";
import { ENTITY_CONFIGS } from "@/lib/import-export-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Seller type
export type Seller = {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  storeName: string;
  estimatedMonthlyOrders: string;
  isCurrentlySellingOnline: boolean;
  createdAt: string;
  city?: string;
};

// Extend TableMeta to include refresh function
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void;
  }
}

/* ---------------- SellerDetailsModal ---------------- */
function SellerDetailsModal({ sellerId, open, onOpenChange }: { sellerId?: string | null; open: boolean; onOpenChange: (v: boolean) => void; }) {
  const [loading, setLoading] = React.useState(false);
  const [seller, setSeller] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!open || !sellerId) {
      setSeller(null);
      return;
    }

    let cancelled = false;
    const fetchSeller = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get(`https://cod-ecommerce-two.vercel.app/api/admin/get-seller-by-id/${sellerId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          validateStatus: () => true,
        });
        if (cancelled) return;
        if (res.data?.ok) setSeller(res.data.data ?? null);
        else setSeller(res.data?.data ?? null);
      } catch (err) {
        console.error("Failed to load seller details", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSeller();
    return () => { cancelled = true; };
  }, [open, sellerId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seller details</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="p-4">Loading seller...</div>
          ) : !seller ? (
            <div className="p-4 text-sm text-muted-foreground">No seller data.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium">{seller.name}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium lowercase">{seller.email}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="font-medium">{seller.phoneNumber}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Store</div>
                <div className="font-medium">{seller.storeName}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">City</div>
                <div className="font-medium">{seller.city ?? "—"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Registered</div>
                <div className="font-medium">{seller.createdAt ? new Date(seller.createdAt).toLocaleString() : "—"}</div>
              </div>

              {seller.bankDetails && (
                <div className="pt-2">
                  <div className="text-sm font-medium">Bank Details</div>
                  <div className="grid grid-cols-1 gap-1 text-sm mt-2">
                    <div>Account name: {seller.bankDetails.accountName ?? "—"}</div>
                    <div>Account number: {seller.bankDetails.accountNumber ?? "—"}</div>
                    <div>Bank: {seller.bankDetails.bankName ?? "—"}</div>
                    <div>Bank code: {seller.bankDetails.bankCode ?? "—"}</div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <DialogFooter className="border-t px-4 py-3 bg-white/60">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Columns (actions with View Details)
export const columns: ColumnDef<Seller>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
    cell: ({ row }) => <div>{row.getValue("phoneNumber")}</div>,
  },
  {
    accessorKey: "storeName",
    header: "Store Name",
    cell: ({ row }) => <div>{row.getValue("storeName")}</div>,
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => <div>{row.getValue("city") || "N/A"}</div>,
  },
  {
    accessorKey: "estimatedMonthlyOrders",
    header: "Est. Monthly Orders",
    cell: ({ row }) => <div>{row.getValue("estimatedMonthlyOrders")}</div>,
  },
  {
    accessorKey: "isCurrentlySellingOnline",
    header: "Selling Online?",
    cell: ({ row }) =>
      row.getValue("isCurrentlySellingOnline") ? (
        <span className="text-green-600 font-medium">Yes</span>
      ) : (
        <span className="text-red-600 font-medium">No</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Registered Date",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      return <div>{new Date(dateStr).toLocaleDateString()}</div>;
    },
    filterFn: (row, columnId, filterValue: { from?: string; to?: string }) => {
      const date = new Date(row.getValue(columnId) as string);
      const from = filterValue?.from ? new Date(filterValue.from) : null;
      const to = filterValue?.to ? new Date(filterValue.to) : null;

      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    },
  },
  {
    header: "Action/Add Stocks",
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const seller = row.original;
      const [deleteOpen, setDeleteOpen] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      const [stockDialogOpen, setStockDialogOpen] = React.useState(false);

      // local states to control seller details modal
      const [detailsOpen, setDetailsOpen] = React.useState(false);
      const [detailsSellerId, setDetailsSellerId] = React.useState<string | null>(null);

      const handleDelete = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const res = await axios.delete(
            `https://cod-ecommerce-two.vercel.app/api/admin/delete-seller/${seller._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: () => true,
            }
          );
          if (res.status >= 200 && res.status < 300) {
            table.options.meta?.refresh?.();
            setDeleteOpen(false);
          } else {
            console.error("Delete failed", res.status, res.data);
          }
        } catch (err) {
          console.error("Failed to delete seller", err);
        } finally {
          setLoading(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => { setDetailsSellerId(seller._id); setDetailsOpen(true); }}>
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setStockDialogOpen(true)}>
                Add Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Seller details modal */}
          <SellerDetailsModal sellerId={detailsSellerId} open={detailsOpen} onOpenChange={setDetailsOpen} />

          {/* Add Stock Dialog */}
          <AddStockDialog
            sellerId={seller._id}
            open={stockDialogOpen}
            onOpenChange={setStockDialogOpen}
            onStockAdded={() => table.options.meta?.refresh?.()}
          />

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {seller.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  },
];

const DATE_FILTERS = [
  "all",
  "today",
  "yesterday",
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
] as const;

type DateFilter = (typeof DATE_FILTERS)[number];

// inside SellerTable
export function SellerTable() {
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");

  const fetchSellers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/admin/sellers",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSellers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  // ✅ keep filteredSellers here
 const filteredSellers = React.useMemo(() => {
  if (dateFilter === "all") return sellers;
  const now = new Date();

  return sellers.filter((seller) => {
    const dt = new Date(seller.createdAt);

    switch (dateFilter) {
      case "today": {
        return dt.toDateString() === now.toDateString();
      }
      case "yesterday": {
        const y = new Date();
        y.setDate(now.getDate() - 1);
        return dt.toDateString() === y.toDateString();
      }
      case "thisWeek": {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Sunday start
        return dt >= start && dt <= now;
      }
      case "lastWeek": {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return dt >= start && dt <= end;
      }
      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return dt >= start && dt <= now;
      }
      case "lastMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return dt >= start && dt <= end;
      }
      default:
        return true;
    }
  });
}, [sellers, dateFilter]);

  const table = useReactTable({
    data: filteredSellers, // ✅ works here
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { refresh: fetchSellers },
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  });

  if (loading) return <p className="p-4">Loading sellers...</p>;
  const exportEndpoints = [
    { label: "Export Sellers", url: "https://cod-ecommerce-two.vercel.app/api/adminb/bulk/sellers/export/excal" },
  ];
  
 const handleExport = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to export data");

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "export.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(error);
    alert("Error exporting file!");
  }
};

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("email")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />

        {/* Date Filters */}
        <div className="flex gap-2 items-center">
          <label>From:</label>
          <Input
            type="date"
            onChange={(e) =>
              table.getColumn("createdAt")?.setFilterValue({
                ...(table.getColumn("createdAt")?.getFilterValue() as any),
                from: e.target.value,
              })
            }
          />
          <label>To:</label>
          <Input
            type="date"
            onChange={(e) =>
              table.getColumn("createdAt")?.setFilterValue({
                ...(table.getColumn("createdAt")?.getFilterValue() as any),
                to: e.target.value,
              })
            }
          />
        </div>

        <div className="flex gap-2">
          <ImportExportButtons
            entityType="sellers"
            config={ENTITY_CONFIGS.sellers}
            onImportSuccess={fetchSellers}
            onExportSuccess={() => {}}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {dateFilter} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DATE_FILTERS.map((option) => (
                <DropdownMenuItem key={option} onClick={() => setDateFilter(option)}>
                  {option
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <AddSeller onSellerAdded={fetchSellers} />
        </div>
      </div>
      {exportEndpoints.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          className="mb-3"
          onClick={() => handleExport(item.url)}
        >
          {item.label} Excal
        </Button>
      ))}

      {/* Bulk Delete Button */}
      {Object.keys(rowSelection).length > 0 && (
        <Button
          variant="destructive"
          className="mb-2"
          onClick={async () => {
            const selectedIds = table.getSelectedRowModel().rows.map(
              (row) => row.original._id
            );
            if (!selectedIds.length) return;

            try {
              const token = localStorage.getItem("token");
              await Promise.all(
                selectedIds.map((id) =>
                  axios.delete(
                    `https://cod-ecommerce-two.vercel.app/api/admin/delete-seller/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  )
                )
              );
              table.resetRowSelection();
              fetchSellers();
            } catch (err) {
              console.error("Failed to bulk delete", err);
            }
          }}
        >
          Delete Selected ({Object.keys(rowSelection).length})
        </Button>
      )}

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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No sellers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"} First
          </Button>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Last {">>"}
          </Button>
        </div>
      </div>
    </div>
  );
}
