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
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export type Warehouse = {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export const warehouseColumns: ColumnDef<Warehouse>[] = [
  { accessorKey: "name", header: "Warehouse Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => new Date(row.getValue("createdAt") as string).toLocaleDateString(),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => new Date(row.getValue("updatedAt") as string).toLocaleDateString(),
  },
]

export function EmployeeWarehousesTable() {
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<"all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth">("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})

  const fetchWarehouses = React.useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWarehouses(res.data?.data || [])
    } catch (err) {
      console.error("Error fetching warehouses:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  // 🔹 Date filter logic
  const filteredByDate = React.useMemo(() => {
    if (dateFilter === "all") return warehouses

    const now = new Date()
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)

    return warehouses.filter((w) => {
      const createdAt = new Date(w.createdAt)
      switch (dateFilter) {
        case "today":
          return createdAt >= startOfDay(now) && createdAt <= endOfDay(now)
        case "yesterday":
          const y = new Date(now)
          y.setDate(now.getDate() - 1)
          return createdAt >= startOfDay(y) && createdAt <= endOfDay(y)
        case "thisWeek":
          const day = now.getDay()
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - day)
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)
          return createdAt >= weekStart && createdAt <= weekEnd
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
  }, [warehouses, dateFilter])

  // 🔹 Date range filter
  const rangeFiltered = React.useMemo(() => {
    return filteredByDate.filter((w) => {
      const createdAt = new Date(w.createdAt)
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
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q)
    )
  }, [rangeFiltered, globalFilter])

  const table = useReactTable({
    data: finalData,
    columns: warehouseColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { refresh: fetchWarehouses },
      initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  })

  if (loading) return <p className="p-4">Loading warehouses...</p>

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4 flex-wrap">
        {/* Global search */}
        <Input
          placeholder="Search warehouses..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <label>From:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))} />
          <label>To:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value }))} />
        </div>

        {/* Predefined date filter dropdown */}
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={warehouseColumns.length} className="h-24 text-center">
                  No warehouses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
