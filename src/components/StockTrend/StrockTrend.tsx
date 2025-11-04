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
  Legend,
} from "recharts"
import DownloadStockPdf from "../ReportsPdf/DownloadStockPdf"

interface SoldData {
  soldQty: number
  period: string
  name: string
}

interface ReturnedData {
  returnedQty: number
  period: string
  name: string
}

interface StockTrends {
  sold: SoldData[]
  returned: ReturnedData[]
}

export default function StockTrendsPage() {
  const [stock, setStock] = useState<StockTrends | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/stock-trends", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setStock(res.data))
      .catch((err) => console.error(err))
  }, [])

  if (!stock) return <p>Loading...</p>

  // ✅ Merge sold + returned into one dataset for the chart
  const chartData = [
    ...stock.sold.map((item) => ({
      name: item.name,
      sold: item.soldQty,
      returned: 0,
    })),
    ...stock.returned.map((item) => ({
      name: item.name,
      sold: 0,
      returned: item.returnedQty,
    })),
  ]

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title */}
      <div className="flex justify-between">
      <h1 className="text-2xl font-bold">Stock Trends</h1>
<DownloadStockPdf />
      </div>
    {/* ✅ Chart */}
      <Card className="bg-gradient-to-t from-[#F59E0B]/5 to-[#3B82F6]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Stock Usage vs Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sold" fill="#2BC3F1" name="Sold Qty" radius={[8, 8, 0, 0]} />
                <Bar dataKey="returned" fill="#EF4444" name="Returned Qty" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* ✅ Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Usage & Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold uppercase text-xs tracking-wider">
                    Product
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">
                    Period
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">
                    Sold Qty
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right text-red-600">
                    Returned Qty
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.sold.map((item, index) => (
                  <TableRow
                    key={`sold-${index}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.period}</TableCell>
                    <TableCell className="text-right font-semibold text-[#2BC3F1]">
                      {item.soldQty}
                    </TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                ))}
                {stock.returned.map((item, index) => (
                  <TableRow
                    key={`returned-${index}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.period}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {item.returnedQty}
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
