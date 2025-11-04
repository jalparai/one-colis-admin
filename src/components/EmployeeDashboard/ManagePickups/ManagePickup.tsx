"use client"

import * as React from "react"
import axios from "axios"
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
  type RowData,
  flexRender,
} from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import toast from "react-hot-toast"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"

// ✅ Order type
export type Order = {
  id?: string
  _id?: string
  seller: string
  sellerEmail: string
  items: {
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  itemsTotal: number
  totalAmount: number
  status: string
  notes: string
  createdAt: string
  updatedAt: string
}


type Agent = {
  id: string
  name: string
  email: string
  // ...existing fields may exist on server (_id etc.)
}

// small helper: safe parse user from localStorage (handles wrapper { user: {...} } or plain user)
function getStoredUser(): any | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" && parsed.user ? parsed.user : parsed
  } catch (e) {
    return null
  }
}

function hasAnyPermission(permissionsObj: any, keys: string[]) {
  if (!permissionsObj || typeof permissionsObj !== "object") return false
  return keys.some((k) => {
    const v = permissionsObj[k]
    if (typeof v === "string") return v.toLowerCase() === "true"
    return Boolean(v)
  })
}

// ✅ Extend TableMeta to allow refresh
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void
  }
}

// NOTE: we keep most column defs the same; only the Actions cell now checks user permissions
export const orderColumns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
    accessorKey: "seller",
    header: "Seller",
    cell: ({ row }) => {
      const seller = row.getValue("seller") as any;
      return <div>{typeof seller === "object" ? seller.name || "N/A" : seller}</div>;
    },
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
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <ul className="list-none pl-0">
        {row.original.items.map((item, idx) => (
          <li key={idx}>{item.quantity}</li>
        ))}
      </ul>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => <div>{row.getValue("totalAmount")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
          case "pending":
            return "bg-yellow-50 text-yellow-700"
          case "confirmed":
            return "bg-indigo-50 text-indigo-700"
          case "shipped":
          case "delivered":
            return "bg-green-50 text-green-700"
          case "cancelled":
            return "bg-rose-50 text-rose-700"
          default:
            return "bg-gray-50 text-gray-700"
        }
      }
      return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>{status}</span>
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <div>{row.getValue("notes")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <div>{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</div>,
  },
  {
    id: "actions",
    header: "Actions/Assign",
    cell: ({ row, table }) => {
      const [deleteOpen, setDeleteOpen] = React.useState(false)
      const [assignOpen, setAssignOpen] = React.useState(false)
      const [loading, setLoading] = React.useState(false)
      const [agents, setAgents] = React.useState<Agent[]>([])
      const [selectedAgent, setSelectedAgent] = React.useState("")
      const [filteredAgents, setFilteredAgents] = React.useState<Agent[]>([])

      // determine permissions at render time (safe and handles different shapes)
      const storedUser = getStoredUser()
      const permissions = storedUser?.permissions ?? {}
      const canAssign = hasAnyPermission(permissions, ["assignPickups"]) // adjust keys as needed

      React.useEffect(() => {
        if (assignOpen) {
          if (!canAssign) {
            toast.error("You do not have permission to assign pickups.")
            setAssignOpen(false)
            return
          }

          const fetchAgents = async () => {
            try {
              const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
              const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/get-delivery-agents", {
                headers: { Authorization: `Bearer ${token}` },
              })

              const raw = Array.isArray(res.data?.data) ? res.data.data : []
              const normalized: Agent[] = raw
                .map((a: any) => ({
                  id: a?.id ?? a?._id,
                  name: a?.name ?? "",
                  email: a?.email ?? "",
                }))
                .filter(
                  (a: Agent, i: number, arr: Agent[]) => Boolean(a.id) && i === arr.findIndex((x) => x.id === a.id),
                )

              setAgents(normalized)
            } catch (err) {
              console.error("❌ Failed to fetch agents", err)
            }
          }
          fetchAgents()
        }
      }, [assignOpen, canAssign])

      const handleDelete = async () => {
        try {
          setLoading(true)
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
          await axios.delete(`https://cod-ecommerce-two.vercel.app/api/seller/orders/${row.original.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setDeleteOpen(false)
          table.options.meta?.refresh?.()
        } catch (err) {
          console.error("❌ Failed to delete order", err)
          toast.error("Failed to delete order")
        } finally {
          setLoading(false)
        }
      }

      const handleAssign = async () => {
        if (!selectedAgent) {
          toast.error("Please select an agent first")
          return
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          toast.error("Not authenticated. Please login again.")
          return
        }

        const orderId = row?.original?._id ?? row?.original?.id
        if (!orderId) {
          toast.error("Order ID missing.")
          return
        }

        try {
          setLoading(true)

          await axios.post(
            `https://cod-ecommerce-two.vercel.app/api/admin/assign/pickups/${selectedAgent}`,
            { orderIds: [orderId] },
            { headers: { Authorization: `Bearer ${token}` } },
          )

          toast.success("Pickup assigned successfully")
          setAssignOpen(false)
          setSelectedAgent("")
          table.options.meta?.refresh?.()
        } catch (err: any) {
          console.error("Failed to assign pickup", err.response?.data || err.message)
          toast.error("Could not assign pickup. Please try again.")
        } finally {
          setLoading(false)
        }
      }

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

  {/* either active item (if allowed) or disabled explanation */}
  {canAssign ? (
    <DropdownMenuItem onClick={() => setAssignOpen(true)}>
      Assign Pickup to Agent
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem
      onClick={() => toast.error("You don't have permission to assign pickups.")}
      // visually disabled: you can style by tailwind classes or add a disabled prop if your DropdownMenuItem supports it
      className="opacity-50 cursor-not-allowed"
    >
      Assign Pickup to Agent
    </DropdownMenuItem>
  )}

  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
</DropdownMenuContent>


          </DropdownMenu>

          {/* Delete Modal */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The order will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
                  {loading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Assign Modal */}
          <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Assign Order</AlertDialogTitle>
                <AlertDialogDescription>Select an agent to assign this order.</AlertDialogDescription>
              </AlertDialogHeader>

              <div className="my-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {selectedAgent ? agents.find((a) => a.id === selectedAgent)?.name : "Select Agent..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[300px] p-2">
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Search agent..."
                        className="border px-2 py-1 rounded-md text-sm"
                        onChange={(e) => {
                          const q = e.target.value.toLowerCase()
                          const filtered = agents.filter(
                            (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
                          )
                          setFilteredAgents(filtered)
                        }}
                      />

                      <div className="max-h-48 overflow-y-auto">
                        {(filteredAgents.length ? filteredAgents : agents).map((agent) => (
                          <div
                            key={agent.id}
                            className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 ${
                              selectedAgent === agent.id ? "bg-gray-100" : ""
                            }`}
                            onClick={() => setSelectedAgent(agent.id)}
                          >
                            {agent.name} ({agent.email})
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAssign}
                  disabled={loading || !selectedAgent || agents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Assigning..." : "Assign"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )
    },
  },
]

export function PickUpTable() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "weekly" | "monthly"
  >("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})

  const fetchOrders = React.useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/get-all-pickup-requests/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(res.data?.data || [])
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = React.useMemo(() => {
    const now = new Date()

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt)

      switch (dateFilter) {
        case "today":
          return createdAt.toDateString() === now.toDateString()
        case "yesterday":
          const yesterday = new Date(now)
          yesterday.setDate(now.getDate() - 1)
          return createdAt.toDateString() === yesterday.toDateString()
        case "thisWeek":
        case "weekly":
          const firstDayOfWeek = new Date(now)
          firstDayOfWeek.setDate(now.getDate() - now.getDay())
          return createdAt >= firstDayOfWeek
        case "lastWeek":
          const startLastWeek = new Date(now)
          startLastWeek.setDate(now.getDate() - now.getDay() - 7)
          const endLastWeek = new Date(now)
          endLastWeek.setDate(now.getDate() - now.getDay() - 1)
          return createdAt >= startLastWeek && createdAt <= endLastWeek
        case "thisMonth":
        case "monthly":
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          return createdAt >= firstDayOfMonth
        case "lastMonth":
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
          return createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth
        case "all":
        default:
          return true
      }
    })
  }, [orders, dateFilter])

  const timeFilteredOrders = React.useMemo(() => {
    return filteredOrders.filter((order) => {
      const createdAt = new Date(order.createdAt)
      const from = rangeFilter.from ? new Date(rangeFilter.from) : null
      const to = rangeFilter.to ? new Date(rangeFilter.to) : null
      if (from && createdAt < from) return false
      if (to && createdAt > to) return false
      return true
    })
  }, [filteredOrders, rangeFilter])

  const finalOrders = React.useMemo(() => {
    if (!globalFilter.trim()) return timeFilteredOrders
    const q = globalFilter.toLowerCase()
    return timeFilteredOrders.filter((o) => {
      return (
        o.seller.toLowerCase().includes(q) ||
        o.sellerEmail.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.notes.toLowerCase().includes(q) ||
        o.items.some(
          (it) => it.productName.toLowerCase().includes(q) || String(it.quantity).includes(q) || String(it.unitPrice).includes(q),
        )
      )
    })
  }, [timeFilteredOrders, globalFilter])

  const table = useReactTable({
    data: finalOrders,
    columns: orderColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { refresh: fetchOrders },
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  })

  if (loading) return <p className="p-4">Loading orders...</p>

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input
          placeholder="Search orders..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <label>From:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))} />
          <label>To:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value }))} />
        </div>

        {/* Dropdown for Week/Month */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[
              { key: "all", label: "All" },
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "thisWeek", label: "This Week" },
              { key: "lastWeek", label: "Last Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
            ].map((option) => (
              <DropdownMenuItem key={option.key} onClick={() => setDateFilter(option.key as typeof dateFilter)}>
                {option.label}
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={orderColumns.length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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
  )
}
