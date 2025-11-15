// components/StocksTable.tsx
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
import { Check, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

// --- Types
export interface Seller {
  _id: string
  name: string
  email: string
}

export interface Stock {
  _id: string
  seller: Seller
  sku: string
  category: string
  name: string
  images: string[]
  price: number
  quantity: number
  createdAt: string
  updatedAt: string
}

type Warehouse = {
  id: string
  name: string
  email: string
}

// ✅ Extend TableMeta to allow refresh
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void
  }
}

// --- Columns
export const stockColumns: ColumnDef<Stock>[] = [
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
      const seller = row.original.seller
      return (
        <div>
          <div className="font-medium">{seller?.name || "Unknown"}</div>
          <div className="text-sm text-gray-500">{seller?.email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const p = row.getValue("price") as number
      return <div>${Number.isFinite(p) ? p.toFixed(2) : String(p)}</div>
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
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
      // Single-row modal + state
      const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
      const [selectedWarehouse, setSelectedWarehouse] = React.useState("")
      const [selectedWarehouseName, setSelectedWarehouseName] = React.useState("")
      const [assignOpen, setAssignOpen] = React.useState(false)
      const [deleteOpen, setDeleteOpen] = React.useState(false)
      const [loading, setLoading] = React.useState(false)
      const [open, setOpen] = React.useState(false)
      const [searchInput, setSearchInput] = React.useState("")

      React.useEffect(() => {
        if (!assignOpen) return
        const fetchWarehouses = async () => {
          try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
            const resp = await axios.get("https://cod-ecommerce-two.vercel.app/api/warehouse/", {
              headers: { Authorization: `Bearer ${token}` },
            })
            const arr = Array.isArray(resp.data?.data) ? resp.data.data : []
            const norm: Warehouse[] = arr.map((w: any) => ({
              id: w.id ?? w._id,
              name: w.name ?? "",
              email: w.email ?? "",
            }))
            setWarehouses(norm)
          } catch (err) {
            console.error("⚠️ Failed to fetch warehouses:", err)
          }
        }
        fetchWarehouses()
      }, [assignOpen])

      const filteredWarehouses = warehouses.filter((w) =>
        w.name.toLowerCase().includes(searchInput.toLowerCase())
      )

      const handleDelete = async () => {
        try {
          setLoading(true)
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
          await axios.delete(`https://cod-ecommerce-two.vercel.app/api/admin/stock/delete/${row.original._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setDeleteOpen(false)
          table.options.meta?.refresh?.()
          toast.success("Product deleted successfully.")
        } catch (err) {
          console.error("❌ Failed to delete product", err)
          toast.error("Failed to delete product.")
        } finally {
          setLoading(false)
        }
      }

      const handleAssign = async () => {
        if (!selectedWarehouse) return
        try {
          setLoading(true)
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
          await axios.post(
            `https://cod-ecommerce-two.vercel.app/api/admin/assign/products/${selectedWarehouse}`,
            { productIds: [row.original._id] },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          setAssignOpen(false)
          setSelectedWarehouse("")
          setSelectedWarehouseName("")
          table.options.meta?.refresh?.()
          toast.success("Product successfully assigned to warehouse!")
        } catch (err) {
          console.error("⚠️ Failed to assign product:", err)
          toast.error("Failed to assign product.")
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
              <DropdownMenuItem onClick={() => setAssignOpen(true)}>Assign Product to Warehouse</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Modal */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The product will be permanently removed.
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

          {/* Assign Modal (single) */}
          <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Assign Product</AlertDialogTitle>
                <AlertDialogDescription>Select a warehouse to assign this product.</AlertDialogDescription>
              </AlertDialogHeader>

              <div className="grid gap-3">
                <label className="font-medium">Warehouse</label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between bg-transparent"
                      onClick={() => setOpen(!open)}
                    >
                      <span className="truncate">{selectedWarehouseName || "Select warehouse..."}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2 space-y-2">
                      <Input
                        placeholder="Search warehouse..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredWarehouses.length > 0 ? (
                          filteredWarehouses.map((w) => (
                            <button
                              key={w.id}
                              onClick={() => {
                                setSelectedWarehouse(w.id)
                                setSelectedWarehouseName(w.name)
                                setSearchInput("")
                                setOpen(false)
                              }}
                              className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                                selectedWarehouse === w.id ? "bg-accent text-accent-foreground" : ""
                              }`}
                            >
                              <span>{w.name} ({w.email})</span>
                              {selectedWarehouse === w.id && <Check className="h-4 w-4" />}
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                            No warehouses found
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAssign} disabled={loading || !selectedWarehouse} className="bg-blue-600 hover:bg-blue-700">
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

// --- StocksTable component (complete)
export function StocksTable() {
  const [stocks, setStocks] = React.useState<Stock[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})

  // --- Bulk assign states
  const [assignBulkOpen, setAssignBulkOpen] = React.useState(false)
  const [warehousesBulk, setWarehousesBulk] = React.useState<Warehouse[]>([])
  const [selectedWarehouseBulk, setSelectedWarehouseBulk] = React.useState<string>("")
  const [selectedWarehouseBulkName, setSelectedWarehouseBulkName] = React.useState<string>("")
  const [searchInputBulk, setSearchInputBulk] = React.useState("")
  const [openBulkPicker, setOpenBulkPicker] = React.useState(false)
  const [bulkLoading, setBulkLoading] = React.useState(false)

  const fetchStocks = React.useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/getAllStock", {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("📦 API Response:", res.data)
      setStocks(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error("❌ Error fetching stocks:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  // Fetch warehouses for bulk assign when modal opens
  React.useEffect(() => {
    if (!assignBulkOpen) return
    const fetchWarehouses = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const resp = await axios.get("https://cod-ecommerce-two.vercel.app/api/warehouse/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const arr = Array.isArray(resp.data?.data) ? resp.data.data : []
        const norm: Warehouse[] = arr.map((w: any) => ({
          id: w.id ?? w._id,
          name: w.name ?? "",
          email: w.email ?? "",
        }))
        setWarehousesBulk(norm)
      } catch (err) {
        console.error("⚠️ Failed to fetch warehouses (bulk):", err)
      }
    }
    fetchWarehouses()
  }, [assignBulkOpen])

  const filteredWarehousesBulk = warehousesBulk.filter((w) =>
    w.name.toLowerCase().includes(searchInputBulk.toLowerCase())
  )

  const handleAssignBulk = async () => {
    const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original._id)
    if (!selectedWarehouseBulk || selectedIds.length === 0) return
    try {
      setBulkLoading(true)
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      await axios.post(
        `https://cod-ecommerce-two.vercel.app/api/admin/assign/products/${selectedWarehouseBulk}`,
        { productIds: selectedIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setAssignBulkOpen(false)
      setSelectedWarehouseBulk("")
      setSelectedWarehouseBulkName("")
      setSearchInputBulk("")
      // clear selection
      table.resetRowSelection()
      // refresh
      fetchStocks()
      toast.success("Products successfully assigned to warehouse!")
    } catch (err) {
      console.error("⚠️ Failed to assign products (bulk):", err)
      toast.error("Failed to assign products.")
    } finally {
      setBulkLoading(false)
    }
  }

  const filteredByDate = React.useMemo(() => {
    if (dateFilter === "all") return stocks
    const now = new Date()
    return stocks.filter((s) => {
      const dt = new Date(s.createdAt)

      switch (dateFilter) {
        case "today": {
          return dt.toDateString() === now.toDateString()
        }
        case "yesterday": {
          const y = new Date()
          y.setDate(now.getDate() - 1)
          return dt.toDateString() === y.toDateString()
        }
        case "thisWeek": {
          const start = new Date(now)
          start.setDate(now.getDate() - now.getDay())
          return dt >= start && dt <= now
        }
        case "lastWeek": {
          const start = new Date(now)
          start.setDate(now.getDate() - now.getDay() - 7)
          const end = new Date(start)
          end.setDate(start.getDate() + 6)
          return dt >= start && dt <= end
        }
        case "thisMonth": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1)
          return dt >= start && dt <= now
        }
        case "lastMonth": {
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const end = new Date(now.getFullYear(), now.getMonth(), 0)
          return dt >= start && dt <= end
        }
        default:
          return true
      }
    })
  }, [stocks, dateFilter])

  const timeFiltered = React.useMemo(() => {
    return filteredByDate.filter((s) => {
      const dt = new Date(s.createdAt)
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
    return timeFiltered.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        String(s.price).includes(q) ||
        String(s.quantity).includes(q)
      )
    })
  }, [timeFiltered, globalFilter])

  const table = useReactTable({
    data: finalData,
    columns: stockColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      refresh: fetchStocks,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  })

  if (loading) return <p className="p-4">Loading stocks...</p>

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
        <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
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
            {["all", "today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth"].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() =>
                  setDateFilter(
                    option as
                      | "all"
                      | "today"
                      | "yesterday"
                      | "thisWeek"
                      | "lastWeek"
                      | "thisMonth"
                      | "lastMonth"
                  )
                }
              >
                {option.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk actions (shows when >=1 row selected) */}
      <div className="flex gap-2 items-center mb-2">
        {Object.keys(rowSelection).length > 0 && (
          <>
            <Button
              variant="destructive"
              className="mb-0"
              onClick={async () => {
                const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original._id)
                if (!selectedIds.length) return
                try {
                  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                  await Promise.all(
                    selectedIds.map((id) =>
                      axios.delete(`https://cod-ecommerce-two.vercel.app/api/admin/stock/delete/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                    )
                  )
                  table.resetRowSelection()
                  fetchStocks()
                  toast.success("Deleted selected products.")
                } catch (err) {
                  console.error("Failed to bulk delete", err)
                  toast.error("Failed to delete selected products.")
                }
              }}
            >
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>

            <Button variant="default" className="mb-0" onClick={() => setAssignBulkOpen(true)}>
              Assign Selected ({Object.keys(rowSelection).length})
            </Button>
          </>
        )}
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
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={stockColumns.length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk assign AlertDialog */}
      <AlertDialog open={assignBulkOpen} onOpenChange={setAssignBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Products</AlertDialogTitle>
            <AlertDialogDescription>Select a warehouse to assign selected products.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3">
            <label className="font-medium">Warehouse</label>
            <Popover open={openBulkPicker} onOpenChange={setOpenBulkPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBulkPicker}
                  className="w-full justify-between bg-transparent"
                  onClick={() => setOpenBulkPicker(!openBulkPicker)}
                >
                  <span className="truncate">{selectedWarehouseBulkName || "Select warehouse..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Search warehouse..."
                    value={searchInputBulk}
                    onChange={(e) => setSearchInputBulk(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredWarehousesBulk.length > 0 ? (
                      filteredWarehousesBulk.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setSelectedWarehouseBulk(w.id)
                            setSelectedWarehouseBulkName(w.name)
                            setSearchInputBulk("")
                            setOpenBulkPicker(false)
                          }}
                          className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                            selectedWarehouseBulk === w.id ? "bg-accent text-accent-foreground" : ""
                          }`}
                        >
                          <span>{w.name} ({w.email})</span>
                          {selectedWarehouseBulk === w.id && <Check className="h-4 w-4" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-muted-foreground text-center">No warehouses found</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignBulk}
              disabled={bulkLoading || !selectedWarehouseBulk || table.getSelectedRowModel().rows.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {bulkLoading ? "Assigning..." : `Assign (${table.getSelectedRowModel().rows.length})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination + selection summary */}
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

export default StocksTable
