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
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

import { AddPayout } from "./Add-Payout"
import { EditPayout } from "./Edit-Payout"
import { ImportExportButtons } from "@/components/ui/import-export-buttons"
import { ENTITY_CONFIGS } from "@/lib/import-export-utils"

// ✅ Extend TableMeta so we can use refresh()
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void
  }
}

export type Payout = {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export const columns: ColumnDef<Payout>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <div>{row.getValue("role")}</div>,
  },
 {
  accessorKey: "createdAt",
  header: "Registered Date",
  cell: ({ row }) => {
    const dateStr = row.getValue("createdAt") as string
    return <div>{new Date(dateStr).toLocaleDateString()}</div>
  },
  filterFn: (row, columnId, filterValue: { from?: string; to?: string }) => {
    if (!filterValue) return true
    const date = new Date(row.getValue(columnId) as string)
    const from = filterValue.from ? new Date(filterValue.from) : null
    const to = filterValue.to ? new Date(filterValue.to) : null
    if (from && date < from) return false
    if (to && date > to) return false
    return true
  },
},
  {
  id: "actions",
  enableHiding: false,
  cell: ({ row, table }) => {
    const Payout = row.original
    const [editOpen, setEditOpen] = React.useState(false)
    const [deleteOpen, setDeleteOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const handleDelete = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        await axios.delete(
          `https://cod-ecommerce-two.vercel.app/api/payout-manager/${Payout._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setDeleteOpen(false)
        table.options.meta?.refresh?.()
      } catch (err) {
        console.error("❌ Failed to delete Payout", err)
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
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ✏️ Edit modal */}
        <EditPayout
          Payout={Payout}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onUpdated={table.options.meta?.refresh || (() => {})}
        />

        {/* 🗑 Delete confirmation popup */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {Payout.name}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The Payout will be permanently
                removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  },
}

]

export function PayoutTable() {
  const [Payouts, setPayouts] = React.useState<Payout[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [dateFilter, setDateFilter] = React.useState<"all" | "weekly" | "monthly">("all");

  const fetchPayouts = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/payout-manager", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPayouts(res.data.data || [])
    } catch (err) {
      console.error("Error fetching Payouts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])


    const filteredEmpoyee = React.useMemo(() => {
    if (dateFilter === "all") return Payouts;
    const now = new Date();
    return Payouts.filter((seller) => {
      const createdAt = new Date(seller.createdAt);
      if (dateFilter === "weekly") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return createdAt >= oneWeekAgo;
      }
      if (dateFilter === "monthly") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return createdAt >= oneMonthAgo;
      }
      return true;
    });
  }, [Payouts, dateFilter]);

  const table = useReactTable({
    data: filteredEmpoyee, // ✅ works here
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
    meta: { refresh: fetchPayouts },
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  });

  if (loading) return <p className="p-4">Loading Payouts...</p>

  const exportEndpoints = [
    // { label: "Export Employees", url: "https://cod-ecommerce-two.vercel.app/api/adminb/bulk/employee/export/excal" },
    // { label: "Export Sellers", url: "https://cod-ecommerce-two.vercel.app/api/adminb/bulk/seller/export/excal" },
  //   { label: "Export Warehouses", url: "/api/adminb/bulk/warehouse/export/excal" },
    { label: "Export Payout Managers", url: "https://cod-ecommerce-two.vercel.app/api/adminb/bulk/payout-manager/export/excel" },
  //   { label: "Export Delivery Agents", url: "/api/adminb/bulk/delivery-agents/export/excel" },
  ];
  
 const handleExport = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to export data");

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "export.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(error);
    alert("Error exporting file!");
  }
};

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <div className="flex items-center gap-2">
  <label>From:</label>
  <Input
    type="date"
    onChange={(e) =>
      table.getColumn("createdAt")?.setFilterValue({
        ...(table.getColumn("createdAt")?.getFilterValue() as any),
        from: e.target.value,
      })
    }
  />
  <label>To:</label>
  <Input
    type="date"
    onChange={(e) =>
      table.getColumn("createdAt")?.setFilterValue({
        ...(table.getColumn("createdAt")?.getFilterValue() as any),
        to: e.target.value,
      })
    }
  />
</div>

        <div className="flex gap-2">
          <ImportExportButtons
            entityType="payout"
            config={ENTITY_CONFIGS.payout}
            onImportSuccess={fetchPayouts}
            onExportSuccess={() => {}}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {dateFilter} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["all", "weekly", "monthly"].map((option) => (
                <DropdownMenuItem key={option} onClick={() => setDateFilter(option as any)}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <AddPayout onPayoutAdded={fetchPayouts} />
        </div>
      </div>
{Object.keys(rowSelection).length > 0 && (
  <Button
    variant="destructive"
    className="mb-2"
    onClick={async () => {
      const selectedIds = table.getSelectedRowModel().rows.map(
        (row) => row.original._id
      )
      if (!selectedIds.length) return

      try {
        const token = localStorage.getItem("token")
        await Promise.all(
          selectedIds.map((id) =>
            axios.delete(
              `https://cod-ecommerce-two.vercel.app/api/payout-manager/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        )
        table.resetRowSelection()
        fetchPayouts()
      } catch (err) {
        console.error("❌ Failed to delete selected Payouts", err)
      }
    }}
  >
    Delete Selected ({Object.keys(rowSelection).length})
  </Button>
)}

      {exportEndpoints.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          className="mb-3"
          onClick={() => handleExport(item.url)}
        >
          {item.label} Excal
        </Button>
      ))}

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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No Payouts found.
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
