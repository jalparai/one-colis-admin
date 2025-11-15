"use client"

import React, { useCallback, useEffect, useState } from "react"
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

interface TrendPoint {
  _id: string
  totalRevenue: number
  [k: string]: any
}

export default function FinancialSummaryPage() {
  const [data, setData] = useState<FinancialSummary | null>(null)
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // date filters
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [
    selectedPreset,
    setSelectedPreset,
  ] = useState<
    "" | "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all"
  >("")

  // format date for input[type=date]
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  // compute preset ranges (weeks start Monday)
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
      default:
        start = new Date()
        end = new Date()
        break
    }

    return { start: formatDateForInput(start), end: formatDateForInput(end) }
  }

  // apply preset (updates dates and dropdown selection)
  const applyPreset = (
    preset: "" | "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all"
  ) => {
    if (preset === "") return
    if (preset === "all") {
      setStartDate("")
      setEndDate("")
      setSelectedPreset("all")
      return
    }
    const r = getPresetRange(preset as any)
    setStartDate(r.start)
    setEndDate(r.end)
    setSelectedPreset(preset)
  }

  // detect if current start/end matches a preset (keeps dropdown in sync)
  const detectPreset = (
    s: string,
    e: string
  ): "" | "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all" => {
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

  // fetch summary + trends (uses startDate/endDate as optional query params)
  const fetchSummary = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No auth token found")
      }

      const url = new URL("https://cod-ecommerce-two.vercel.app/api/admin/financials/summary/")
      if (startDate) url.searchParams.append("startDate", startDate)
      if (endDate) url.searchParams.append("endDate", endDate)

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server responded ${res.status}: ${text}`)
      }

      const json = await res.json()
      setData(json.data?.summary ?? null)
      setTrendData((json.data?.trends?.revenue ?? []) as TrendPoint[])
    } catch (err: any) {
      console.error("❌ Error fetching financial summary", err)
      setError(err?.message || "Failed to fetch financial summary")
      setData(null)
      setTrendData([])
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  // load on mount and whenever filters change
  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  // keep dropdown in sync with manual date input changes
  useEffect(() => {
    const detected = detectPreset(startDate, endDate)
    if (detected !== selectedPreset) setSelectedPreset(detected)
  }, [startDate, endDate])

  if (loading) return <p>Loading...</p>
  if (error) return <div className="p-3 rounded-md border bg-red-50 text-red-700">{error}</div>
  if (!data) return <p>No data available.</p>

  // Metric cards
  const metrics = [
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString()}`,
      trend: "up" as const,
    },
    {
      title: "Total Payouts",
      value: `$${data.totalPayouts.toLocaleString()}`,
      trend: data.totalPayouts > 0 ? "down" : "up",
    },
    {
      title: "Total Commission",
      value: `$${data.totalCommission.toLocaleString()}`,
      trend: "up" as const,
    },
    {
      title: "Net Profit",
      value: `$${data.netProfit.toLocaleString()}`,
      trend: "up" as const,
    },
  ]

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title + filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Summary</h1>
          <p className="text-sm text-muted-foreground">Filter by date range — affects metrics and trend chart.</p>
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
        </div>
      </div>

      {/* Metric Cards */}
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
                <CardTitle className="text-3xl font-semibold">{metric.value}</CardTitle>
                <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll text-sm text-muted-foreground">
                  <TrendIcon className={`h-4 w-4 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                  {trendText}
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Revenue Trend Chart */}
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
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="totalRevenue" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
