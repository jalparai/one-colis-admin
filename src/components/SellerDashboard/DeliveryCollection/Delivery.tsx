"use client"

import * as React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"

import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import toast from "react-hot-toast"
import {
  IconPackage,
  IconShoppingBag,
  IconTicket,
  IconFile,
} from "@tabler/icons-react"

import Link from "next/link"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

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
  updatedAt: string,
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

export function DeliveryCollectionTable() {
  // ----------- ALL HOOKS AT THE TOP (important) -----------
  const [statusSummary, setStatusSummary] = useState<any>({})
  const [collection, setCollection] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // raw data
  const [allOrders, setAllOrders] = useState<Order[]>([])

  // UI states
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "custom"
  >("all")

  // custom range fields
  const [startDate, setStartDate] = useState<string | null>(null) // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string | null>(null)

  // derived counts
  const [processingOrders, setProcessingOrders] = useState<number>(0)
  const [pendingOrders, setPendingOrders] = useState<number>(0)
  const [readyOrders, setReadyOrders] = useState<number>(0)
  const [returnOrders, setReturnOrders] = useState<number>(0)
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0)
  const [pickupOrders, setPickupOrders] = useState<number>(0)

  // ---------- fetch stats (delivery/collection) ----------
  const fetchStats = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/seller/stats/delivery-collection",
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setStatusSummary(res.data?.data?.statusSummary || {})
      setCollection(res.data?.data?.collection || {})
    } catch (err) {
      console.error("❌ Error fetching delivery/collection stats:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // ---------- helpers ----------
  const parseDate = (d?: string | number | null) => {
    if (!d) return null
    const parsed = new Date(d)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }

  // check if a date is in the selected preset/range
  const inRange = (d?: string | number | null, rangeKey?: typeof dateFilter) => {
    if (!d) return false
    const dt = parseDate(d)
    if (!dt) return false

    const now = new Date()
    const todayStr = now.toDateString()

    switch (rangeKey) {
      case "all":
        return true
      case "today":
        return dt.toDateString() === todayStr
      case "yesterday": {
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        return dt.toDateString() === yesterday.toDateString()
      }
      case "this_week": {
        const startOfWeek = (x: Date) => {
          const c = new Date(x)
          const day = c.getDay()
          c.setDate(c.getDate() - day)
          c.setHours(0, 0, 0, 0)
          return c
        }
        return dt >= startOfWeek(now)
      }
      case "last_week": {
        const startOfWeek = (x: Date) => {
          const c = new Date(x)
          const day = c.getDay()
          c.setDate(c.getDate() - day)
          c.setHours(0, 0, 0, 0)
          return c
        }
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(now.getDate() - 7)
        return dt >= startOfWeek(lastWeekStart) && dt < startOfWeek(now)
      }
      case "this_month":
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
      case "last_month": {
        const prev = new Date(now)
        prev.setMonth(now.getMonth() - 1)
        return dt.getMonth() === prev.getMonth() && dt.getFullYear() === prev.getFullYear()
      }
      case "custom": {
        // when using custom range, check against startDate & endDate (inclusive)
        if (!startDate && !endDate) return true
        const start = startDate ? parseDate(startDate + "T00:00:00") : null
        const end = endDate ? parseDate(endDate + "T23:59:59") : null
        if (start && end) return dt >= start && dt <= end
        if (start) return dt >= start
        if (end) return dt <= end
        return true
      }
      default:
        return true
    }
  }

  const countToday = (items: any[], dateField = "createdAt") => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    return items.filter((it) => {
      const d = parseDate(it[dateField])
      return d !== null && d >= start
    }).length
  }

  // ---------- fetch main data (stocks/orders) ----------
  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const [stocksRes, ordersRes] = await Promise.all([
        axios.get("https://cod-ecommerce-two.vercel.app/api/seller/seller/stock", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://cod-ecommerce-two.vercel.app/api/seller/getMyOrders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const orders = (ordersRes.data && (ordersRes.data.data || ordersRes.data)) || []
      const ordersArray = Array.isArray(orders) ? orders : []
      setAllOrders(ordersArray)
    } catch (err) {
      console.error("Error loading dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // wrappers for child modals (kept for parity)
  const fetchOrders = useCallback(async () => {
    await fetchData()
    toast.success("Orders refreshed")
  }, [fetchData])

  const fetchTickets = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // ---------- filtering / derived lists ----------
  const filteredOrders = useMemo(() => {
    if (!allOrders || allOrders.length === 0) return []

    return allOrders.filter((order) => {
      return inRange(order.createdAt, dateFilter)
    })
  }, [allOrders, dateFilter, startDate, endDate])

  const readyOrdersList = useMemo(() => filteredOrders.filter((o) => (o.status || "").toLowerCase() === "ready"), [filteredOrders])

  // ---------- derived counts effect ----------
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = allOrders.filter((o) => {
      const status = (o.status || "").toString().toLowerCase()
      const id = (o.id || "").toString().toLowerCase()
      const textMatch = !query || status.includes(query) || id.includes(query) || JSON.stringify(o).toLowerCase().includes(query)
      const dateMatch = dateFilter === "all" ? true : inRange(o.createdAt, dateFilter)
      return textMatch && dateMatch
    })

    const countBy = (s: string) => filtered.filter((o) => (o.status || "").toLowerCase() === s).length

    setProcessingOrders(countBy("processing"))
    setPendingOrders(countBy("pending"))
    setReadyOrders(countBy("ready"))
    setReturnOrders(countBy("returned"))
    setDeliveredOrders(countBy("delivered"))
    setPickupOrders(countBy("pickup"))
  }, [allOrders, searchQuery, dateFilter, startDate, endDate])

  // ---------- small UI helpers ----------
  const percent = (part: number, total: number) => {
    if (!total || total <= 0) return 0
    return Math.round((part / total) * 100)
  }

  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: "linear-gradient(90deg,#60a5fa,#34d399)" }}
      />
    </div>
  )

  // chart data & orderData for pie/bar
  const orderData = [
    { name: "Processing", value: processingOrders },
    { name: "Pending", value: pendingOrders },
    { name: "Ready", value: readyOrders },
    { name: "Delivered", value: deliveredOrders },
    { name: "Returned", value: returnOrders },
    { name: "Pickup", value: pickupOrders },
  ]

  const chartData = [
    { status: "Processing", count: processingOrders },
    { status: "Pending", count: pendingOrders },
    { status: "Ready", count: readyOrders },
    { status: "Delivered", count: deliveredOrders },
    { status: "Returned", count: returnOrders },
    { status: "Pickup", count: pickupOrders },
  ]

  const orderColumns: ColumnDef<Order>[] = [
    {
      header: "Customer",
      id: "customer_group",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.customer?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{row.original.customer?.phone ?? "—"}</div>
        </div>
      ),
    },
    {
      header: "Address",
      id: "customer_address",
      cell: ({ row }) => <div className="text-sm truncate max-w-xs">{row.original.customer?.address ?? "—"}</div>,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => <div>DH {row.original.totalAmount?.toLocaleString?.() ?? "0"}</div>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status
        const color =
          status === "Delivered" ? "bg-green-100 text-green-800" : status === "Returned" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>
      },
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => <div>{row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—"}</div>,
    },
  ]

  const table = useReactTable({
    data: readyOrdersList,
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  // ---------- RENDER ----------
  if (loading) return <p className="p-4">Loading delivery & collection stats...</p>

  return (
    <div className="w-full space-y-6">
      {/* Controls: preset date selector + custom range */}
    
      {/* Delivery Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(statusSummary).map(([status, values]: any) => (
                <TableRow key={status}>
                  <TableCell className="capitalize">{status}</TableCell>
                  <TableCell>{values.count}</TableCell>
                  <TableCell>${values.totalAmount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Filter Orders</CardTitle>
          <div className="flex items-center gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1 rounded-md border bg-white"
              aria-label="Filter date range"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>

            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate ?? ""}
                  onChange={(e) => setStartDate(e.target.value || null)}
                  className="px-2 py-1 rounded-md border bg-white"
                />
                <span className="text-sm">—</span>
                <input
                  type="date"
                  value={endDate ?? ""}
                  onChange={(e) => setEndDate(e.target.value || null)}
                  className="px-2 py-1 rounded-md border bg-white"
                />
                <button
                  onClick={() => {
                    // if user picks custom, we already set start/end; trigger a "refresh" by updating a state (dateFilter already custom)
                    // we don't need extra action — the useMemo will re-run because startDate/endDate are dependencies.
                    toast.success("Applied custom date range")
                  }}
                  className="ml-2 px-3 py-1 rounded-md bg-slate-800 text-white text-sm"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setDateFilter("all")
                    setStartDate(null)
                    setEndDate(null)
                  }}
                  className="ml-2 px-3 py-1 rounded-md border text-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        
      </Card>

      {readyOrdersList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ready Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center text-gray-500 py-10">No ready orders match the selected filter.</CardContent>
        </Card>
      )}
    </div>
  )
}
