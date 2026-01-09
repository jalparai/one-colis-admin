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
import { ArrowUpDown, MoreHorizontal, ChevronDown } from "lucide-react";
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
import toast from "react-hot-toast";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void;
  }
}

export type Payout = {
  _id: string;
  seller: { name: string; storeName: string; email: string };
  amount: number;
  fees: number;
  netAmount: number;
  status: string;
  method: string;
  notes?: string;
  createdAt: string;
};

type PayoutManager = { _id: string; name: string; email: string };

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

export function PayoutTable() {
  const [permissions, setPermissions] = React.useState<{ assignPayouts?: boolean }>({});
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");

  // ✅ Load permissions from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try {
        setPermissions(JSON.parse(stored));
      } catch {
        console.warn("Failed to parse permissions");
      }
    }
  }, []);

  const fetchPayouts = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-payouts",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayouts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching payouts:", err);
      toast.error("Failed to fetch payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // ✅ Filtering logic unchanged
  const filteredPayouts = React.useMemo(() => {
    if (dateFilter === "all") return payouts;
    const now = new Date();
    return payouts.filter((p) => {
      const dt = new Date(p.createdAt);
      switch (dateFilter) {
        case "today": return dt.toDateString() === now.toDateString();
        case "yesterday": {
          const y = new Date(); y.setDate(now.getDate() - 1);
          return dt.toDateString() === y.toDateString();
        }
        case "thisWeek": {
          const start = new Date(now); start.setDate(now.getDate() - now.getDay());
          start.setHours(0,0,0,0);
          return dt >= start && dt <= now;
        }
        case "lastWeek": {
          const start = new Date(now); start.setDate(now.getDate() - now.getDay() - 7);
          start.setHours(0,0,0,0);
          const end = new Date(start); end.setDate(start.getDate() + 6);
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
        default: return true;
      }
    });
  }, [payouts, dateFilter]);

  // ✅ Columns definition with conditional Actions column
  const columns = React.useMemo<ColumnDef<Payout>[]>(() => {
    const baseCols: ColumnDef<Payout>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      { accessorKey: "seller.name", header: "Seller Name" },
      {
        id: "sellerEmail",
        accessorKey: "seller.email",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="lowercase">{row.original.seller?.email}</div>,
      },
      { accessorKey: "seller.storeName", header: "Store" },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Amount <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.original.amount} DH</div>,
      },
      { accessorKey: "fees", header: "Fee", cell: ({ row }) => <div>{row.original.fees} DH</div> },
      { accessorKey: "notes", header: "Notes", cell: ({ row }) => <div>{row.original.notes || "-"}</div> },
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
      { accessorKey: "method", header: "Method" },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>,
      },
    ];

    // ✅ Add "Actions" only if permission assignPayouts = true
    if (permissions.assignPayouts) {
      baseCols.push({
        id: "actions",
        enableHiding: false,
        cell: ({ row, table }) => {
          const payout = row.original;
          const [assignOpen, setAssignOpen] = React.useState(false);
          const [loading, setLoading] = React.useState(false);
          const [payoutManagers, setPayoutManagers] = React.useState<PayoutManager[]>([]);
          const [selectedManager, setSelectedManager] = React.useState("");

          React.useEffect(() => {
            if (assignOpen) {
              (async () => {
                try {
                  const token = localStorage.getItem("token");
                  const res = await axios.get(
                    "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-payout-managers",
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  setPayoutManagers(res.data.data || []);
                } catch {
                  toast.error("Failed to fetch payout managers");
                }
              })();
            }
          }, [assignOpen]);

          const handleAssign = async () => {
            if (!selectedManager) {
              toast.error("Please select a payout manager before assigning.");
              return;
            }
            try {
              setLoading(true);
              const token = localStorage.getItem("token");
              await axios.post(
                `https://cod-ecommerce-two.vercel.app/api/employee/employee/assign/payouts/${selectedManager}`,
                { payoutIds: [payout._id] },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              toast.success("Payout successfully assigned!");
              table.options.meta?.refresh?.();
              setAssignOpen(false);
            } catch (err: any) {
              toast.error(err?.response?.data?.message || "Assignment failed.");
            } finally {
              setLoading(false);
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
                </DropdownMenuContent>
              </DropdownMenu>

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
            </>
          );
        },
      });
    }

    return baseCols;
  }, [permissions]);

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

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Filter by seller email..."
          value={(table.getColumn("sellerEmail")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("sellerEmail")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
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
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
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
    </div>
  );
}
