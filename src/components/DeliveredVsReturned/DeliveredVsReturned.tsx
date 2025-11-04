"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"
import DownloadDelieverdVsReturned from "../ReportsPdf/DownloadDelieverdVsRetured"
import DeliveredReturnOrdersTable from "./TableDr"

interface RatioData {
  deliveredOrders: number
  returnedOrders: number
  ratio: string
}

export default function DeliveredVsReturned() {
  const [data, setData] = useState<RatioData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token") // or from cookies
    if (!token) return

    fetch(
      "https://cod-ecommerce-two.vercel.app/api/admin/getDeliveredVsReturnedRatio",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
  }, [])

  if (!data) return <p>Loading...</p>

  const chartData = [
    { name: "Delivered", value: data.deliveredOrders },
    { name: "Returned", value: data.returnedOrders },
  ]

  // ✅ Metric cards
  const metrics = [
    {
      title: "Delivered Orders",
      value: data.deliveredOrders,
      trend: "up",
    },
    {
      title: "Returned Orders",
      value: data.returnedOrders,
      trend: "down",
    },
    {
      title: "Delivery Ratio (%)",
      value: data.ratio,
      trend: "up",
    },
  ]

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
              <h1 className="text-2xl font-bold">Delivered vs Returned Orders</h1>
<DownloadDelieverdVsReturned />
      </div>

      {/* ✅ Metric Cards */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
        dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
        *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
        @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        {metrics.map((metric, index) => {
          const isPositive = metric.trend === "up"
          const TrendIcon = isPositive ? TrendingUp : TrendingDown
          const trendText = isPositive ? "Trending up" : "Trending down"

          return (
            <Card key={index} className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>{metric.title}</CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {metric.value}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendIcon
                    className={`h-4 w-4 ${
                      isPositive ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  {trendText}
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* ✅ Chart */}
      <Card className="bg-gradient-to-t from-[#4CAF50]/5 to-[#FF9800]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Orders Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#E0B660" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <DeliveredReturnOrdersTable />
    </div>
  )
}
