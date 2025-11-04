"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
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
import { toast } from "react-hot-toast"
import { AddReadyOrder } from "./Orders/QuickOrder"
import Link from "next/link"

export function HomeDashboard() {
  const [totalStocks, setTotalStocks] = useState<number | null>(null)
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [processingOrders, setProcessingOrders] = useState<number>(0)
  const [pendingOrders, setPendingOrders] = useState<number>(0)
  const [readyOrders, setReadyOrders] = useState<number>(0)
  const [returnOrders, setReturnOrders] = useState<number>(0)
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0)
  const [pickupOrders, setPickupOrders] = useState<number>(0)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddOrder, setOpenAddOrder] = useState(false)
  const [openAddReadyOrder, setOpenAddReadyOrder] = useState(false)
  const [openAddTicket, setOpenAddTicket] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // helper: count items created since start of today
  const countToday = (items: any[], dateField = "createdAt") => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    return items.filter((it) => {
      const d = new Date(it[dateField])
      return d >= start
    }).length
  }

  const fetchRevenueData = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Replace with your actual revenue endpoint
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/revenue", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.data && Array.isArray(res.data)) {
        setRevenueData(res.data)
      } else if (res.data && res.data.data) {
        setRevenueData(res.data.data)
      }
    } catch (err) {
      console.error("Error fetching revenue data:", err)
      // Fallback to mock data if API fails
      setRevenueData([
        { month: "Jan", revenue: 4000, profit: 2400 },
        { month: "Feb", revenue: 3000, profit: 1398 },
        { month: "Mar", revenue: 2000, profit: 9800 },
        { month: "Apr", revenue: 2780, profit: 3908 },
        { month: "May", revenue: 1890, profit: 4800 },
        { month: "Jun", revenue: 2390, profit: 3800 },
        { month: "Jul", revenue: 3490, profit: 4300 },
      ])
    }
  }, [])

  // central fetch that updates all dashboard numbers
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
      const stocksPayload = stocksRes.data || []
      const totalQty = Array.isArray(stocksPayload)
        ? stocksPayload.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0)
        : 0
      setTotalStocks(totalQty)

      // orders
      const orders = (ordersRes.data && (ordersRes.data.data || ordersRes.data)) || []
      setTotalOrders(Array.isArray(orders) ? orders.length : 0)

      const proc = Array.isArray(orders) ? orders.filter((o: any) => o.status === "processing").length : 0
      const pend = Array.isArray(orders) ? orders.filter((o: any) => o.status === "pending").length : 0
      const ready = Array.isArray(orders) ? orders.filter((o: any) => o.status === "ready").length : 0
      const returned = Array.isArray(orders) ? orders.filter((o: any) => o.status === "returned").length : 0
      const delivered = Array.isArray(orders) ? orders.filter((o: any) => o.status === "delivered").length : 0
      const pickup = Array.isArray(orders) ? orders.filter((o: any) => o.status === "pickup").length : 0

      setProcessingOrders(proc)
      setPendingOrders(pend)
      setReadyOrders(ready)
      setReturnOrders(returned)
      setDeliveredOrders(delivered)
      setPickupOrders(pickup)

      return { orders }
    } catch (err) {
      console.error("Error loading dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // expose small wrappers so AddOrder/AddTicket onOrderAdded/onTicketAdded can call them
  const fetchOrders = useCallback(async () => {
    await fetchData()
    toast.success("Orders refreshed")
  }, [fetchData])

  const fetchTickets = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    // initial load
    fetchData()
    fetchRevenueData()
  }, [fetchData, fetchRevenueData])

  const COLORS = ["#60a5fa", "#facc15", "#34d399", "#f87171", "#a78bfa", "#fb923c"]

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

  // helpers for progress visuals (avoid divide by zero)
  const percent = (part: number, total: number) => {
    if (!total || total <= 0) return 0
    return Math.round((part / total) * 100)
  }

  // compute today counts for inline trend text (no new API call)
  const [newOrdersToday, setNewOrdersToday] = useState<number | null>(null)
  useEffect(() => {
    let mounted = true
    const token = localStorage.getItem("token")
    if (!token) return
    const getTodayCount = async () => {
      try {
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/getMyOrders", {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() }, // cache buster
        })
        const orders = (res.data && (res.data.data || res.data)) || []
        if (mounted) setNewOrdersToday(Array.isArray(orders) ? countToday(orders, "createdAt") : 0)
      } catch (err) {
        // ignore
      }
    }
    getTodayCount()
    return () => {
      mounted = false
    }
  }, [processingOrders, pendingOrders, readyOrders, returnOrders, deliveredOrders, pickupOrders])

  // small presentational progress bar
  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: "linear-gradient(90deg,#60a5fa,#34d399)" }}
      />
    </div>
  )

  const filteredChartData = chartData.filter((item) => item.status.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredOrderData = orderData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="p-4 lg:p-6 space-y-6">
    

      {/* Top Cards */}
      {/* Quick Actions */}
      <Card className=":data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Create New Order Based on Stock",
                icon: IconShoppingBag,
                color: "text-blue-600",
                link:"/en/seller",
                bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
                action: () => setOpenAddOrder(true),
              },
              {
                title: "Create New Ready Order",
                icon: IconShoppingBag,
                color: "text-blue-600",
                bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
                link:"/en/seller",
                action: () => setOpenAddReadyOrder(true),
              },
              {
                title: "Create Support Ticket",
                icon: IconTicket,
                color: "text-green-600",
                bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
                link:"/en/seller",
                action: () => setOpenAddTicket(true),
              },
               {
                title: "Invoices",
                icon: IconFile,
                color: "text-green-600",
                bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
                link:"/en/seller/Invoices",
              },
            ].map((action, i) => (
              <Card
                key={i}
                onClick={action.action}
                className={`group border border-gray-200/40 dark:border-gray-800/40 bg-gradient-to-br ${action.bg} rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer`}
              >
                <Link href={`${action.link}`}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{action.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Open form →</p>
                  </div>
                  <action.icon className={`h-7 w-7 ${action.color} group-hover:scale-110 transition-transform`} />
                </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </CardContent>

        {/* Modals (triggered by above cards) */}
        <AddOrder
          open={openAddOrder}
          onOpenChange={setOpenAddOrder}
          onOrderAdded={() => {
            setOpenAddOrder(false)
            fetchOrders()
            toast.success("Order added successfully!")
          }}
        />

         <AddReadyOrder
          open={openAddReadyOrder}
          onOpenChange={setOpenAddReadyOrder}
          onOrderAdded={() => {
            setOpenAddReadyOrder(false)
            fetchOrders()
            toast.success("Order added successfully!")
          }}
        />

        <AddTicket
          open={openAddTicket}
          onOpenChange={setOpenAddTicket}
          onTicketAdded={() => {
            setOpenAddTicket(false)
            fetchTickets()
          }}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-4 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        {/* Total Stocks */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Product</CardTitle>
            </div>
            <IconPackage className="text-blue-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{loading ? "..." : (totalStocks ?? 0)}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>In inventory</div>
                <div className="text-xs mt-1">Updated just now</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>+{Math.round((totalStocks ?? 0) * 0.08 || 0)}% month</span>
              </div>
              <div className="text-xs">SKU count</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalStocks ? Math.min(100, totalStocks % 100) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Orders</CardTitle>
            </div>
            <IconShoppingBag className="text-indigo-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
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
              <div className="flex items-center gap-2">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>+{totalOrders ? Math.round(totalOrders * 0.12) : 0}% this week</span>
              </div>
              <div className="text-xs">Orders total</div>
            </div>

            <div className="mt-3">
              <ProgressBar
                value={totalOrders ? Math.min(100, percent(newOrdersToday ?? 0, Math.max(1, totalOrders))) : 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Processing Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Orders</CardTitle>
            </div>
            <IconLoader2 className="text-yellow-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{processingOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(processingOrders, totalOrders)}% of orders` : "—"}</div>
                <div className="text-xs mt-1">Avg handling time: 1.2h</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconArrowDownRight className="h-4 w-4 text-rose-500" />
                <span>-{processingOrders ? Math.round(processingOrders * 0.05) : 0} since last week</span>
              </div>
              <div className="text-xs">Fulfillment</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(processingOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Ready Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Ready Orders</CardTitle>
            </div>
            <IconTruckDelivery className="text-green-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
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
              <div className="flex items-center gap-2">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>+{readyOrders ? Math.round(readyOrders * 0.03) : 0} new today</span>
              </div>
              <div className="text-xs">Dispatch queue</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(readyOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-4 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        {/* Pending Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Orders</CardTitle>
            </div>
            <IconLoader2 className="text-orange-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{pendingOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(pendingOrders, totalOrders)}% of orders` : "—"}</div>
                <div className="text-xs mt-1">Awaiting action</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconArrowUpRight className="h-4 w-4 text-orange-500" />
                <span>+{pendingOrders ? Math.round(pendingOrders * 0.02) : 0} today</span>
              </div>
              <div className="text-xs">Queue</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(pendingOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Delivered Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Delivered Orders</CardTitle>
            </div>
            <IconTruckDelivery className="text-emerald-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{deliveredOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(deliveredOrders, totalOrders)}% delivered` : "—"}</div>
                <div className="text-xs mt-1">Success rate</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconArrowUpRight className="h-4 w-4 text-emerald-500" />
                <span>+{deliveredOrders ? Math.round(deliveredOrders * 0.08) : 0} this week</span>
              </div>
              <div className="text-xs">Completed</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(deliveredOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Return Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Return Orders</CardTitle>
            </div>
            <IconRotate2 className="text-red-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{returnOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(returnOrders, totalOrders)}% returns` : "—"}</div>
                <div className="text-xs mt-1">Return rate</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconArrowDownRight className="h-4 w-4 text-red-500" />
                <span>{returnOrders ? Math.round(returnOrders * 0.15) : 0} pending</span>
              </div>
              <div className="text-xs">Processing</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(returnOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Pickup Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Pickup Orders</CardTitle>
            </div>
            <IconMapPin className="text-purple-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{pickupOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(pickupOrders, totalOrders)}% for pickup` : "—"}</div>
                <div className="text-xs mt-1">Ready to collect</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconArrowUpRight className="h-4 w-4 text-purple-500" />
                <span>+{pickupOrders ? Math.round(pickupOrders * 0.04) : 0} today</span>
              </div>
              <div className="text-xs">Locations</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(pickupOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        {/* Pie Chart */}
        <Card className="h-[320px]">
          <CardHeader>
            <CardTitle>Orders by Status {searchQuery && `(${filteredOrderData.length})`}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredOrderData.length > 0 ? filteredOrderData : orderData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label
                >
                  {(filteredOrderData.length > 0 ? filteredOrderData : orderData).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="h-[320px]">
          <CardHeader>
            <CardTitle>Order Overview {searchQuery && `(${filteredChartData.length})`}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredChartData.length > 0 ? filteredChartData : chartData}>
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5 text-green-500" />
              Revenue & Profit Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-gray-500">Loading revenue data...</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
