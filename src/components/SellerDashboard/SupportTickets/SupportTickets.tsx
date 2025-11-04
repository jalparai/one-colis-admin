"use client";

import * as React from "react";
import axios from "axios";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";
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
import { AddTicket } from "./AddTicket";

// ✅ Ticket type
export type Ticket = {
  _id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
};

// ✅ Columns
export const ticketColumns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Subject
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("subject")}</div>,
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => <div>{row.getValue("message")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 rounded text-xs ${
            status === "closed"
              ? "bg-red-100 text-red-600"
              : status === "open"
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <span
          className={`px-2 py-1 rounded text-xs ${
            priority === "high"
              ? "bg-red-200 text-red-700"
              : priority === "medium"
              ? "bg-yellow-200 text-yellow-700"
              : "bg-green-200 text-green-700"
          }`}
        >
          {priority}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const dateStr = row.getValue("createdAt") as string;
      return <div>{new Date(dateStr).toLocaleDateString()}</div>;
    },
  },
];

// ✅ Main Component
export function TicketsTable() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  // 👇 Add dateFilter like Orders table
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  const fetchTickets = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. Please login.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/seller/support-tickets",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTickets(res.data.data || []);
    } catch (err: any) {
      console.error("Error fetching tickets:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ✅ Date filter logic same as Orders/Stocks
  const filteredData = React.useMemo(() => {
    if (dateFilter === "all") return tickets;

    const today = new Date();
    return tickets.filter((ticket) => {
      const date = new Date(ticket.createdAt);

      switch (dateFilter) {
        case "today":
          return date.toDateString() === today.toDateString();
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return date.toDateString() === yesterday.toDateString();
        case "thisWeek":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return date >= weekStart;
        case "lastWeek":
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
          return date >= lastWeekStart && date < lastWeekEnd;
        case "thisMonth":
          return (
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          );
        case "lastMonth":
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          return (
            date.getMonth() === lastMonth.getMonth() &&
            date.getFullYear() === lastMonth.getFullYear()
          );
        default:
          return true;
      }
    });
  }, [dateFilter, tickets]);

  const table = useReactTable({
    data: filteredData,
    columns: ticketColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  if (loading) return <p className="p-4">Loading tickets...</p>;

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        {/* Search */}
        <Input
          placeholder="Search by subject..."
          value={(table.getColumn("subject")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("subject")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {/* Date filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {dateFilter === "all"
                ? "All Tickets"
                : dateFilter === "today"
                ? "Today"
                : dateFilter === "yesterday"
                ? "Yesterday"
                : dateFilter === "thisWeek"
                ? "This Week"
                : dateFilter === "lastWeek"
                ? "Last Week"
                : dateFilter === "thisMonth"
                ? "This Month"
                : "Last Month"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDateFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("today")}>Today</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>Yesterday</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("thisWeek")}>This Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("lastWeek")}>Last Week</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("thisMonth")}>This Month</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("lastMonth")}>Last Month</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add Ticket button */}
        <AddTicket onTicketAdded={fetchTickets} />
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
                <TableCell colSpan={ticketColumns.length} className="h-24 text-center">
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredRowModel().rows.length} items
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
