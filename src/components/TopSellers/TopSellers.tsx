"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "../ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import DownloadTopSellerPdf from "../ReportsPdf/DownloadTopSellerPdf"

interface SellerData {
  orders: number
  revenue: number
  sellerId: string
  sellerName: string
  sellerEmail: string
  city: string
}

export default function TopSellersPage() {
  const [data, setData] = useState<SellerData[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/getTopSellers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
  }, [])

  if (!data.length) return <p>Loading...</p>

  // Get highest order count (for scaling progress bar)
  const maxOrders = Math.max(...data.map((s) => s.orders))

  // Chart data
  const chartData = data.map((seller) => ({
    name: seller.sellerName,
    Orders: seller.orders,
    Revenue: seller.revenue,
  }))

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Top Sellers</h1>
<DownloadTopSellerPdf />
      </div>
    
      {/* Cards */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
          dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
          *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
          @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        {data.map((seller) => (
          <Card key={seller.sellerId} data-slot="card">
            <CardHeader>
              <CardTitle>{seller.sellerName}</CardTitle>
              <p className="text-sm text-muted-foreground">{seller.city}</p>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">Orders: {seller.orders}</p>
              <Progress
                value={(seller.orders / maxOrders) * 100}
                className="h-2 mt-2"
              />
              <p className="text-lg font-semibold mt-3">
                Revenue: {seller.revenue}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sellers Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Orders" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Revenue" fill="#E0B660" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
