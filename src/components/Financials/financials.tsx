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

interface FinancialSummary {
  totalRevenue: number
  totalPayouts: number
  totalCommission: number
  totalCashCollected: number
  netProfit: number
}

export default function FinancialSummaryPage() {
  const [data, setData] = useState<FinancialSummary | null>(null)
  const [trendData, setTrendData] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/financials/summary/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        setData(res.data.summary)
        setTrendData(res.data.trends.revenue || [])
      })
      .catch((err) => console.error("❌ Error fetching financial summary", err))
  }, [])

  if (!data) return <p>Loading...</p>

  // ✅ Metric cards
  const metrics = [
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue}`,
      trend: "up",
    },
    {
      title: "Total Payouts",
      value: `$${data.totalPayouts}`,
      trend: data.totalPayouts > 0 ? "down" : "up",
    },
    {
      title: "Total Commission",
      value: `$${data.totalCommission}`,
      trend: "up",
    },
    {
      title: "Net Profit",
      value: `$${data.netProfit}`,
      trend: "up",
    },
  ]

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Financial Summary</h1>
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

      {/* ✅ Revenue Trend Chart */}
      <Card className="bg-gradient-to-t from-[#2BC3F1]/5 to-[#E0B660]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
