"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import DownloadRevenueCity from "../ReportsPdf/DownloadRevenueCity"

interface CityData {
  revenue: number
  orders: number
  city: string
  fees: number
  profit: number
}

export default function RevenueByCityPage() {
  const [cities, setCities] = useState<CityData[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/revenue-by-city", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setCities(res.data))
      .catch((err) => console.error(err))
  }, [])

  if (!cities.length) return <p>Loading...</p>

  const chartData = cities.map((c) => ({
    name: c.city,
    revenue: c.revenue,
    profit: c.profit,
  }))
  

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Revenue by City</h1>
        <DownloadRevenueCity />
      </div>

      {/* ✅ Chart */}
      <Card className="bg-gradient-to-t from-[#10B981]/5 to-[#3B82F6]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>City Revenue vs Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#E0B660" radius={[8, 8, 0, 0]} />
                <Bar dataKey="profit" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Beautiful Table */}
      <Card className="shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Cities Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#10B981]/10 to-[#3B82F6]/10">
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-left py-3 px-4">
                    City
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right py-3 px-4">
                    Orders
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right py-3 px-4">
                    Revenue
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right py-3 px-4">
                    Fees
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right py-3 px-4">
                    Profit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/40 transition-colors even:bg-muted/20"
                  >
                    <TableCell className="font-medium py-3 px-4">
                      {city.city}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4">
                      {city.orders}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 font-semibold text-[#E0B660]">
                      ${city.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 text-gray-600">
                      ${city.fees.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 font-semibold text-[#2BC3F1]">
                      ${city.profit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
