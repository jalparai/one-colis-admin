"use client";

import * as React from "react";
import axios from "axios";
import {
  type ColumnDef,
  type RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";

// ✅ Types
export type Order = {
  id: string;
  seller: string;
  sellerEmail: string;
  items: { productName: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
};

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void;
  }
}

// ✅ Columns (actions removed)
const getOrderColumns = (): ColumnDef<Order>[] => {
  return [
    { accessorKey: "seller", header: "Seller" },
    {
      accessorKey: "sellerEmail",
      header: "Email",
      cell: ({ row }) => <div className="lowercase">{row.getValue("sellerEmail")}</div>,
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => (
        <ul className="list-none pl-0">
          {row.original.items.map((item, idx) => (
            <li key={idx}>{item.productName}</li>
          ))}
        </ul>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <div>${row.getValue("totalAmount")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "";
        const color =
          status.toLowerCase() === "pending"
            ? "bg-yellow-50 text-yellow-700"
            : status.toLowerCase() === "confirmed"
            ? "bg-indigo-50 text-indigo-700"
            : status.toLowerCase() === "delivered"
            ? "bg-green-50 text-green-700"
            : "bg-gray-50 text-gray-700";
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${color}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <div>{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</div>,
    },
  ];
};

// ✅ Main Component
export function EmployeeOrdersTable() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // fetch orders and filter out pickup_requested
  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-orders",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allOrders: Order[] = res.data?.data || [];

      // filter out any orders with status "pickup_requested" (case-insensitive)
      const visible = allOrders.filter(
        (o) => (o.status ?? "").toLowerCase() !== "pickup_requested"
      );

      setOrders(visible);
      setFilteredOrders(visible);
    } catch (err) {
      console.error("Fetch orders failed", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // local filtering (search + date), operates on already filtered `orders`
  React.useEffect(() => {
    let filtered = [...orders];

    if (search.trim()) {
      filtered = filtered.filter((o) => (o.sellerEmail || "").toLowerCase().includes(search.toLowerCase()));
    }

    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    filtered = filtered.filter((order) => {
      const created = new Date(order.createdAt);
      switch (dateFilter) {
        case "today":
          return created >= startOfToday && created < endOfToday;
        case "yesterday": {
          const startOfYesterday = new Date(startOfToday.getTime() - oneDay);
          return created >= startOfYesterday && created < startOfToday;
        }
        case "thisWeek": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return created >= startOfWeek && created <= today;
        }
        case "lastWeek": {
          const startLastWeek = new Date(today);
          startLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endLastWeek = new Date(startLastWeek);
          endLastWeek.setDate(startLastWeek.getDate() + 6);
          return created >= startLastWeek && created <= endLastWeek;
        }
        case "thisMonth":
          return created.getMonth() === today.getMonth() && created.getFullYear() === today.getFullYear();
        case "lastMonth": {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          return created.getMonth() === lastMonth.getMonth() && created.getFullYear() === lastMonth.getFullYear();
        }
        default:
          return true;
      }
    });

    setFilteredOrders(filtered);
  }, [search, dateFilter, orders]);

  const table = useReactTable({
    data: filteredOrders,
    columns: getOrderColumns(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
    meta: { refresh: fetchOrders },
  });

  if (loading) return <p className="p-4">Loading orders...</p>;

  return (
    <div className="w-full space-y-4">
      {/* Filters Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-1 w-64"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
              <ChevronDown className="ml-2 h-4 w-4" />
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

      {/* Orders Table */}
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="text-center py-4">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center py-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>

        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}
