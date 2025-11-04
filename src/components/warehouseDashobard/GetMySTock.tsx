"use client"

import * as React from "react"
import axios from "axios"
import {
  ColumnDef,
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

type Product = {
  _id: string
  name: string
  sku?: string
  category?: string
  quantity: number
  price: number
  createdAt: string
  updatedAt: string
  seller?: {
    name: string
    email: string
  }
}

export function WarehouseProductsTable() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [warehouse, setWarehouse] = React.useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})

  // 🔹 Fetch warehouse products
  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) return

      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/warehouse/e/getMyProducts", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = res.data?.data
      setWarehouse(data?.warehouse || null)

      // 🔹 Include seller info if available (API may not send seller details — mock if needed)
      const formattedProducts = (data?.products || []).map((p: any) => ({
        ...p,
        seller: p.sellerDetails || { name: "Unknown Seller", email: "N/A" }, // Fallback
      }))

      setProducts(formattedProducts)
    } catch (err) {
      console.error("❌ Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // 🔹 Date filters
  const filteredByDate = React.useMemo(() => {
    const now = new Date()
    return products.filter((p) => {
      const createdAt = new Date(p.createdAt)
      switch (dateFilter) {
        case "today":
          return createdAt.toDateString() === now.toDateString()
        case "yesterday":
          const y = new Date(now)
          y.setDate(now.getDate() - 1)
          return createdAt.toDateString() === y.toDateString()
        case "thisWeek":
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)
          return createdAt >= startOfWeek && createdAt <= endOfWeek
        case "lastWeek":
          const lastWeekStart = new Date(now)
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
          lastWeekStart.setHours(0, 0, 0, 0)
          const lastWeekEnd = new Date(lastWeekStart)
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
          lastWeekEnd.setHours(23, 59, 59, 999)
          return createdAt >= lastWeekStart && createdAt <= lastWeekEnd
        case "thisMonth":
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          return createdAt >= thisMonthStart && createdAt <= thisMonthEnd
        case "lastMonth":
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          return createdAt >= lastMonthStart && createdAt <= lastMonthEnd
        default:
          return true
      }
    })
  }, [products, dateFilter])

  // 🔹 Custom date range
  const rangeFiltered = React.useMemo(() => {
    return filteredByDate.filter((p) => {
      const createdAt = new Date(p.createdAt)
      const from = rangeFilter.from ? new Date(rangeFilter.from) : null
      const to = rangeFilter.to ? new Date(rangeFilter.to) : null
      if (from && createdAt < from) return false
      if (to && createdAt > to) return false
      return true
    })
  }, [filteredByDate, rangeFilter])

  // 🔹 Global search
  const finalData = React.useMemo(() => {
    if (!globalFilter.trim()) return rangeFiltered
    const q = globalFilter.toLowerCase()
    return rangeFiltered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.seller?.name && p.seller.name.toLowerCase().includes(q))
    )
  }, [rangeFiltered, globalFilter])

  // 🔹 Columns (Seller info shown here)
  const columns: ColumnDef<Product>[] = [
    { accessorKey: "name", header: "Product Name" },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "quantity", header: "Quantity" },
    { accessorKey: "price", header: "Price ($)" },
    {
      accessorKey: "seller",
      header: "Seller Details",
      cell: ({ row }) => {
        const seller = row.original.seller
        return seller ? `${seller.name} (${seller.email})` : "-"
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (row) => new Date(row.getValue() as string).toLocaleString(),
    },
  ]

  const table = useReactTable({
    data: finalData,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  if (loading) return <p className="p-4">Loading products...</p>

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center py-4 gap-4">
        <Input
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
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
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
