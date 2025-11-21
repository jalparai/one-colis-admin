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
      return <div>{dateStr ? new Date(dateStr).toLocaleDateString() : "-"}</div>;
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

  // presets
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // From / To range (ISO yyyy-mm-dd strings)
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

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

  // helpers
  const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
  };
  const formatISODate = (d: Date) => d.toISOString().slice(0, 10);

  // compute start/end of week/month
  const startOfWeek = (d: Date) => {
    const c = new Date(d);
    c.setDate(c.getDate() - c.getDay());
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfWeek = (d: Date) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return endOfDay(e);
  };
  const startOfMonth = (d: Date) => {
    const c = new Date(d.getFullYear(), d.getMonth(), 1);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfMonth = (d: Date) => {
    const c = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return endOfDay(c);
  };

  // Apply preset: sets dateFilter AND updates fromDate/toDate so both controls stay in sync.
  const applyPreset = (preset: typeof dateFilter) => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case "all":
        from = null;
        to = null;
        break;
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday": {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        from = startOfDay(y);
        to = endOfDay(y);
        break;
      }
      case "thisWeek":
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      case "lastWeek": {
        const lwStart = startOfWeek(new Date(today.setDate(today.getDate() - 7)));
        from = lwStart;
        to = endOfWeek(lwStart);
        break;
      }
      case "thisMonth":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "lastMonth": {
        const lm = new Date();
        lm.setMonth(lm.getMonth() - 1);
        from = startOfMonth(lm);
        to = endOfMonth(lm);
        break;
      }
    }

    // update state
    setDateFilter(preset);
    setFromDate(from ? formatISODate(from) : "");
    setToDate(to ? formatISODate(to) : "");
  };

  // filteredData => range takes effect because applyPreset fills from/to;
  // manual edits of from/to will naturally filter (they remain authoritative).
  const filteredData = React.useMemo(() => {
    if (!tickets || tickets.length === 0) return [];

    const hasFrom = !!fromDate;
    const hasTo = !!toDate;

    // if user provided range values, use them (inclusive)
    if (hasFrom || hasTo) {
      let from: Date | null = null;
      let to: Date | null = null;
      if (hasFrom) {
        const p = new Date(fromDate);
        if (!isNaN(p.getTime())) from = startOfDay(p);
      }
      if (hasTo) {
        const p = new Date(toDate);
        if (!isNaN(p.getTime())) to = endOfDay(p);
      }

      return tickets.filter((ticket) => {
        if (!ticket?.createdAt) return false;
        const d = new Date(ticket.createdAt);
        if (isNaN(d.getTime())) return false;

        if (from && to) return d >= from && d <= to;
        if (from) return d >= from;
        if (to) return d <= to;
        return true;
      });
    }

    // otherwise fallback to preset (shouldn't happen if applyPreset set ranges,
    // but preserves original behavior if user cleared ranges)
    if (dateFilter === "all") return tickets;

    const today = new Date();
    return tickets.filter((ticket) => {
      if (!ticket?.createdAt) return false;
      const date = new Date(ticket.createdAt);
      if (isNaN(date.getTime())) return false;

      switch (dateFilter) {
        case "today":
          return date.toDateString() === today.toDateString();
        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return date.toDateString() === yesterday.toDateString();
        }
        case "thisWeek": {
          const ws = startOfWeek(today);
          const we = endOfWeek(today);
          return date >= ws && date <= we;
        }
        case "lastWeek": {
          const lwStart = startOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
          const lwEnd = endOfWeek(lwStart);
          return date >= lwStart && date <= lwEnd;
        }
        case "thisMonth": {
          const sm = startOfMonth(today);
          const em = endOfMonth(today);
          return date >= sm && date <= em;
        }
        case "lastMonth": {
          const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const sm = startOfMonth(lm);
          const em = endOfMonth(lm);
          return date >= sm && date <= em;
        }
        default:
          return true;
      }
    });
  }, [tickets, dateFilter, fromDate, toDate]);

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

        {/* Date filter dropdown + From/To range (syncing behavior) */}
        <div className="flex items-center gap-3">
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
              <DropdownMenuItem onClick={() => applyPreset("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("yesterday")}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("thisWeek")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("lastWeek")}>Last Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("thisMonth")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("lastMonth")}>Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* From / To date inputs */}
          <label className="text-sm mr-1 hidden md:inline">From:</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From date"
            className="max-w-[160px]"
          />
          <label className="text-sm mr-1 ml-2 hidden md:inline">To:</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
            className="max-w-[160px]"
          />

          {/* Clear range: clears from/to and resets to All */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFromDate("");
              setToDate("");
              // keep current dateFilter? we reset to All for clarity
              setDateFilter("all");
            }}
          >
            Clear
          </Button>
        </div>

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
