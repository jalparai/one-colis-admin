"use client";

import * as React from "react";
import axios from "axios";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  RowData,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, ChevronDown, Download, Upload } from "lucide-react";
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
import toast from "react-hot-toast";

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
import { AddPayout } from "./AddPayout";
import { EditPayout } from "./EditPayout";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void;
  }
}

export type Payout = {
  _id: string;
  seller: {
    name: string;
    storeName: string;
    email: string;
  };
  amount: number;
  fees: number;
  netAmount: number;
  status: string;
  method: string;
  notes?: string;
  createdAt: string;
};

type PayoutManager = {
  _id: string;
  name: string;
  email: string;
};

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

// File validation utility
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid Excel file (.xlsx, .xls) or CSV file',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB',
    };
  }

  return { isValid: true };
};

export const columns: ColumnDef<Payout>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "seller.name",
    header: "Seller Name",
    cell: ({ row }) => <div>{row.original.seller?.name || "N/A"}</div>,
  },
  {
    accessorKey: "seller.email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.original.seller?.email}</div>,
  },
  {
    accessorKey: "seller.storeName",
    header: "Store",
    cell: ({ row }) => <div>{row.original.seller?.storeName}</div>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Amount <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.amount} DH</div>,
  },
  {
    accessorKey: "netAmount",
    header: "Fee",
    cell: ({ row }) => <div>{row.original.fees} DH</div>,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <div>{row.original.notes}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div
        className={`capitalize font-medium ${
          row.original.status === "pending"
            ? "text-yellow-600"
            : row.original.status === "completed"
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {row.original.status}
      </div>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => <div>{row.original.method}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>,
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
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const payout = row.original;
      const [deleteOpen, setDeleteOpen] = React.useState(false);
      const [assignOpen, setAssignOpen] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      const [payoutManagers, setPayoutManagers] = React.useState<PayoutManager[]>([]);
      const [selectedManager, setSelectedManager] = React.useState("");
      const [editOpen, setEditOpen] = React.useState(false);

      React.useEffect(() => {
        if (assignOpen) {
          (async () => {
            try {
              const token = localStorage.getItem("token");
              const res = await axios.get(
                "https://cod-ecommerce-two.vercel.app/api/payout-manager",
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setPayoutManagers(res.data.data || []);
            } catch (err) {
              console.error("❌ Failed to fetch payout managers:", err);
            }
          })();
        }
      }, [assignOpen]);

      const handleAssign = async () => {
        if (!selectedManager) return toast.error("Please select a payout manager");

        try {
          setLoading(true);
          const token = localStorage.getItem("token");

          await axios.post(
            `https://cod-ecommerce-two.vercel.app/api/admin/assign/payouts/${selectedManager}`,
            { payoutIds: [payout._id] },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success("✅ Payout assigned successfully!");
          table.options.meta?.refresh?.();
          setAssignOpen(false);
        } catch (err) {
          console.error("❌ Failed to assign payout:", err);
          toast.error("Failed to assign payout. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      const handleDelete = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          await axios.delete(
            `https://cod-ecommerce-two.vercel.app/api/admin/delete-payout/${payout._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          table.options.meta?.refresh?.();
        } catch (err) {
          console.error("❌ Delete failed:", err);
        } finally {
          setLoading(false);
          setDeleteOpen(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAssignOpen(true)}>
                Assign to Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditPayout
            payout={payout}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onUpdated={table.options.meta?.refresh || (() => {})}
          />

          <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Assign Payout</AlertDialogTitle>
                <AlertDialogDescription>
                  Select a payout manager to assign this payout.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full border p-2 rounded-md"
              >
                <option value="">Select Manager</option>
                {payoutManagers.map((pm) => (
                  <option key={pm._id} value={pm._id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAssign} disabled={loading}>
                  {loading ? "Assigning..." : "Assign"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete payout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
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

export function PayoutTable() {
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");

  // Bulk assign states
  const [assignBulkOpen, setAssignBulkOpen] = React.useState(false);
  const [payoutManagersBulk, setPayoutManagersBulk] = React.useState<PayoutManager[]>([]);
  const [selectedManagerBulk, setSelectedManagerBulk] = React.useState("");
  const [bulkLoading, setBulkLoading] = React.useState(false);

  // Import/Export states
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);

  const fetchPayouts = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/admin/get-all-payouts",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayouts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching payouts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  React.useEffect(() => {
    if (!assignBulkOpen) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/payout-manager", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayoutManagersBulk(res.data.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch payout managers (bulk):", err);
      }
    })();
  }, [assignBulkOpen]);

  const filteredPayouts = React.useMemo(() => {
    if (dateFilter === "all") return payouts;
    const now = new Date();

    return payouts.filter((p) => {
      const dt = new Date(p.createdAt);

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
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0,0,0,0);
          return dt >= start && dt <= now;
        }
        case "lastWeek": {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay() - 7);
          start.setHours(0,0,0,0);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23,59,59,999);
          return dt >= start && dt <= end;
        }
        case "thisMonth": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          start.setHours(0,0,0,0);
          return dt >= start && dt <= now;
        }
        case "lastMonth": {
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 0);
          end.setHours(23,59,59,999);
          return dt >= start && dt <= end;
        }
        default:
          return true;
      }
    });
  }, [payouts, dateFilter]);

  const table = useReactTable({
    data: filteredPayouts,
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
    meta: { refresh: fetchPayouts },
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  });

  if (loading) return <p className="p-4">Loading payouts...</p>;

  const selectedCount = Object.keys(rowSelection || {}).length;

  const handleBulkDelete = async () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original._id);
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} payout(s)? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedIds.map((id) =>
          axios.delete(
            `https://cod-ecommerce-two.vercel.app/api/admin/delete-payout/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      table.resetRowSelection();
      fetchPayouts();
      toast.success(`Deleted ${selectedIds.length} payout(s).`);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error("Bulk delete failed. Check console for details.");
    }
  };

  const handleAssignBulk = async () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original._id);
    if (!selectedIds.length) return toast.error("No payouts selected.");
    if (!selectedManagerBulk) return toast.error("Please select a payout manager.");

    try {
      setBulkLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `https://cod-ecommerce-two.vercel.app/api/admin/assign/payouts/${selectedManagerBulk}`,
        { payoutIds: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Assigned ${selectedIds.length} payout(s).`);
      setAssignBulkOpen(false);
      setSelectedManagerBulk("");
      table.resetRowSelection();
      fetchPayouts();
    } catch (err) {
      console.error("Bulk assign failed:", err);
      toast.error("Bulk assign failed. Check console for details.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Import handler
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      toast.loading('Importing payouts...', { id: 'import' });

      await axios.post(
        'https://cod-ecommerce-two.vercel.app/api/admin/payout/bulk-upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Successfully imported payouts!', { id: 'import' });
      fetchPayouts();
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to import payouts';
      
      toast.error(errorMessage, { id: 'import' });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Export handler
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      toast.loading('Exporting payouts...', { id: 'export' });

      const response = await axios.get(
        'https://cod-ecommerce-two.vercel.app/api/admin/payout/pdf',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payouts_export_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Successfully exported payouts!', { id: 'export' });
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to export payouts';
      
      toast.error(errorMessage, { id: 'export' });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Filter by seller email..."
          value={(table.getColumn("seller.email")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("seller.email")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />

        {/* Date range inputs */}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {dateFilter} <ChevronDown className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DATE_FILTERS.map((option) => (
                <DropdownMenuItem key={option} onClick={() => setDateFilter(option)}>
                  {option.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk actions */}
          {selectedCount > 0 && (
            <>
              <Button
                variant="destructive"
                className="mb-2"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedCount})
              </Button>

              <Button
                variant="default"
                className="mb-2"
                onClick={() => setAssignBulkOpen(true)}
              >
                Assign Selected ({selectedCount})
              </Button>
            </>
          )}

          {/* Import/Export buttons */}
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {importLoading ? "Importing..." : "Import"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exportLoading ? "Exporting..." : "Export"}
          </Button>

          <AddPayout onPayoutAdded={fetchPayouts} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
                  No payouts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Assign Dialog */}
      <AlertDialog open={assignBulkOpen} onOpenChange={setAssignBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Selected Payouts</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a payout manager to assign the selected payouts to.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <select
            value={selectedManagerBulk}
            onChange={(e) => setSelectedManagerBulk(e.target.value)}
            className="w-full border p-2 rounded-md my-4"
          >
            <option value="">Select Manager</option>
            {payoutManagersBulk.map((pm) => (
              <option key={pm._id} value={pm._id}>
                {pm.name} ({pm.email})
              </option>
            ))}
          </select>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssignBulk} disabled={bulkLoading}>
              {bulkLoading ? "Assigning..." : `Assign (${selectedCount})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            {"<<"} First
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            Last {">>"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PayoutTable;