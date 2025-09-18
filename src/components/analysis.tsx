"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
interface DeliveredData {
  deliveredOrders: number
  returnedOrders: number
  ratio: string | null
}

interface CollectedData {
  collectedOrders: number
  pendingOrders: number
  ratio: string | null
}

interface AvgDelivery {
  orders: number
  city: string
  avgDeliveryHours: number
}

interface TopSeller {
  sellerName: string
  revenue: number
  orders: number
}

interface DashboardMetrics {
  delivered: DeliveredData
  collected: CollectedData
  avgDeliveryTime: AvgDelivery[]
  topSellers: TopSeller[]
  agentInfo: string
}

export default function Analyis() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Authentication token not found. Please log in to view dashboard.")
          setLoading(false)
          return
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        const [deliveredRes, collectedRes, avgDeliveryRes, topSellersRes, agentRes] = await Promise.all([
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getDeliveredVsReturnedRatio", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getAverageDeliveryTime", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getTopSellers", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getTopAgents", { headers }),
        ])

        if (!deliveredRes.ok || !collectedRes.ok || !avgDeliveryRes.ok || !topSellersRes.ok || !agentRes.ok) {
          throw new Error("Failed to fetch data from API")
        }

        const deliveredData = await deliveredRes.json()
        const collectedData = await collectedRes.json()
        const avgDeliveryData = await avgDeliveryRes.json()
        const topSellersData = await topSellersRes.json()
        const agentData = await agentRes.json()

        setMetrics({
          delivered: deliveredData?.data ?? { deliveredOrders: 0, returnedOrders: 0, ratio: null },
          collected: collectedData?.data ?? { collectedOrders: 0, pendingOrders: 0, ratio: null },
          avgDeliveryTime: avgDeliveryData?.data ?? [],
          topSellers: topSellersData?.data ?? [],
          agentInfo: agentData?.data?.[0]?.agentName ?? "Not available",
        })
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please check your connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white lg:p-5 p-0">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-white lg:p-5 p-0 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Unavailable</h2>
            <p className="text-gray-600 mb-4">{error || "No metrics available."}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalOrders = (metrics.delivered?.deliveredOrders || 0) + (metrics.delivered?.returnedOrders || 0)
  const deliverySuccessRate =
    metrics.delivered?.ratio && metrics.delivered.ratio !== "NaN" ? Number.parseFloat(metrics.delivered.ratio) : 0

  const totalRevenue = metrics.topSellers.reduce((sum, seller) => sum + seller.revenue, 0)

  const avgDeliveryHours =
    metrics.avgDeliveryTime.length > 0
      ? Math.round(metrics.avgDeliveryTime.reduce((a, b) => a + b.avgDeliveryHours, 0) / metrics.avgDeliveryTime.length)
      : 0

  const collectionRate =
    metrics.collected?.ratio && metrics.collected.ratio !== "NaN" ? Number.parseFloat(metrics.collected.ratio) : 0

  const dashboardMetrics = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: "",
      trend: "up" as const,
      description: "Revenue from all sellers",
      subtitle: "Based on top sellers data",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      change: "",
      trend: deliverySuccessRate > 70 ? ("up" as const) : ("down" as const),
      description: `${deliverySuccessRate.toFixed(1)}% delivery success rate`,
      subtitle: "Delivered and returned orders",
    },
    {
      title: "Collection Rate",
      value: `${collectionRate.toFixed(1)}%`,
      change: "",
      trend: collectionRate > 60 ? ("up" as const) : ("down" as const),
      description: "Payment collection efficiency",
      subtitle: "Collected vs pending orders",
    },
    {
      title: "Avg Delivery Time",
      value: `${avgDeliveryHours}h`,
      change: "",
      trend: avgDeliveryHours < 48 ? ("up" as const) : ("down" as const),
      description: "Average delivery time",
      subtitle: "Across all cities",
    },
  ]

  const topSellersChartData = metrics.topSellers.slice(0, 5).map((seller) => ({
    name: seller.sellerName.length > 15 ? seller.sellerName.substring(0, 15) + "..." : seller.sellerName,
    revenue: seller.revenue,
    orders: seller.orders,
  }))

  const deliveryTimeChartData = metrics.avgDeliveryTime.slice(0, 6).map((city) => ({
    name: city.city,
    hours: city.avgDeliveryHours,
    orders: city.orders,
  }))

  return (
    <div className="min-h-screen bg-white lg:p-5 p-0">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Professional Metric Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
                dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
                *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
                 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
  {dashboardMetrics.map((metric, index) => {
    const isPositive = metric.trend === "up"
    const TrendIcon = isPositive ? IconTrendingUp : IconTrendingDown
    const trendText = isPositive
      ? `Trending up`
      : `Trending down`

    return (
      <Card key={index} className="@container/card">
        <CardHeader>
          <CardDescription>{metric.title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metric.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendIcon className="h-4 w-4" />
              {metric.change || (isPositive ? "+10%" : "-10%")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metric.description} <TrendIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">{metric.subtitle}</div>
        </CardFooter>
      </Card>
    )
  })}
</div>

        {/* Professional Charts Section */}
 <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Sellers Revenue */}
          {topSellersChartData.length > 0 && (
            <Card className="bg-gradient-to-t from-[#2BC3F1]/5 to-[#E0B660]/5 shadow-sm border rounded-2xl">
              <CardHeader>
                <CardTitle style={{ color: "#2BC3F1" }}>Top Sellers Revenue</CardTitle>
                <CardDescription style={{ color: "#E0B660" }}>
                  Revenue performance by top sellers
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
<ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSellersChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#2BC3F1" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#E0B660" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="#2BC3F1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Delivery Time by City */}
          {deliveryTimeChartData.length > 0 && (
            <Card className="bg-gradient-to-t from-[#2BC3F1]/5 to-[#E0B660]/5 shadow-sm border rounded-2xl">
              <CardHeader>
                <CardTitle style={{ color: "#2BC3F1" }}>Delivery Time by City</CardTitle>
                <CardDescription style={{ color: "#E0B660" }}>
                  Average delivery hours across cities
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
<ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deliveryTimeChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#2BC3F1" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#E0B660" }} tickFormatter={(v) => `${v}h`} />
                      <ChartTooltip content={<ChartTooltipContent />} formatter={(v: any) => [`${v} hours`, "Delivery Time"]} />
                      <Bar dataKey="hours" fill="#E0B660" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
</div>


      </div>
    </div>
  )
}
