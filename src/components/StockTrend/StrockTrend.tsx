"use client"

import React, { useCallback, useEffect, useState } from "react"
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
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // date filters
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  // selected preset for the dropdown ('' = custom)
  const [selectedPreset, setSelectedPreset] = useState<"" | "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all">("")

  // format date for input[type=date]
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  // helper: compute start/end for a preset
  const getPresetRange = (
    preset: "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all"
  ): { start: string; end: string } => {
    const now = new Date()
    const startOfWeek = (d: Date) => {
      const copy = new Date(d)
      const day = (copy.getDay() + 6) % 7 // Monday = 0
      copy.setDate(copy.getDate() - day)
      copy.setHours(0, 0, 0, 0)
      return copy
    }

    if (preset === "all") return { start: "", end: "" }

    let start: Date
    let end: Date

    switch (preset) {
      case "today":
        start = new Date(now)
        end = new Date(now)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "yesterday":
        start = new Date(now)
        start.setDate(now.getDate() - 1)
        end = new Date(start)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "lastWeek": {
        const thisMonday = startOfWeek(now)
        start = new Date(thisMonday)
        start.setDate(thisMonday.getDate() - 7)
        end = new Date(thisMonday)
        end.setDate(thisMonday.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "thisWeek":
        start = startOfWeek(now)
        end = new Date(now)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
    }

    return { start: formatDateForInput(start), end: formatDateForInput(end) }
  }

  // apply preset: update dates and selected preset (controlled dropdown)
  const applyPreset = (
    preset: "" | "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all"
  ) => {
    if (preset === "") return
    const range = preset === "all" ? { start: "", end: "" } : getPresetRange(preset as any)
    setStartDate(range.start)
    setEndDate(range.end)
    setSelectedPreset(preset)
  }

  // detect preset when user manually changes dates
  const detectPreset = (s: string, e: string): "" | "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all" => {
    if (!s && !e) return "all"
    const presets: Array<"today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth"> = [
      "today",
      "yesterday",
      "lastWeek",
      "thisWeek",
      "lastMonth",
      "thisMonth",
    ]
    for (const p of presets) {
      const r = getPresetRange(p)
      if (r.start === s && r.end === e) return p
    }
    return ""
  }

  // when startDate/endDate change (manually or via applyPreset) update dropdown selection
  useEffect(() => {
    const matched = detectPreset(startDate, endDate)
    if (matched !== selectedPreset) setSelectedPreset(matched)
  }, [startDate, endDate])

  // fetch with optional date filters
  const fetchStock = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No auth token found")

      const url = new URL("https://cod-ecommerce-two.vercel.app/api/admin/stock-trends")
      if (startDate) url.searchParams.append("startDate", startDate)
      if (endDate) url.searchParams.append("endDate", endDate)

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server responded ${res.status}: ${text}`)
      }

      const json = await res.json()
      const data = json?.data ?? null
      setStock(data)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to fetch stock trends")
      setStock(null)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  // auto-fetch on mount and whenever date filters change
  useEffect(() => {
    void fetchStock()
  }, [fetchStock])

  // loading / error
  if (loading) return <p>Loading...</p>
  if (error) return <div className="p-3 rounded-md border bg-red-50 text-red-700">{error}</div>
  if (!stock) return <p>No data available.</p>

  // Merge sold + returned by product name so chart shows both values per product
  const mergedMap = new Map<string, { name: string; sold: number; returned: number }>()

  stock.sold.forEach((s) => {
    const key = s.name
    const prev = mergedMap.get(key) || { name: s.name, sold: 0, returned: 0 }
    prev.sold += s.soldQty
    mergedMap.set(key, prev)
  })
  stock.returned.forEach((r) => {
    const key = r.name
    const prev = mergedMap.get(key) || { name: r.name, sold: 0, returned: 0 }
    prev.returned += r.returnedQty
    mergedMap.set(key, prev)
  })

  const chartData = Array.from(mergedMap.values()).map((it) => ({
    name: it.name.length > 20 ? it.name.slice(0, 20) + "..." : it.name,
    sold: it.sold,
    returned: it.returned,
  }))

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title + filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock Trends</h1>
          <p className="text-sm text-muted-foreground">Filter by date range — affects chart, table and PDF export.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPreset}
            onChange={(e) => applyPreset(e.target.value as any)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Presets</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="lastWeek">Last week</option>
            <option value="thisWeek">This week</option>
            <option value="lastMonth">Last month</option>
            <option value="thisMonth">This month</option>
            <option value="all">All time</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          />
          <span className="text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          />

          {/* Download passes current filters */}
          <DownloadStockPdf />
        </div>
      </div>

      {/* Chart */}
<Card className="bg-gradient-to-t from-[#F59E0B]/5 to-[#3B82F6]/5 shadow-sm border rounded-2xl">
  <CardHeader>
    <CardTitle>Stock Usage vs Returns</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />

          {/* 👉 Custom colors here */}
          <Bar
            dataKey="sold"
            name="Sold Qty"
            fill="#2bc3f1" // purple
            radius={[8, 8, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="returned"
            name="Returned Qty"
            fill="#EF4444" // red
            radius={[8, 8, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>


      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Usage & Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold uppercase text-xs tracking-wider">Product</TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Period</TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Sold Qty</TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right text-red-600">Returned Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.sold.map((item, index) => (
                  <TableRow key={`sold-${index}`} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.period}</TableCell>
                    <TableCell className="text-right font-semibold text-[#2BC3F1]">{item.soldQty}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                  </TableRow>
                ))}

                {stock.returned.map((item, index) => (
                  <TableRow key={`returned-${index}`} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.period}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{item.returnedQty}</TableCell>
                  </TableRow>
                ))}

                {stock.sold.length === 0 && stock.returned.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No data for selected date range.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
