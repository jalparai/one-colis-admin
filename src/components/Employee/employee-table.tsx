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

import { EditEmployee } from "./EditEmployee"
import { AddEmployee } from "./Add-employee"
import { ImportExportButtons } from "@/components/ui/import-export-buttons"
import { ENTITY_CONFIGS } from "@/lib/import-export-utils"
import { useTranslation } from "react-i18next"

// ✅ Extend TableMeta so we can use refresh()
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void
  }
}

export type Employee = {
  _id: string
  name: string
  email: string
  role: string
  customRole?: string   // <-- ADD THIS
  createdAt: string
}

export function EmployeesTable() {
  const { t } = useTranslation("common")
  // parent namespace to avoid conflicts with other pages
  // changed to `employee` as requested so i18n calls become t('employee.xxx')
  const nsPrefix = "employee"
  const e = (k: string) => `${nsPrefix}.${k}`

  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "weekly" | "monthly"
  >("all")

  const fetchEmployees = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/get-employees", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEmployees(res.data.data || [])
    } catch (err) {
      console.error("Error fetching employees:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // columns are defined inside component so we can use t(...) safely
  const columns: ColumnDef<Employee>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t(e("aria.selectAll"))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t(e("aria.selectRow"))}
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
            {t(e("table.name"))}
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
            {t(e("table.email"))}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
      },
      {
        accessorKey: "customRole",
        header: t(e("table.role")),
        cell: ({ row }) => {
          const cRole = row.original.customRole
          const defaultRole = row.original.role
          return <div>{cRole ? cRole : defaultRole}</div>
        },
      },


      {
        accessorKey: "createdAt",
        header: t(e("table.registeredDate")),
        cell: ({ row }) => {
          const dateStr = row.getValue("createdAt") as string
          return <div>{new Date(dateStr).toLocaleDateString()}</div>
        },
        filterFn: (row, columnId, filterValue: { from?: string; to?: string }) => {
          const date = new Date(row.getValue(columnId) as string)
          const from = filterValue?.from ? new Date(filterValue.from) : null
          const to = filterValue?.to ? new Date(filterValue.to) : null

          if (from && date < from) return false
          if (to && date > to) return false
          return true
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row, table }) => {
          const employee = row.original
          const [editOpen, setEditOpen] = React.useState(false)
          const [deleteOpen, setDeleteOpen] = React.useState(false)
          const [loadingLocal, setLoadingLocal] = React.useState(false)

          const handleDelete = async () => {
            try {
              setLoadingLocal(true)
              const token = localStorage.getItem("token")
              await axios.delete(
                `https://cod-ecommerce-two.vercel.app/api/admin/employees/${employee._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              setDeleteOpen(false)
              table.options.meta?.refresh?.()
            } catch (err) {
              console.error("❌ Failed to delete employee", err)
            } finally {
              setLoadingLocal(false)
            }
          }

          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">{t(e("actions.openMenu"))}</span>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t(e("actions.label"))}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    {t(e("actions.edit"))}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                    {t(e("actions.delete"))}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <EditEmployee
                employee={employee}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onUpdated={() => {
                  if (table?.options?.meta?.refresh) {
                    table.options.meta.refresh()
                  }
                }}
              />

              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t(e("dialog.deleteTitle"), { name: employee.name })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(e("dialog.deleteDescription"))}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loadingLocal}>{t(e("actions.cancel"))}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={loadingLocal}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loadingLocal ? t(e("actions.deleting")) : t(e("actions.delete"))}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )
        },
      },
    ],
    [t]
  )

  const filteredEmployees = React.useMemo(() => {
    if (dateFilter === "all") return employees

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return employees.filter((employee) => {
      const createdAt = new Date(employee.createdAt)

      switch (dateFilter) {
        case "today":
          return createdAt >= today && createdAt <= now
        case "yesterday": {
          const yesterday = new Date(today)
          yesterday.setDate(today.getDate() - 1)
          return createdAt >= yesterday && createdAt < today
        }
        case "thisWeek":
          return createdAt >= startOfWeek && createdAt <= endOfWeek
        case "lastWeek": {
          const lastWeekStart = new Date(startOfWeek)
          lastWeekStart.setDate(startOfWeek.getDate() - 7)
          const lastWeekEnd = new Date(startOfWeek)
          lastWeekEnd.setDate(startOfWeek.getDate() - 1)
          return createdAt >= lastWeekStart && createdAt <= lastWeekEnd
        }
        case "thisMonth": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          return createdAt >= startOfMonth && createdAt <= now
        }
        case "lastMonth": {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
          return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth
        }
        default:
          return true
      }
    })
  }, [employees, dateFilter])

  const table = useReactTable({
    data: filteredEmployees,
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
    meta: { refresh: fetchEmployees },
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  })

  if (loading) return <p className="p-4">{t(e("ui.loading"))}</p>

  const exportEndpoints = [
    { label: "exportEmployees", url: "https://cod-ecommerce-two.vercel.app/api/adminb/bulk/employee/export/excal" },
  ]

const handleExport = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url, { method: "GET" })
    if (!response.ok) {
      // try to parse JSON error if returned
      const ct = response.headers.get("content-type") || ""
      if (ct.includes("application/json")) {
        const err = await response.json()
        throw new Error(err?.message || "Failed to export data")
      }
      throw new Error("Failed to export data")
    }

    const contentType = response.headers.get("content-type") || ""
    // if server returned JSON (error info), parse and throw
    if (contentType.includes("application/json")) {
      const errJson = await response.json()
      throw new Error(errJson?.message || "Server returned JSON instead of file")
    }

    const blob = await response.blob()

    // helper: extract filename from Content-Disposition header
    const getFileNameFromContentDisposition = (cd: string | null): string | null => {
      if (!cd) return null
      // common patterns: filename="name.pdf" or filename*=UTF-8''name.pdf
      const fileNameMatch = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(cd)
      if (fileNameMatch && fileNameMatch[1]) {
        try { return decodeURIComponent(fileNameMatch[1]) } catch { return fileNameMatch[1] }
      }
      return null
    }

    const contentDisposition = response.headers.get("content-disposition")
    const guessedName =
      getFileNameFromContentDisposition(contentDisposition) ??
      (contentType.includes("pdf") ? "export.pdf" : contentType.includes("spreadsheet") || url.toLowerCase().includes("excel") || url.toLowerCase().includes("excal") ? "export.xlsx" : "export.bin")

    // For old IE
    if ((window as any).navigator && (window as any).navigator.msSaveOrOpenBlob) {
      ;(window as any).navigator.msSaveOrOpenBlob(blob, guessedName)
      return
    }

    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = guessedName
    // some browsers require anchor to be in DOM
    document.body.appendChild(a)
    a.click()
    a.remove()

    // revoke after a short delay so the download has time to start
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl)
    }, 1000)
  } catch (error) {
    console.error("Export error:", error)
    // keep your existing localization call
    alert(t(e("export.error")))
  }
}


  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 items-center">
          <Input
            placeholder={t(e("filter.emailPlaceholder"))}
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          {/* ✅ Date filters */}
          <div className="flex gap-2 items-center">
            <label>{t(e("filter.from"))}</label>
            <Input
              type="date"
              onChange={(e) =>
                table.getColumn("createdAt")?.setFilterValue({
                  ...(table.getColumn("createdAt")?.getFilterValue() as any),
                  from: e.target.value,
                })
              }
            />
            <label>{t(e("filter.to"))}</label>
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
        </div>

        <div className="flex gap-2">
          <ImportExportButtons
            entityType="employees"
            config={ENTITY_CONFIGS.employees}
            onImportSuccess={fetchEmployees}
            onExportSuccess={() => { }}
          />


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {t(e("filter.filterButton"))}: {t(e("filter.options." + dateFilter))} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[
                "all",
                "today",
                "yesterday",
                "thisWeek",
                "lastWeek",
                "thisMonth",
                "lastMonth",
              ].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setDateFilter(option as any)}
                >
                  {t(e("filter.options." + option))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <AddEmployee onEmployeeAdded={fetchEmployees} />

        </div>
      </div>
      {exportEndpoints.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          className="mb-3"
          onClick={() => handleExport(item.url)}
        >
          {t(e("export." + item.label))} Excel
        </Button>
      ))}

      {/* ✅ Bulk delete button */}
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
                    `https://cod-ecommerce-two.vercel.app/api/admin/employees/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  )
                )
              )
              table.resetRowSelection()
              fetchEmployees()
            } catch (err) {
              console.error("Failed to bulk delete", err)
            }
          }}
        >
          {t(e("actions.deleteSelected"), { count: Object.keys(rowSelection).length })}
        </Button>
      )}

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
                  {t(e("table.noData"))}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {t(e("ui.selectedRows"), { selected: table.getFilteredSelectedRowModel().rows.length, total: table.getFilteredRowModel().rows.length })}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t(e("ui.prev"))}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t(e("ui.next"))}
          </Button>
        </div>
      </div>
    </div>
  )
}
