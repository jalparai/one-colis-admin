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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddStockDialog } from "./AddStockDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// Permissions type
type EmployeePermissions = {
 addStock: boolean;
  manageOrders: boolean;
  scanOrders: boolean;
  assignProducts: boolean;
  assignOrders: boolean;
  assignPayouts: boolean;
};

// Extend TableMeta to allow passing permissions + refresh
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void;
    permissions?: EmployeePermissions;
  }
}

// Date Filters
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

// SellerTable Component
export function SellerTable() {
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stockDialogOpenForSellerId, setStockDialogOpenForSellerId] = React.useState<string | null>(null);

  // Permissions, sellers, etc...
  const [permissions, setPermissions] = React.useState<EmployeePermissions>({
    addStock: false,
  manageOrders: false,
  scanOrders: false,
  assignProducts: false,
  assignOrders: false,
  assignPayouts: false,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");

  // Fetch sellers
  const fetchSellers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-sellers",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSellers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load employee permissions
React.useEffect(() => {
  const storedPerms = localStorage.getItem("permissions");
  if (storedPerms) {
    setPermissions(JSON.parse(storedPerms));
  }
}, []);


  React.useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  // Filter sellers by date
  const filteredSellers = React.useMemo(() => {
    if (dateFilter === "all") return sellers;
    const now = new Date();

    return sellers.filter((seller) => {
      const dt = new Date(seller.createdAt);
      switch (dateFilter) {
        case "today":
          return dt.toDateString() === now.toDateString();
        case "yesterday":
          const y = new Date();
          y.setDate(now.getDate() - 1);
          return dt.toDateString() === y.toDateString();
        case "thisWeek":
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay());
          return dt >= start && dt <= now;
        case "lastWeek":
          const startLW = new Date(now);
          startLW.setDate(now.getDate() - now.getDay() - 7);
          const endLW = new Date(startLW);
          endLW.setDate(startLW.getDate() + 6);
          return dt >= startLW && dt <= endLW;
        case "thisMonth":
          const startM = new Date(now.getFullYear(), now.getMonth(), 1);
          return dt >= startM && dt <= now;
        case "lastMonth":
          const startLM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endLM = new Date(now.getFullYear(), now.getMonth(), 0);
          return dt >= startLM && dt <= endLM;
        default:
          return true;
      }
    });
  }, [sellers, dateFilter]);

  // Columns inside component to access state setters
  const columns: ColumnDef<Seller>[] = [
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
      header: "Email",
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
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row, table }) => {
        const seller = row.original;
        const permissions = table.options.meta?.permissions;
        if (!permissions?.addStock) return null;

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
                {permissions.addStock && (
                  <DropdownMenuItem
                    onClick={() => setStockDialogOpenForSellerId(seller._id)}
                  >
                    Add Stock
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <AddStockDialog
              sellerId={seller._id}
              open={stockDialogOpenForSellerId === seller._id}
              onOpenChange={(open) => {
                if (!open) setStockDialogOpenForSellerId(null);
              }}
              onStockAdded={() => table.options.meta?.refresh?.()}
            />
          </>
        );
      },
    },
  ];

  // Memoize meta with permissions and refresh
  const meta = React.useMemo(() => ({ refresh: fetchSellers, permissions }), [fetchSellers, permissions]);

  // Create the table instance
  const table = useReactTable({
    data: filteredSellers,
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
    meta,
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  });

  if (loading) return <p className="p-4">Loading sellers...</p>;

  // Render
  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />

        {/* Date Filters */}
        <div className="flex gap-2 items-center">
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
  );
}
