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
  RowData,
  flexRender,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ✅ Order type
export type Order = {
  id: string
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

// ✅ Extend TableMeta to allow refresh
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void
  }
}

// ✅ Columns definition (sortable headers like Employee table)
export const orderColumns: ColumnDef<Order>[] = [
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
    accessorKey: "seller",
    header: "Seller",
    cell: ({ row }) => <div>{row.getValue("seller")}</div>,
  },
  {
    accessorKey: "sellerEmail",
    header: "Email",
    cell: ({ row }) => <div className="lowercase">{row.getValue("sellerEmail")}</div>,
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items
      return (
        <ul className="list-none pl-0">
          {items.map((item, idx) => (
            <li key={idx}>
              {item.productName} 
            </li>
          ))}
        </ul>
      )
    },
  },
  {
    accessorKey: "itemsTotal",
    header: "Items Total",
    cell: ({ row }) => <div>{row.getValue("itemsTotal")}</div>,
  },
  {
    accessorKey: "totalAmount",
    header: "Order Total",
    cell: ({ row }) => <div>{row.getValue("totalAmount")}</div>,
  },
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "pending":
          return "bg-yellow-100 text-yellow-800"
        case "confirmed":
          return "bg-blue-100 text-blue-800"
        case "shipped":
          return "bg-green-100 text-green-800"
        case "cancelled":
          return "bg-red-100 text-red-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
          status
        )}`}
      >
        {status}
      </span>
    )
  },
},

  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <div>{row.getValue("notes")}</div>,
  },
{
  accessorKey: "createdAt",
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      Date
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
  cell: ({ row }) => {
    const dateStr = row.getValue("createdAt") as string
    return <div>{new Date(dateStr).toLocaleDateString()}</div>
  },
},

]


// ✅ OrdersTable component
export function OrdersTable() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

const fetchOrders = React.useCallback(async () => {
  try {
    const token = localStorage.getItem("token")
    const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })

    // ✅ Map data
    const mapped = (res.data.data || []).map((order: any) => ({
      id: order.id,
      seller: order.seller,
      sellerEmail: order.sellerEmail,
      items: order.items,
      itemsTotal: order.itemsTotal,
      totalAmount: order.totalAmount,
      status: order.status,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }))

    setOrders(mapped)
  } catch (err) {
    console.error("Error fetching orders:", err)
  } finally {
    setLoading(false)
  }
}, [])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

const table = useReactTable({
  data: orders,
  columns: orderColumns,
  state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  meta: { refresh: fetchOrders },
})


  if (loading) return <p className="p-4">Loading orders...</p>

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4">
       <Input
  placeholder="Search orders..."
  value={globalFilter ?? ""}
  onChange={(event) => setGlobalFilter(event.target.value)}
  className="max-w-sm"
/>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
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
            {table.getRowModel().rows?.length ? (
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
                <TableCell colSpan={orderColumns.length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
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
