"use client";

import * as React from "react";
import axios from "axios";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import toast from "react-hot-toast";

interface Seller {
  _id: string;
  name: string;
  email: string;
}

interface Stock {
  _id: string;
  seller: Seller;
  sku: string;
  category: string;
  name: string;
  images: string[];
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

interface Warehouse {
  id: string;
  name: string;
  email: string;
}

export function StocksTable() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [permissions, setPermissions] = React.useState<{ assignProducts?: boolean }>({});

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({});

  React.useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      setPermissions(JSON.parse(stored));
    }
  }, []);

  const fetchStocks = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-stock",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStocks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Error fetching stocks:", err);
      toast.error("Failed to fetch stocks");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Date and search filtering logic (unchanged)
  const filteredByDate = React.useMemo(() => {
    if (dateFilter === "all") return stocks;
    const now = new Date();
    return stocks.filter((s) => {
      const dt = new Date(s.createdAt);
      switch (dateFilter) {
        case "today": return dt.toDateString() === now.toDateString();
        case "yesterday": {
          const y = new Date(); y.setDate(now.getDate() - 1);
          return dt.toDateString() === y.toDateString();
        }
        case "thisWeek": {
          const start = new Date(now); start.setDate(now.getDate() - now.getDay());
          return dt >= start && dt <= now;
        }
        case "lastWeek": {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay() - 7);
          const end = new Date(start); end.setDate(start.getDate() + 6);
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
        default: return true;
      }
    });
  }, [stocks, dateFilter]);

  const timeFiltered = React.useMemo(() => {
    return filteredByDate.filter((s) => {
      const dt = new Date(s.createdAt);
      const from = rangeFilter.from ? new Date(rangeFilter.from) : null;
      const to = rangeFilter.to ? new Date(rangeFilter.to) : null;
      if (from && dt < from) return false;
      if (to && dt > to) return false;
      return true;
    });
  }, [filteredByDate, rangeFilter]);

  const finalData = React.useMemo(() => {
    if (!globalFilter.trim()) return timeFiltered;
    const q = globalFilter.toLowerCase();
    return timeFiltered.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.sku.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      String(s.price).includes(q) ||
      String(s.quantity).includes(q)
    );
  }, [timeFiltered, globalFilter]);

  // Columns (with conditional "Actions" column)
  const stockColumns: ColumnDef<Stock>[] = [
    {
      accessorKey: "seller",
      header: "Seller",
      cell: ({ row }) => {
        const seller = row.original.seller;
        return (
          <div>
            <div className="font-medium">{seller?.name || "Unknown"}</div>
            <div className="text-sm text-gray-500">{seller?.email}</div>
          </div>
        );
      },
    },
    { accessorKey: "name", header: "Product Name", cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div> },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "price", header: "Price" },
    { accessorKey: "quantity", header: "Quantity" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <div>{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</div>,
    },
    ...(permissions.assignProducts
      ? [
          {
            id: "actions",
            header: "Actions / Assign",
            cell: ({ row, table }) => {
              const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
              const [selectedWarehouse, setSelectedWarehouse] = React.useState("");
              const [assignOpen, setAssignOpen] = React.useState(false);
              const [loadingAssign, setLoadingAssign] = React.useState(false);

              React.useEffect(() => {
                if (assignOpen) {
                  (async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const resp = await axios.get(
                        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-warehouses",
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      const arr = Array.isArray(resp.data?.data) ? resp.data.data : [];
                      setWarehouses(
                        arr.map((w: any) => ({
                          id: w.id ?? w._id,
                          name: w.name ?? "",
                          email: w.email ?? "",
                        }))
                      );
                    } catch (err) {
                      console.error("⚠️ Failed to fetch warehouses:", err);
                    }
                  })();
                }
              }, [assignOpen]);

              const handleAssign = async () => {
                if (!selectedWarehouse) return;
                try {
                  setLoadingAssign(true);
                  const token = localStorage.getItem("token");
                  await axios.post(
                    `https://cod-ecommerce-two.vercel.app/api/employee/employee/assign/products/${selectedWarehouse}`,
                    { productIds: [row.original._id] },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  toast.success("Product assigned successfully!");
                  setAssignOpen(false);
                  table.options.meta?.refresh?.();
                } catch (err) {
                  console.error("⚠️ Failed to assign:", err);
                  toast.error("Failed to assign product.");
                } finally {
                  setLoadingAssign(false);
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
                      <DropdownMenuItem onClick={() => setAssignOpen(true)}>
                        Assign Product to Warehouse
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Assign Product</AlertDialogTitle>
                        <AlertDialogDescription>Select a warehouse to assign this product.</AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="my-4">
                        <select
                          value={selectedWarehouse}
                          onChange={(e) => setSelectedWarehouse(e.target.value)}
                          className="w-full rounded-md border px-3 py-2"
                        >
                          <option value="">-- Select Warehouse --</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAssign}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleAssign}
                          disabled={loadingAssign || !selectedWarehouse}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {loadingAssign ? "Assigning..." : "Assign"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              );
            },
          } as ColumnDef<Stock>,
        ]
      : []),
  ];

  const table = useReactTable({
    data: finalData,
    columns: stockColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { refresh: fetchStocks },
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
  });

  if (loading) return <p className="p-4">Loading stocks...</p>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
          <label>From:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))} />
          <label>To:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value }))} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["all", "today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth"].map((option) => (
              <DropdownMenuItem key={option} onClick={() => setDateFilter(option as any)}>
                {option.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell colSpan={stockColumns.length} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
