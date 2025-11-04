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
import { Clock } from "lucide-react"
import DownloadAverageDeliveryTimePdf from "../ReportsPdf/DownloadAverageDeliveryTimePdf"

interface DeliveryData {
  orders: number
  city: string
  avgDeliveryHours: number
}

export default function AverageDeliveryTimePage() {
  const [cities, setCities] = useState<DeliveryData[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/getAverageDeliveryTime", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setCities(res.data))
      .catch((err) => console.error(err))
  }, [])

  if (!cities.length) return <p>Loading...</p>

  // ✅ Chart data
  const chartData = cities.map((city) => ({
    name: city.city,
    orders: city.orders,
    avgDeliveryHours: Number(city.avgDeliveryHours.toFixed(2)), // limit to 2 decimals
  }))

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Average Delivery Time by City</h1>
        <DownloadAverageDeliveryTimePdf /> 
      </div>
     
      {/* ✅ Cards */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
        dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
        *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
        @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        {cities.map((city, index) => (
          <Card key={index} className="@container/card" data-slot="card">
            <CardHeader>
              <CardDescription>{city.city}</CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {city.avgDeliveryHours.toFixed(2)} hrs {/* ✅ Show 2 decimals */}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Orders: {city.orders}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Avg Delivery Time
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* ✅ Chart */}
      <Card className="bg-gradient-to-t from-[#F59E0B]/5 to-[#3B82F6]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Average Delivery Hours Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)} hrs`} // ✅ Tooltip formatted to 2 decimals
                />
                <Bar
                  dataKey="avgDeliveryHours"
                  fill="#2BC3F1"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
