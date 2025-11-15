"use client"

import * as React from "react"
import axios from "axios"
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
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

type Ticket = {
  _id: string
  subject: string
  message: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  seller: {
    name: string
    storeName: string
    email: string
  }
}

export function SupportTicketsTable() {
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<"all" | "week" | "month">("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})

  // 🔹 Fetch tickets
  const fetchTickets = React.useCallback(async () => {
  try {
    setLoading(true)

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    // Check if token is available
    if (!token) {
      console.error("❌ No token found in localStorage")
      setLoading(false)
      return
    }
console.log("Token in localStorage:", localStorage.getItem("token"));

    const res = await axios.get(
      "https://cod-ecommerce-two.vercel.app/api/employee/employee/support-tickets",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    console.log("✅ Tickets response:", res.data)
    setTickets(res.data?.data || [])
  } catch (err: any) {
    console.error("❌ Error fetching tickets:", err.response?.data || err.message)
  } finally {
    setLoading(false)
  }
}, [])


  // ✅ Run fetch once on mount
  React.useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // 🔹 Update status (close ticket)
  const updateStatus = async (id: string, newStatus: "closed") => {
    try {
      const token = localStorage.getItem("token")
      await axios.patch(
        `https://cod-ecommerce-two.vercel.app/api/employee/employee/support-tickets/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchTickets() // refresh after update
    } catch (err) {
      console.error("❌ Failed to update status:", err)
    }
  }

  // 🔹 Date filters
const filteredByDate = React.useMemo(() => {
  if (dateFilter === "all") return tickets

  const now = new Date()
  return tickets.filter((t) => {
    const dt = new Date(t.createdAt)
    if (dateFilter === "week") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(now.getDate() - 7)
      return dt >= oneWeekAgo
    }
    if (dateFilter === "month") {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(now.getMonth() - 1)
      return dt >= oneMonthAgo
    }
    return true
  })
}, [tickets, dateFilter])

const timeFiltered = React.useMemo(() => {
  return filteredByDate.filter((t) => {
    const dt = new Date(t.createdAt)
    const from = rangeFilter.from ? new Date(rangeFilter.from) : null
    const to = rangeFilter.to ? new Date(rangeFilter.to) : null
    if (from && dt < from) return false
    if (to && dt > to) return false
    return true
  })
}, [filteredByDate, rangeFilter])

const finalData = React.useMemo(() => {
  if (!globalFilter.trim()) return timeFiltered
  const q = globalFilter.toLowerCase()
  return timeFiltered.filter((t) => {
    return (
      t.subject.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q) ||
      t.seller.name.toLowerCase().includes(q) ||
      t.seller.storeName.toLowerCase().includes(q) ||
      t.seller.email.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    )
  })
}, [timeFiltered, globalFilter])


  // 🔹 Columns
  const columns: ColumnDef<Ticket>[] = [
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "message", header: "Message" },
    { accessorKey: "priority", header: "Priority" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (row) => new Date(row.getValue() as string).toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const ticket = row.original
        const isClosed = ticket.status === "closed"

        return (
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => updateStatus(ticket._id, "closed")}
            disabled={isClosed}
          >
            {isClosed ? "Closed" : "Close"}
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: finalData,
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
    meta: { refresh: fetchTickets },
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  if (loading) return <p className="p-4">Loading tickets...</p>

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Search tickets..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        {/* Date Range */}
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

        {/* Week/Month Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["all", "week", "month"].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setDateFilter(option as "all" | "week" | "month")}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  No tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
