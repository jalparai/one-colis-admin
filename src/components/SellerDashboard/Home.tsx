"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import {
  IconPackage,
  IconShoppingBag,
  IconTruckDelivery,
  IconLoader2,
  IconTicket,
  IconArrowUpRight,
  IconArrowDownRight,
  IconRotate2,
  IconMapPin,
  IconTrendingUp,
  IconSearch,
  IconX,
  IconFile,
} from "@tabler/icons-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { AddTicket } from "./SupportTickets/AddTicket"
import { AddOrder } from "./Orders/AddOrder"
import { AddReadyOrder } from "./Orders/QuickOrder"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { RevenueCard } from "./revenue-card"

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

export function HomeDashboard() {
  // raw data
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [totalStocks, setTotalStocks] = useState<number | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // UI states
  const [openAddOrder, setOpenAddOrder] = useState(false)
  const [openAddReadyOrder, setOpenAddReadyOrder] = useState(false)
  const [openAddTicket, setOpenAddTicket] = useState(false)
  const [sellerRevenue, setSellerRevenue] = useState<any | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month"
  >("all")

  // delivery & collection (API)
  const [deliveryCollection, setDeliveryCollection] = useState<any | null>(null)

  // derived counts
  const [processingOrders, setProcessingOrders] = useState<number>(0)
  const [pendingOrders, setPendingOrders] = useState<number>(0)
  const [readyOrders, setReadyOrders] = useState<number>(0)
  const [returnOrders, setReturnOrders] = useState<number>(0)
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0)
  const [pickupOrders, setPickupOrders] = useState<number>(0)
  const [cancelledOrders, setCancelledOrders] = useState<number>(0)
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [newOrdersToday, setNewOrdersToday] = useState<number | null>(null)
  const [totalQuantity, setTotalQuantity] = useState<number | null>(null)
  const [stocks, setStocks] = useState<any[]>([]) // <-- add this

  // color palette for pie
  const COLORS = ["#60a5fa", "#facc15", "#34d399", "#f87171", "#a78bfa", "#fb923c"]

  // ---------- helpers ----------
  const parseDate = (d?: string | number) => {
    if (!d) return null
    const parsed = new Date(d)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
  }

  const startOfWeek = (d: Date) => {
    const copy = new Date(d)
    const day = copy.getDay()
    copy.setDate(copy.getDate() - day)
    copy.setHours(0, 0, 0, 0)
    return copy
  }

  const inRange = (d?: string | number, rangeKey?: typeof dateFilter) => {
    if (!d) return false
    const dt = parseDate(d)
    if (!dt) return false

    // If a custom from/to date range is set, it takes precedence over the preset dateFilter
    if (fromDate || toDate) {
      let from = fromDate ? parseDate(fromDate) : null
      let to = toDate ? parseDate(toDate) : null
      if (from) from.setHours(0, 0, 0, 0)
      if (to) to.setHours(23, 59, 59, 999)
      if (from && to) return dt >= from && dt <= to
      if (from) return dt >= from
      if (to) return dt <= to
      return true
    }

    const nowLocal = new Date()

    switch (rangeKey) {
      case "today":
        return dt.toDateString() === nowLocal.toDateString()
      case "yesterday": {
        const diffDays = Math.floor((nowLocal.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays === 1
      }
      case "this_week":
        return startOfWeek(dt).toDateString() === startOfWeek(nowLocal).toDateString()
      case "last_week": {
        const lastWeek = new Date(nowLocal)
        lastWeek.setDate(nowLocal.getDate() - 7)
        return startOfWeek(dt).toDateString() === startOfWeek(lastWeek).toDateString()
      }
      case "this_month":
        return dt.getMonth() === nowLocal.getMonth() && dt.getFullYear() === nowLocal.getFullYear()
      case "last_month": {
        const prevMonth = new Date(nowLocal)
        prevMonth.setMonth(nowLocal.getMonth() - 1)
        return dt.getMonth() === prevMonth.getMonth() && dt.getFullYear() === prevMonth.getFullYear()
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

  // ---------- fetch logic ----------
  const fetchRevenueData = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/revenue", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data && Array.isArray(res.data)) setRevenueData(res.data)
      else if (res.data && res.data.data) setRevenueData(res.data.data)
    } catch (err) {
      console.error("Error fetching revenue data:", err)
      setRevenueData([
        { month: "Jan", revenue: 4000, profit: 2400 },
        { month: "Feb", revenue: 3000, profit: 1398 },
        { month: "Mar", revenue: 2000, profit: 9800 },
        { month: "Apr", revenue: 2780, profit: 3908 },
        { month: "May", revenue: 1890, profit: 4800 },
        { month: "Jun", revenue: 2390, profit: 3800 },
      ])
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
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

      // stocks
      // ----- stocks (safe normalization + totals) -----
      // ----- stocks (safe normalization, store in state; totals computed from filteredStocks) -----
      const stocksPayload = stocksRes.data?.data || stocksRes.data || []

      const safeStocks = Array.isArray(stocksPayload)
        ? stocksPayload.map((item: any) => {
          const n = Number(item?.quantity)
          const qty = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
          return { ...item, quantity: qty }
        })
        : []

      setStocks(safeStocks)

      // total units (sum of sanitized quantities)
      const totalQty = safeStocks.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)

      // number of SKUs that actually have units (> 0)
      const totalSkusInStock = safeStocks.filter((item: any) => (item.quantity || 0) > 0).length

      setTotalQuantity(totalQty)
      setTotalStocks(totalSkusInStock)




      const orders = (ordersRes.data && (ordersRes.data.data || ordersRes.data)) || []
      const ordersArray = Array.isArray(orders) ? orders : []
      setAllOrders(ordersArray)

      // set a fallback totalOrders (before filtering)
      setTotalOrders(ordersArray.length)
    } catch (err) {
      console.error("Error loading dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSellerRevenue = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/seller-revenue", {
        headers: { Authorization: `Bearer ${token}` },
      })
      // API returns object with totalRevenue, totalOrders, netProfit, breakdowns, etc.
      setSellerRevenue(res.data || null)
    } catch (err) {
      console.error("Error fetching seller revenue:", err)
      setSellerRevenue(null)
    }
  }, [])

  const fetchDeliveryCollection = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/stats/delivery-collection", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeliveryCollection(res.data?.data || null)
    } catch (err) {
      console.error("Error fetching delivery & collection:", err)
      setDeliveryCollection(null)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchRevenueData()
    fetchSellerRevenue()
    fetchDeliveryCollection()
  }, [fetchData, fetchRevenueData, fetchSellerRevenue, fetchDeliveryCollection])

  // ---------- filtering derived state ----------
  const filteredOrders = useMemo(() => {
    if (!allOrders || allOrders.length === 0) return []

    return allOrders.filter((order) => {
      // apply date range filter (use preset dateFilter unless overridden by from/to)
      if (!inRange(order.createdAt, dateFilter)) return false
      // apply search filter
      const query = searchQuery.trim().toLowerCase()
      if (!query) return true
      const status = (order.status || "").toString().toLowerCase()
      const id = (order.id || "").toString().toLowerCase()
      const textMatch = status.includes(query) || id.includes(query) || JSON.stringify(order).toLowerCase().includes(query)
      return textMatch
    })
  }, [allOrders, dateFilter, searchQuery, fromDate, toDate])

  useEffect(() => {
    // compute counts from filtered set
    const filtered = filteredOrders

    const countBy = (s: string) => filtered.filter((o) => (o.status || "").toLowerCase() === s).length

    setProcessingOrders(countBy("processing"))
    setPendingOrders(countBy("pending"))
    setReadyOrders(countBy("ready"))
    setReturnOrders(countBy("returned"))
    setDeliveredOrders(countBy("delivered"))
    setPickupOrders(countBy("pickup"))
    // cancelled may be spelled 'cancelled' or 'canceled' in source data, handle both
    const cancelledCount = filtered.filter((o) => ["cancelled", "canceled"].includes(((o.status || "").toLowerCase()))).length
    setCancelledOrders(cancelledCount)
    setTotalOrders(filtered.length)
    setNewOrdersToday(countToday(filtered, "createdAt"))
  }, [filteredOrders])

  // ---------- revenue filtering: compute revenue from filtered orders when dateFilter != 'all' ----------
  const totalRevenueFromFilteredOrders = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return 0

    return filteredOrders
      .filter((o) => (o.status || "").toLowerCase() === "delivered")
      .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0)
  }, [filteredOrders])
  const netFromFilteredOrders = useMemo(() => {
    const noFilters =
      dateFilter === "all" &&
      !fromDate &&
      !toDate &&
      (!searchQuery || searchQuery.trim() === "");

    // Use API net when unfiltered
    if (noFilters && sellerRevenue?.netProfit != null) {
      return Number(sellerRevenue.netProfit) || 0;
    }

    // Delivered orders only
    const delivered = (filteredOrders || []).filter(
      (o) => (o.status || "").toLowerCase() === "delivered"
    );

    if (delivered.length === 0) return 0;

    // Estimate net using API margin
    if (
      sellerRevenue?.totalRevenue != null &&
      sellerRevenue?.netProfit != null &&
      Number(sellerRevenue.totalRevenue) > 0
    ) {
      const margin =
        Number(sellerRevenue.netProfit) /
        Number(sellerRevenue.totalRevenue);

      const estimatedNet =
        (Number(totalRevenueFromFilteredOrders) || 0) * margin;

      return Number.isFinite(estimatedNet) ? estimatedNet : 0;
    }

    return 0;
  }, [
    filteredOrders,
    totalRevenueFromFilteredOrders,
    sellerRevenue,
    dateFilter,
    fromDate,
    toDate,
    searchQuery,
  ]);
  // whether there are any active filters (same rule used elsewhere)
  const noFiltersApplied =
    dateFilter === "all" &&
    !fromDate &&
    !toDate &&
    (!searchQuery || searchQuery.trim() === "");

  const deliveredOrdersCount = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return 0
    return filteredOrders.filter((o) => (o.status || "").toLowerCase() === "delivered").length
  }, [filteredOrders])

  // stocks filtered by same logic as orders (date range takes precedence) + search by sku/name
  const filteredStocks = useMemo(() => {
    if (!stocks || stocks.length === 0) return []

    const q = searchQuery?.trim().toLowerCase() ?? ""

    return stocks.filter((item: any) => {
      // date filter (uses inRange which respects fromDate/toDate)
      if (!inRange(item.createdAt, dateFilter)) return false

      // search filter: match sku or name if query present
      if (!q) return true
      const sku = (item.sku ?? "").toString().toLowerCase()
      const name = (item.name ?? "").toString().toLowerCase()
      return sku.includes(q) || name.includes(q) || JSON.stringify(item).toLowerCase().includes(q)
    })
  }, [stocks, dateFilter, fromDate, toDate, searchQuery])
  useEffect(() => {
    if (!filteredStocks || filteredStocks.length === 0) {
      setTotalQuantity(0)
      setTotalStocks(0)
      return
    }

    const totalQty = filteredStocks.reduce((sum: number, it: any) => {
      const n = Number(it?.quantity)
      const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
      return sum + safe
    }, 0)

    // count SKUs with quantity > 0 (or use filteredStocks.length if you want to count rows regardless)
    const totalSkusInStock = filteredStocks.filter((it: any) => (Number(it?.quantity) || 0) > 0).length

    setTotalQuantity(totalQty)
    setTotalStocks(totalSkusInStock)
  }, [filteredStocks])

  // ---------- compute delivery/collection from filteredOrders so the card respects the same filter ----------
  const deliverySummaryFromFiltered = useMemo(() => {
    const keys = ["pending", "processing", "shipped", "delivered", "cancelled", "ready"]
    const init: Record<string, { count: number; totalAmount: number }> = {}
    keys.forEach((k) => (init[k] = { count: 0, totalAmount: 0 }))

    for (const o of filteredOrders) {
      const s = (o.status || "").toLowerCase()
      // try to map common synonyms
      const mapKey = keys.includes(s) ? s : s === "returned" ? "cancelled" : s
      if (!init[mapKey]) continue
      init[mapKey].count += 1
      init[mapKey].totalAmount += Number(o.totalAmount || 0)
    }

    return init
  }, [filteredOrders])

  // helper to pick between API summary (all-time) and filtered summary
  const useFilteredView = dateFilter !== "all" || fromDate || toDate || searchQuery.trim() !== ""
  const displayedDeliverySummary = useFilteredView ? deliverySummaryFromFiltered : deliveryCollection?.statusSummary ?? null

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
    { name: "Cancelled", value: cancelledOrders },
  ]

  const chartData = [
    { status: "Processing", count: processingOrders },
    { status: "Pending", count: pendingOrders },
    { status: "Ready", count: readyOrders },
    { status: "Delivered", count: deliveredOrders },
    { status: "Returned", count: returnOrders },
    { status: "Pickup", count: pickupOrders },
    { status: "Cancelled", count: cancelledOrders },
  ]

  // ---------- Quick actions array ----------
  const quickActions = [
    {
      title: "Create New Order Based on Stock",
      icon: IconShoppingBag,
      color: "text-blue-600",
      link: "/en/seller",
      bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
      action: () => setOpenAddOrder(true),
    },
    {
      title: "Create New Ready Order",
      icon: IconShoppingBag,
      color: "text-blue-600",
      bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
      action: () => setOpenAddReadyOrder(true),
    },
    {
      title: "Create Support Ticket",
      icon: IconTicket,
      color: "text-green-600",
      bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
      action: () => setOpenAddTicket(true),
    },
    {
      title: "Invoices",
      icon: IconFile,
      color: "text-green-600",
      bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
      link: "/en/seller/Invoices",
    },
    {
      title: "My Pickups",
      icon: IconFile,
      color: "text-orange-600",
      bg: "from-orange-50 to-orange-100 dark:from-green-900/20 dark:to-green-800/10",
      link: "/en/seller/My-Pickups",
    },
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
      cell: ({ row }) => (
        <div className="text-sm truncate max-w-xs">{row.original.customer?.address ?? "—"}</div>
      ),
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => <div>{Number(row.original.totalAmount || 0).toLocaleString()} DH</div>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status
        const statusLower = (status || "").toLowerCase()
        const color =
          statusLower === "delivered"
            ? "bg-green-100 text-green-800"
            : statusLower === "returned"
              ? "bg-red-100 text-red-800"
              : statusLower === "cancelled" || statusLower === "canceled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-700"
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>
      },
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleString()}</div>,
    },
  ]

  // recent orders (sorted desc) - used at bottom table instead of ready-only list
  const recentOrdersList = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sorted.slice(0, 50) // limit rows to 50 for performance
  }, [filteredOrders])

  const readyOrdersList = useMemo(
    () => filteredOrders.filter((o) => (o.status || "").toLowerCase() === "ready"),
    [filteredOrders]
  )

  const table = useReactTable({
    data: recentOrdersList,
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
  })



  // small helper for safe read of displayedDeliverySummary
  const readDisplayed = (key: string) => ({
    count: displayedDeliverySummary?.[key]?.count ?? 0,
    totalAmount: displayedDeliverySummary?.[key]?.totalAmount ?? 0,
  })
  const STATUS_COLORS: Record<string, string> = {
    pending: "#dab15f",        // Yellow
    confirmed: "#3b82f6",      // Blue
    shipped: "#8b5cf6",        // Purple
    delivered: "#22c55e",      // Green
    canceled: "#ef4444",       // Red (american spelling)
    cancelled: "#ef4444",      // Red (british spelling)
    returned: "#a855f7",       // Violet
    processing: "#06b6d4",     // Cyan
    default: "#9ca3af",        // Gray fallback
  };

  const [revenueReportData, setRevenueReportData] = useState<any | null>(null)
  const [loadingRevenueReport, setLoadingRevenueReport] = useState(false)

  const fetchRevenueReport = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    setLoadingRevenueReport(true)
    try {
      const params = new URLSearchParams()

      // Map frontend dateFilter to API filterType
      const filterTypeMap: Record<string, string> = {
        today: "today",
        yesterday: "yesterday",
        this_week: "thisWeek",
        last_week: "lastWeek",
        this_month: "thisMonth",
        last_month: "lastMonth",
      }

      const apiFilterType = filterTypeMap[dateFilter] || "custom"

      if (apiFilterType !== "custom") {
        params.append("filterType", apiFilterType)
      } else if (fromDate || toDate) {
        params.append("filterType", "custom")
        if (fromDate) params.append("startDate", fromDate)
        if (toDate) params.append("endDate", toDate)
      }

      params.append("interval", "daily")

      const res = await axios.get(
        `https://cod-ecommerce-two.vercel.app/api/seller/revenue/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setRevenueReportData(res.data)
    } catch (err) {
      console.error("Error fetching revenue report:", err)
      setRevenueReportData(null)
    } finally {
      setLoadingRevenueReport(false)
    }
  }, [dateFilter, fromDate, toDate])

  useEffect(() => {
    fetchRevenueReport()
  }, [fetchRevenueReport])


  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Quick Actions */}
      <Card className=":data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        <CardHeader className="items-center justify-between">
          <CardTitle className="mb-2">Quick Actions</CardTitle>

          {/* search + date filter */}
          <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
            <input
              className="px-3 py-1 rounded-md border bg-white"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search orders"
            />

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any)
                // clear manual from/to when using preset filters
                setFromDate(null)
                setToDate(null)
              }}
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
            </select>

            <div className="flex items-center gap-2">
              <label className="text-sm">From:</label>
              <input
                type="date"
                value={fromDate ?? ""}
                onChange={(e) => {
                  setFromDate(e.target.value || null)
                  // when using manual range, clear preset filter
                  if (e.target.value) setDateFilter('all')
                }}
                className="px-3 py-1 rounded-md border bg-white"
                aria-label="From date"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">To:</label>
              <input
                type="date"
                value={toDate ?? ""}
                onChange={(e) => {
                  setToDate(e.target.value || null)
                  if (e.target.value) setDateFilter('all')
                }}
                className="px-3 py-1 rounded-md border bg-white"
                aria-label="To date"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setFromDate(null)
                setToDate(null)
                setDateFilter('all')
              }}
              className="px-3 py-1 rounded-md border bg-white text-sm"
            >
              Clear
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {quickActions.map((act, i) => {
              const CardIcon = act.icon!
              const cardClasses = `group border border-gray-200/40 dark:border-gray-800/40 bg-gradient-to-br ${act.bg} rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer`

              // modal opener
              if (act.action) {
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        act.action && act.action()
                      }
                    }}
                    onClick={() => act.action && act.action()}
                    className={cardClasses}
                  >
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{act.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Open form →</p>
                      </div>
                      <CardIcon className={`h-7 w-7 ${act.color} group-hover:scale-110 transition-transform`} />
                    </CardContent>
                  </div>
                )
              }

              // navigation-only
              return (
                <Link key={i} href={act.link ?? "#"}>
                  <div className={cardClasses}>
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{act.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Open →</p>
                      </div>
                      <CardIcon className={`h-7 w-7 ${act.color} group-hover:scale-110 transition-transform`} />
                    </CardContent>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>

        {/* Modals */}
        <AddOrder
          open={openAddOrder}
          onOpenChange={setOpenAddOrder}
          onOrderAdded={() => {
            setOpenAddOrder(false)
            fetchData()
            toast.success("Order added successfully!")
          }}
        />
        {openAddReadyOrder && (
          <AddReadyOrder
            open={openAddReadyOrder}
            onOpenChange={setOpenAddReadyOrder}
            onOrderAdded={() => {
              setOpenAddReadyOrder(false)
              fetchData()
              toast.success("Ready order added successfully!")
            }}
          />
        )}

        <AddTicket
          open={openAddTicket}
          onOpenChange={setOpenAddTicket}
          onTicketAdded={() => {
            setOpenAddTicket(false)
            fetchData()
          }}
        />
      </Card>

      {/* Stats grid */}
      {/* added items-stretch so children with h-full will be equal height */}
      <div className="grid grid-cols-1 gap-6 items-stretch @xl/main:grid-cols-4 @5xl/main:grid-cols-4">
        {/* Total Stocks */}
        {/* Total Stocks */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Products</CardTitle>
            </div>
            <IconPackage className="text-blue-500 h-6 w-6" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                {/* SKUs */}
                <div>
                  <div className="text-3xl font-semibold">
                    {loading ? "..." : (totalStocks ?? 0)}
                  </div>
                  {/* <div className="text-xs text-muted-foreground mt-1">stock</div> */}
                </div>

                {/* Units */}
                <div className="text-right">
                  <div className="text-xl font-semibold">
                    {loading ? "..." : (totalQuantity ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total Quanity</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                  <IconArrowUpRight className="h-4 w-4 text-green-500" />
                  <span>+{Math.round((totalStocks ?? 0) * 0.08 || 0)}% month</span>
                </div>
                <div className="text-xs">SKU & unit summary</div>
              </div>
            </div>

            <div className="mt-3">
              {/* Use totalQuantity for progress (or choose whichever metric fits) */}
              <ProgressBar value={totalQuantity ? Math.min(100, (totalQuantity % 100) as number) : 0} />
            </div>
          </CardContent>
        </Card>


        {/* Total Orders */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Orders</CardTitle>
            </div>
            <IconShoppingBag className="text-indigo-500 h-6 w-6" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{loading ? "..." : (totalOrders ?? 0)}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{newOrdersToday !== null ? `${newOrdersToday} new today` : "…"}</div>
                  <div className="text-xs mt-1">
                    {totalOrders ? `${percent(newOrdersToday ?? 0, totalOrders)}% today` : ""}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                  <IconArrowUpRight className="h-4 w-4 text-green-500" />
                  <span>+{totalOrders ? Math.round((totalOrders as number) * 0.12) : 0}% this week</span>
                </div>
                <div className="text-xs">Orders total</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar
                value={totalOrders ? Math.min(100, percent(newOrdersToday ?? 0, Math.max(1, totalOrders))) : 0}
              />
            </div>
          </CardContent>
        </Card>

        

        {/* Total Revenue */}
<Card className="hover:shadow-lg transition-all duration-200 h-full">
  <CardHeader className="flex items-center justify-between">
    <div>
      <CardTitle>Total Revenue</CardTitle>
    </div>
    <IconTrendingUp className="text-green-500 h-6 w-6" />
  </CardHeader>
  <CardContent className="flex-1 flex flex-col justify-between">
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-semibold">
          {loading || loadingRevenueReport
            ? "..."
            : Number(revenueReportData?.totals?.revenue || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
          DH
        </div>
        <div className="text-sm text-muted-foreground text-right">
          <div>{`${revenueReportData?.totals?.orderCount || 0} delivered`}</div>
          <div className="text-xs mt-1">
            {loadingRevenueReport
              ? "..."
              : `Net: ${Number(revenueReportData?.totals?.netRevenue || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} DH`}
          </div>
          {/* {(revenueReportData?.totals?.cityFees || 0) > 0 && (
            <div className="text-xs mt-1 text-orange-600">
              {`Fees: ${Number(revenueReportData.totals.cityFees).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} DH`}
            </div>
          )} */}
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
          <IconArrowUpRight className="h-4 w-4 text-green-500" />
          <span>{`Profit: ${Number(revenueReportData?.totals?.profit || 0).toFixed(2)} DH`}</span>
        </div>
        <div className="text-xs">
          {revenueReportData?.totals?.profitRatio
            ? `${Number(revenueReportData.totals.profitRatio).toFixed(1)}% margin`
            : "Revenue"}
        </div>
      </div>

      {/* Cities Delivered Breakdown */}
      {/* {revenueReportData?.citiesDelivered && revenueReportData.citiesDelivered.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-semibold mb-2">Cities Delivered:</div>
          <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
            {revenueReportData.citiesDelivered.map((city: any, idx: number) => (
              <div key={idx} className="text-xs">
                <div className="font-medium">{city.city}</div>
                <div className="text-muted-foreground">
                  {city.orderCount} orders • {city.totalFees.toFixed(2)} DH
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>

    <div className="mt-3">
      <ProgressBar
        value={Math.min(100, (Number(revenueReportData?.totals?.revenue || 0) % 100))}
      />
    </div>
  </CardContent>
</Card>

        {/* Processing */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Orders</CardTitle>
            </div>
            <IconLoader2 className="text-yellow-500 h-6 w-6" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{processingOrders}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{totalOrders ? `${percent(processingOrders, totalOrders)}% of orders` : "—"}</div>
                  <div className="text-xs mt-1">Avg handling time: 1.2h</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                  <IconArrowDownRight className="h-4 w-4 text-rose-500" />
                  <span>-{processingOrders ? Math.round(processingOrders * 0.05) : 0} since last week</span>
                </div>
                <div className="text-xs">Fulfillment</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(processingOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Ready */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Ready Orders</CardTitle>
            </div>
            <IconTruckDelivery className="text-green-500 h-6 w-6" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{readyOrders}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{readyOrders ? `${percent(readyOrders, Math.max(1, totalOrders ?? 1))}% ready` : "—"}</div>
                  <div className="text-xs mt-1">
                    {readyOrders > 0 ? `${Math.max(1, Math.round(readyOrders * 0.1))} to ship` : "No shipments"}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                  <IconArrowUpRight className="h-4 w-4 text-green-500" />
                  <span>+{readyOrders ? Math.round(readyOrders * 0.03) : 0} new today</span>
                </div>
                <div className="text-xs">Dispatch queue</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(readyOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Orders</CardTitle>
            </div>
            <IconLoader2 className="text-orange-500 h-6 w-6" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{pendingOrders}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{totalOrders ? `${percent(pendingOrders, totalOrders)}% of orders` : "—"}</div>
                  <div className="text-xs mt-1">Awaiting action</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(pendingOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>


        {/* Delivered */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Delivered Orders</CardTitle>
            </div>
            <IconTruckDelivery className="text-emerald-500 h-6 w-6" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{deliveredOrders}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{totalOrders ? `${percent(deliveredOrders, totalOrders)}% delivered` : "—"}</div>
                  <div className="text-xs mt-1">Success rate</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(deliveredOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Returned */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Return Orders</CardTitle>
            </div>
            <IconRotate2 className="text-red-500 h-6 w-6" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{returnOrders}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{totalOrders ? `${percent(returnOrders, totalOrders)}% returns` : "—"}</div>
                  <div className="text-xs mt-1">Return rate</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(returnOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Pickup */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Pickup Orders</CardTitle>
            </div>
            <IconMapPin className="text-purple-500 h-6 w-6" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold">{pickupOrders}</div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{totalOrders ? `${percent(pickupOrders, totalOrders)}% for pickup` : "—"}</div>
                  <div className="text-xs mt-1">Ready to collect</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(pickupOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* --- Delivery & Cash Collection (now respects filters) --- */}
        <Card className="hover:shadow-lg transition-all duration-200 h-full">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Delivery & Cash Collection</CardTitle>
            </div>
            <IconFile className="text-sky-500 h-6 w-6" />
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            {/* status summary: use displayedDeliverySummary which picks filtered view when filters applied */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                {['pending', 'processing', 'shipped', 'delivered', 'ready', 'cancelled'].map((k) => {
                  const item = readDisplayed(k)
                  return (
                    <div key={k} className="text-sm">
                      <div className="text-xs text-muted-foreground">{k.charAt(0).toUpperCase() + k.slice(1)}</div>
                      <div className="flex gap-2 items-center">
                        <div className="text-lg font-semibold">{displayedDeliverySummary ? item.count : '...'}</div>
                        <div className="text-xs text-muted-foreground">{displayedDeliverySummary ? Number(item.totalAmount).toLocaleString() : ''} DH</div>

                      </div>

                    </div>
                  )
                })}
              </div>




            </div>

          </CardContent>
        </Card>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-2">
        <Card className="h-[320px]">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label
                >
                  {orderData.map((item, idx) => (
                    <Cell
                      key={idx}
                      fill={STATUS_COLORS[item.name?.toLowerCase()] || STATUS_COLORS.default}
                    />
                  ))}
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[320px]">
          <CardHeader>
            <CardTitle>Order Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`bar-${idx}`}
                      fill={
                        STATUS_COLORS[entry.status?.toLowerCase()] || STATUS_COLORS.default
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders table or empty state */}
      {recentOrdersList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center text-gray-500 py-10">No recent orders match the selected filter.</CardContent>
        </Card>
      )}

    </div>
  )
}
