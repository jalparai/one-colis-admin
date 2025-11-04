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
import { ChevronDown, Trash } from "lucide-react"
import { Checkbox } from "../ui/checkbox"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

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
  const [deleting, setDeleting] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<"all" | "week" | "month">("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})

  // delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTicket, setDeleteTicket] = React.useState<Ticket | null>(null)

  // 🔹 Fetch tickets
  const fetchTickets = React.useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/support-tickets/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTickets(res.data?.data || [])
    } catch (err) {
      console.error("❌ Error fetching tickets:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const updateStatus = async (id: string, newStatus: "closed") => {
    try {
      const token = localStorage.getItem("token")
      await axios.patch(
        `https://cod-ecommerce-two.vercel.app/api/admin/support-tickets/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchTickets() // refresh after update
    } catch (err) {
      console.error("❌ Failed to update status:", err)
    }
  }

  // 🔹 Delete handler
  const openDeleteDialogFor = (ticket: Ticket) => {
    setDeleteTicket(ticket)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTicket) return
    setDeleting(true)
    try {
      const token = localStorage.getItem("token")
      // use the API endpoint provided — dynamic id
      await axios.delete(
        `https://cod-ecommerce-two.vercel.app/api/admin/delete-support-tickets/${deleteTicket._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // refresh list
      await fetchTickets()
      setDeleteOpen(false)
      setDeleteTicket(null)
    } catch (err) {
      console.error("❌ Failed to delete ticket:", err)
    } finally {
      setDeleting(false)
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
      enableHiding: false,
    },
    {
      header: "Seller Name",
      cell: ({ row }) => row.original.seller?.name || "—",
    },
    {
      header: "Seller Email",
      cell: ({ row }) => row.original.seller?.email || "—",
    },
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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() => updateStatus(ticket._id, "closed")}
              disabled={isClosed}
            >
              {isClosed ? "Closed" : "Close"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => openDeleteDialogFor(ticket)}
              aria-label={`Delete ticket ${ticket.subject}`}
            >
              <Trash className="mr-2" />
              Delete
            </Button>
          </div>
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
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(open) => {
        // if user closes dialog manually, clear selected ticket
        if (!open) setDeleteTicket(null)
        setDeleteOpen(open)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete ticket{deleteTicket ? `: ${deleteTicket.subject}` : "?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Search tickets..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <label>From:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))} />
          <label>To:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value }))} />
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
              <DropdownMenuItem key={option} onClick={() => setDateFilter(option as "all" | "week" | "month")}>
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
