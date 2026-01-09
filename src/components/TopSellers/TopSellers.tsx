"use client"

import React, { useEffect, useState, useCallback } from "react"
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

type FilterKey =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom"

// -----------------------------------------------------------------------------
// NOTES:
// 1) This version adds detailed console logging for the request URL, body,
//    response and fallback logic (GET -> POST) so you can see why "no data"
//    might be returned by your backend.
// 2) If your backend expects different param names (e.g. startDate / endDate)
//    or expects a POST body only, change `USE_POST_FALLBACK` to `true` or adapt
//    the param names in `postBody` below.
// -----------------------------------------------------------------------------

const USE_POST_FALLBACK = true // set to true to attempt POST when GET fails

export default function TopSellersPage() {
  const [data, setData] = useState<SellerData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // filter state
  const [filter, setFilter] = useState<FilterKey>("all")
  const [customFrom, setCustomFrom] = useState<string>("") // yyyy-mm-dd
  const [customTo, setCustomTo] = useState<string>("")

  // compute ranges
  const startOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const endOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
  }

  function getRangeForFilter(key: FilterKey) {
    const today = new Date()
    switch (key) {
      case "today":
        return { from: startOfDay(today).toISOString(), to: endOfDay(today).toISOString() }
      case "yesterday": {
        const y = new Date()
        y.setDate(today.getDate() - 1)
        return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() }
      }
      case "this_week": {
        const day = today.getDay()
        const diffToMonday = (day + 6) % 7
        const monday = startOfDay(new Date(today))
        monday.setDate(today.getDate() - diffToMonday)
        const sunday = endOfDay(new Date(monday))
        sunday.setDate(monday.getDate() + 6)
        return { from: monday.toISOString(), to: sunday.toISOString() }
      }
      case "last_week": {
        const day = today.getDay()
        const diffToMonday = (day + 6) % 7
        const thisMonday = startOfDay(new Date(today))
        thisMonday.setDate(today.getDate() - diffToMonday)
        const lastMonday = new Date(thisMonday)
        lastMonday.setDate(thisMonday.getDate() - 7)
        const lastSunday = endOfDay(new Date(lastMonday))
        lastSunday.setDate(lastMonday.getDate() + 6)
        return { from: lastMonday.toISOString(), to: lastSunday.toISOString() }
      }
      case "this_month": {
        const start = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1))
        const end = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
        return { from: start.toISOString(), to: end.toISOString() }
      }
      case "last_month": {
        const start = startOfDay(new Date(today.getFullYear(), today.getMonth() - 1, 1))
        const end = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0))
        return { from: start.toISOString(), to: end.toISOString() }
      }
      case "custom": {
        if (!customFrom || !customTo) return null
        const f = startOfDay(new Date(customFrom))
        const t = endOfDay(new Date(customTo))
        return { from: f.toISOString(), to: t.toISOString() }
      }
      case "all":
      default:
        return null
    }
  }

  const fetchData = useCallback(
    async (filterKey: FilterKey = "all") => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No token in localStorage — make sure you're logged in and token is set")

        const range = getRangeForFilter(filterKey)

        // Build GET URL (include multiple common param names so server accepts one or the other)
        const baseUrl = "https://cod-ecommerce-two.vercel.app/api/admin/getTopSellers"
        const params = new URLSearchParams()
        if (range) {
          params.set("from", range.from)
          params.set("to", range.to)
          // some APIs expect different param names:
          params.set("startDate", range.from)
          params.set("endDate", range.to)
        }
        const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl

        console.info("[TopSellers] Fetching (GET):", url)

        // Try GET first
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        })

        const json = await res.json().catch(() => null)
        console.info("[TopSellers] GET response status:", res.status, json)

        // Normalize possible payload shapes
        const payload = json?.data ?? json?.results ?? json?.topSellers ?? json

        // If GET worked and payload is an array -> use it
        if (res.ok && Array.isArray(payload)) {
          setData(payload)
          return
        }

        // If GET returned something unexpected (non-array) or failed, attempt POST fallback (if enabled).
        // NOTE: previously your code only attempted POST on !res.ok. We should attempt POST also when payload isn't an array.
        if (USE_POST_FALLBACK) {
          console.info("[TopSellers] GET did not return expected array payload — attempting POST fallback")

          // Build a flexible POST body with a couple of common date key names
          const postBody: any = {}
          if (range) {
            postBody.from = range.from
            postBody.to = range.to
            postBody.startDate = range.from
            postBody.endDate = range.to
          }

          const postUrl = baseUrl
          console.info("[TopSellers] POST to:", postUrl, "body:", postBody)

          const postRes = await fetch(postUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postBody),
          })

          const postJson = await postRes.json().catch(() => null)
          console.info("[TopSellers] POST response status:", postRes.status, postJson)

          const postPayload = postJson?.data ?? postJson?.results ?? postJson?.topSellers ?? postJson
          if (postRes.ok && Array.isArray(postPayload)) {
            setData(postPayload)
            return
          }

          // POST also failed or returned unexpected format
          const postMessage = postJson?.message ?? postJson?.error ?? `POST failed (${postRes.status})`
          throw new Error(postMessage)
        }

        // if we get here, GET did not produce an array and POST fallback is disabled
        console.warn("[TopSellers] GET returned unexpected payload and POST fallback disabled", payload)
        setData([])
        setError("Server returned data in an unexpected format (GET). Check console logs.")
      } catch (err: any) {
        console.error("[TopSellers] Fetch error:", err)
        setError(err.message || "Failed to fetch data — see console for details")
        setData([])
      } finally {
        setLoading(false)
      }
    },
    [customFrom, customTo],
  )


  // fetch when filter changes (except custom — custom needs apply)
  useEffect(() => {
    if (filter === "custom") return
    fetchData(filter)
  }, [filter, fetchData])

  // allow initial fetch
  useEffect(() => {
    fetchData("all")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setError("Please select both From and To dates for custom range")
      return
    }
    setError(null)
    setFilter("custom")
    fetchData("custom")
  }

  if (loading) return <p>Loading...</p>

  // Get highest order count (for scaling progress bar)
  const maxOrders = data.length ? Math.max(...data.map((s) => s.orders)) : 0

  // Chart data
  const chartData = data.map((seller) => ({
    name: seller.sellerName,
      "Delivered Orders": seller.orders,

    Orders: seller.orders,
    Revenue: seller.revenue,
  }))

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Title + controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Top Sellers</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
              className="border rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filter === "custom" && (
            <div className="flex items-center gap-2">
              <label className="text-sm">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <label className="text-sm">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <button
                onClick={applyCustomRange}
                className="bg-primary text-white px-3 py-1 rounded"
              >
                Apply
              </button>
            </div>
          )}

          <DownloadTopSellerPdf />
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

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
              <p className="text-lg font-semibold">Delivered Orders: {seller.orders}</p>
              <Progress
                value={maxOrders ? (seller.orders / maxOrders) * 100 : 0}
                className="h-2 mt-2"
              />
              <p className="text-lg font-semibold mt-3">Revenue: {seller.revenue}</p>
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
                <Bar dataKey="Delivered Orders" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Revenue" fill="#E0B660" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
