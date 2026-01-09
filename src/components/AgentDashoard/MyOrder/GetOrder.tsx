"use client"

import * as React from "react"
import axios from "axios"
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, MessageSquare } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

// Types
type OrderItem = {
  sku: string
  productName: string
  unitPrice: number
  quantity: number
}

type Seller = {
  id: string
  name: string
  storeName: string
  email: string
  phone?: string
}

type Customer = {
  name?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
}

type DeliveryOrder = {
  id: string
  orderId?: string
  items: OrderItem[]
  totalAmount: number
  notes?: string
  status: string
  createdAt: string
  assignedAt?: string
  assignedBy?: string | { id: string; name: string; email: string }
  assignedTo?: string
  seller?: Seller
  customer?: Customer
}

export function DeliveryOrdersTable() {
  const [orders, setOrders] = React.useState<DeliveryOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all")
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({})
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  const [selectedStatusById, setSelectedStatusById] = React.useState<Record<string, string>>({})

  const STATUSES = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "ready",
        "pickup_requested",
        "returned",
        "collected",
     
  ]

  const toSlug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, "")

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("No token found. Please log in again.")
        setLoading(false)
        return
      }

      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/delivery-agent/me/orders", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      })

      const raw = res.data?.data || []

      const normalized = (raw || []).map((o: any) => {
        const dbId = o._id ?? o.id ?? o._doc?._id ?? o.code ?? null

        const orderId =
          o.orderId ??
          o.orderID ??
          o.order_number ??
          o.orderNo ??
          o.orderCode ??
          o.trackingNumber ??
          o.tracking_no ??
          o.tracking_id ??
          o.externalId ??
          o.code ??
          dbId ??
          ""

        // try to locate customer info from common fields
        const customerRaw = o.customer ?? o.customerInfo ?? o.shippingAddress ?? o.shipping ?? null
        const customer: Customer | undefined = customerRaw
          ? {
              name: customerRaw.name ?? customerRaw.fullName ?? customerRaw.contactName ?? undefined,
              phone: customerRaw.phone ?? customerRaw.mobile ?? customerRaw.contact?.phone ?? undefined,
              address: customerRaw.address ?? customerRaw.street ?? undefined,
              city: customerRaw.city ?? undefined,
              postalCode: customerRaw.postalCode ?? customerRaw.zip ?? undefined,
            }
          : undefined

        // seller phone detection
        const sellerRaw = o.seller ?? null
        const seller: Seller | undefined = sellerRaw
          ? {
              id: sellerRaw._id ?? sellerRaw.id ?? "",
              name: sellerRaw.name ?? sellerRaw.shopName ?? sellerRaw.storeName ?? sellerRaw.email ?? "",
              storeName: sellerRaw.storeName ?? sellerRaw.shopName ?? "",
              email: sellerRaw.email ?? "",
              phone:
                sellerRaw.phone ?? sellerRaw.phoneNumber ?? sellerRaw.contact?.phone ?? sellerRaw.mobile ?? undefined,
            }
          : undefined

        return {
          id: dbId ?? orderId,
          orderId,
          items: Array.isArray(o.items)
            ? o.items.map((it: any) => ({
                sku: it.sku ?? it.product?.sku ?? String(it.sku ?? ""),
                productName: it.productName ?? it.product?.name ?? it.name ?? it.title ?? "",
                unitPrice: Number(it.unitPrice ?? it.price ?? it.totalPrice ?? 0),
                quantity: Number(it.quantity ?? it.qty ?? 0),
              }))
            : [],
          totalAmount: Number(o.totalAmount ?? o.total ?? o.grandTotal ?? 0),
          notes: o.notes ?? "",
          status: o.status ?? "",
          createdAt: o.createdAt ?? o.orderDate ?? new Date().toISOString(),
          assignedAt: o.assignedAt,
          assignedBy: o.assignedBy,
          assignedTo: o.assignedTo,
          seller,
          customer,
        } as DeliveryOrder
      })

      setOrders(normalized)

      const map: Record<string, string> = {}
      for (const o of normalized) {
        map[o.id] = o.status ?? ""
      }
      setSelectedStatusById(map)
    } catch (err: any) {
      console.error("[v0] Error fetching orders:", err)
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch orders"
      toast.error(`Failed to fetch orders: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [])

const tryToSlug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");

const tryToHyphen = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

const handleUpdateStatus = async (orderId: string) => {
  const selectedRaw = selectedStatusById[orderId];
  if (!selectedRaw) {
    toast.error("Please select a status first.");
    return;
  }

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    toast.error("Order not found.");
    return;
  }

  if ((order.status ?? "").toLowerCase() === selectedRaw.toLowerCase()) {
    toast("Status unchanged.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("No token found, please log in again.");
    return;
  }

  setLoadingId(orderId);

  // build list of candidate status values to try
  const tries = Array.from(
    new Set([
      selectedRaw,
      selectedRaw.toLowerCase(),
      tryToSlug(selectedRaw),
      tryToHyphen(selectedRaw),
      tryToSlug(selectedRaw).replace(/^_+|_+$/g, ""), // cleaned
      tryToHyphen(selectedRaw).replace(/^-+|-+$/g, ""),
    ]),
  );

  let lastErr: any = null;
  for (const st of tries) {
    const payloadVariants = [
      { code: orderId, status: st },
      { orderId: orderId, status: st },
      { code: order.orderId ?? orderId, status: st }, // if API expects orderId in code field
    ];

    for (const payload of payloadVariants) {
      try {
        console.log("[status-update] trying", payload);
        const res = await axios.post(
          "https://cod-ecommerce-two.vercel.app/api/delivery-agent/scan",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          },
        );

        console.log("[status-update] success", res.status, res.data);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: selectedRaw } : o)));
        toast.success("Status updated successfully");
        setSelectedStatusById((prev) => ({ ...prev, [orderId]: "" }));
        lastErr = null;
        setLoadingId(null);
        return;
      } catch (err: any) {
        lastErr = err;
        console.warn("[status-update] attempt failed", { payload, status: err?.response?.status, data: err?.response?.data });
        // continue to next payload/variant
      }
    }
  }

  // After all attempts failed: show best info to user
  setLoadingId(null);
  if (lastErr) {
    const r = lastErr.response;
    if (r) {
      const status = r.status;
      const data = r.data;
      const serverMsg = data?.message || data?.error || JSON.stringify(data);
      console.error("[status-update] final error", status, data);
      if (status === 401 || status === 403) {
        toast.error("Authentication failed — please log in again.");
      } else if (status === 404) {
        toast.error(`API not found or status not permitted. Server: ${serverMsg}`);
      } else if (status === 400) {
        toast.error(`Invalid status. Server: ${serverMsg}`);
      } else if (status >= 500) {
        toast.error("Server error. Try again later.");
      } else {
        toast.error(serverMsg || "Failed to update status.");
      }
    } else if (lastErr.code === "ECONNABORTED") {
      toast.error("Request timed out. Try again.");
    } else {
      toast.error(lastErr.message || "Unknown error updating status.");
    }
  } else {
    toast.error("Failed to update status (unknown reason).");
  }
};

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredByDate = React.useMemo(() => {
    const now = new Date()
    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt)
      switch (dateFilter) {
        case "today":
          return createdAt.toDateString() === now.toDateString()
        case "yesterday":
          const y = new Date(now)
          y.setDate(now.getDate() - 1)
          return createdAt.toDateString() === y.toDateString()
        case "thisWeek":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          return createdAt >= weekStart && createdAt <= weekEnd
        case "lastWeek":
          const lastWeekStart = new Date(now)
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
          const lastWeekEnd = new Date(lastWeekStart)
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
          return createdAt >= lastWeekStart && createdAt <= lastWeekEnd
        case "thisMonth":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          return createdAt >= monthStart && createdAt <= monthEnd
        case "lastMonth":
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
          return createdAt >= lastMonthStart && createdAt <= lastMonthEnd
        default:
          return true
      }
    })
  }, [orders, dateFilter])

  const rangeFiltered = React.useMemo(() => {
    return filteredByDate.filter((order) => {
      const createdAt = new Date(order.createdAt)
      const from = rangeFilter.from ? new Date(rangeFilter.from) : null
      const to = rangeFilter.to ? new Date(rangeFilter.to) : null
      if (from && createdAt < from) return false
      if (to && createdAt > to) return false
      return true
    })
  }, [filteredByDate, rangeFilter])

const finalData = React.useMemo(() => {
  const qRaw = globalFilter?.trim()
  if (!qRaw) return rangeFiltered
  const q = qRaw.toLowerCase()

  return rangeFiltered.filter((order) => {
    // safe, lower-cased search sources
    const sellerName = order.seller?.name?.toLowerCase() ?? ""
    const sellerStore = order.seller?.storeName?.toLowerCase() ?? ""
    const customerName = order.customer?.name?.toLowerCase() ?? ""
    const customerPhone = order.customer?.phone?.toLowerCase() ?? ""
    const customerCity = order.customer?.city?.toLowerCase() ?? ""
    const orderId = (order.orderId ?? order.id ?? "").toString().toLowerCase()

    // items match (sku or product name)
    const itemsMatch =
      Array.isArray(order.items) &&
      order.items.some((i) => (i.productName ?? "").toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q))

    return (
      sellerName.includes(q) ||
      sellerStore.includes(q) ||
      customerName.includes(q) ||
      customerPhone.includes(q) ||
      customerCity.includes(q) ||   // <-- new: search by city
      orderId.includes(q) ||        // <-- new: search by order id / orderId
      itemsMatch
    )
  })
}, [rangeFiltered, globalFilter])

  // helper to create wa.me link from seller phone
  const makeWaLink = (rawPhone?: string) => {
    if (!rawPhone) return null
    const cleaned = String(rawPhone).replace(/\D/g, "")
    // if cleaned looks too short, return null to indicate invalid
    if (cleaned.length < 6) return null
    return `https://wa.me/${cleaned}`
  }

  const columns: ColumnDef<DeliveryOrder>[] = [
      {
    id: "order-id",
    header: "# Order ID",
    accessorFn: (row) => row.orderId ?? row.id,
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground">
        {row.original.orderId ?? row.original.id}
      </div>
    ),
  },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => `dh - ${row.original.totalAmount}`,
    },
    {
      header: "Store Name",
      accessorFn: (row) => row.seller?.name ?? "-",
    },
    // NEW: WhatsApp column
       {
      header: "WhatsApp",
      id: "whatsapp",
      cell: ({ row }) => {
        const phoneRaw = row.original.customer?.phone ?? ""
        const sanitized = String(phoneRaw).replace(/\D/g, "")
        if (!sanitized) return "-"
        const waLink = `https://wa.me/${sanitized}`
        const title = `Chat on WhatsApp ${row.original.customer?.name ?? sanitized}`
        return (
          <a href={waLink} target="_blank" rel="noopener noreferrer" title={title}>
            <Button size="sm" variant="outline" className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
              <MessageSquare size={14} />
              WhatsApp
            </Button>
          </a>
        )
      },
    },
    {
      header: "Customer Name",
      id: "customer-name",
      accessorFn: (row) => row.customer?.name ?? "-",
    },
    {
      header: "Customer Phone",
      id: "customer-phone",
      accessorFn: (row) => row.customer?.phone ?? "-",
    },
    {
      header: "Customer Address",
      id: "customer-address",
      accessorFn: (row) => {
        const c = row.customer
        if (!c) return "-"
        const parts = [c.address, c.city, c.postalCode].filter(Boolean)
        return parts.join(", ") || "-"
      },
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.original.status === "shipped" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      header: "Status Update",
      id: "status-update",
      cell: ({ row }) => {
        const id = row.original.id
        const current = row.original.status ?? ""
        const selected = selectedStatusById[id] ?? ""

        return (
          <div className="flex gap-2 items-center">
            <select
              aria-label={`Select status for ${id}`}
              value={selected}
              onChange={(e) => setSelectedStatusById((prev) => ({ ...prev, [id]: e.target.value }))}
              className="rounded-md border px-2 py-1 text-sm"
              disabled={loadingId === id}
            >
              <option value="">-- set status --</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus(id)}
              disabled={loadingId === id || !selected || selected.toLowerCase() === current.toLowerCase()}
            >
              {loadingId === id ? "Updating..." : "Update"}
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: finalData,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 50 } },
  })

  if (loading) return <p className="p-4">Loading orders...</p>

  return (
    <div className="w-full">
      <Toaster position="top-right" />
      <div className="flex flex-wrap justify-between items-center gap-4 py-4">
       <Input
  placeholder="Search by order id, city.."
  value={globalFilter}
  onChange={(e) => setGlobalFilter(e.target.value)}
  className="max-w-sm"
/>


        <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
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
            {['all', 'today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'].map((option) => (
              <DropdownMenuItem key={option} onClick={() => setDateFilter(option as any)}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  )
}
