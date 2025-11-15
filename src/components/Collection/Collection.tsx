"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Single-file component: fetches orders, filters by date,
 * computes collected vs pending metrics, renders chart + table,
 * and supports downloading a filtered PDF.
 */

// --- types
type RawOrder = {
  id: string;
  orderId?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  seller?: any;
  // include whatever other fields you want to display
};

type Metrics = {
  totalOrders: number;
  collected: { count: number; percentage: string };
  pending: { count: number; percentage: string };
  ratio: { collectedToPending: string };
};

function getDateRangeForFilter(key: string): [Date | null, Date | null] {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  switch (key) {
    case "today":
      return [startOfToday, endOfToday];

    case "yesterday": {
      const s = new Date(startOfToday);
      s.setDate(s.getDate() - 1);
      const e = new Date(s);
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }

    case "this_week": {
      // week starts Monday
      const d = new Date(startOfToday);
      const day = d.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = (day + 6) % 7;
      const s = new Date(d);
      s.setDate(d.getDate() - diffToMonday);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }

    case "last_week": {
      const d = new Date(startOfToday);
      const day = d.getDay();
      const diffToMonday = (day + 6) % 7;
      const startThisWeek = new Date(d);
      startThisWeek.setDate(d.getDate() - diffToMonday);
      startThisWeek.setHours(0, 0, 0, 0);
      const s = new Date(startThisWeek);
      s.setDate(startThisWeek.getDate() - 7);
      const e = new Date(startThisWeek);
      e.setDate(startThisWeek.getDate() - 1);
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }

    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }

    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }

    case "all":
    default:
      return [null, null];
  }
}

export default function CollectedVsPendingSingle() {
  const [allOrders, setAllOrders] = useState<RawOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [preset, setPreset] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string | null>(null); // yyyy-mm-dd
  const [toDate, setToDate] = useState<string | null>(null); // yyyy-mm-dd
  const [downloading, setDownloading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchAllOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        validateStatus: () => true,
      });

      const raw = res.data?.data ?? res.data ?? [];
      const normalized: RawOrder[] = Array.isArray(raw)
        ? raw.map((o: any) => ({
            id: o.id ?? o._id ?? String(Math.random()),
            orderId: (o.orderId ?? o.orderID ?? o.order_number ?? o.orderNumber ?? o._id) as string,
            status: (o.status ?? "").toString().toLowerCase(),
            totalAmount: Number(o.totalAmount ?? o.total ?? o.amount ?? 0),
            createdAt: o.createdAt ?? o.orderDate ?? o.created_at ?? new Date().toISOString(),
            seller: o.seller ?? null,
          }))
        : [];

      setAllOrders(normalized);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setAllOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // preset -> populate from/to
  useEffect(() => {
    const [s, e] = getDateRangeForFilter(preset);
    if (s && e) {
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      setFromDate(fmt(s));
      setToDate(fmt(e));
    } else {
      setFromDate(null);
      setToDate(null);
    }
  }, [preset]);

  // filtered orders derived from allOrders + date range
  const filteredOrders = useMemo(() => {
    if (!allOrders || !allOrders.length) return [];

    const start = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const end = toDate ? new Date(toDate + "T23:59:59.999") : null;

    return allOrders.filter((o) => {
      if (!o.createdAt) return false;
      const created = new Date(o.createdAt);
      if (isNaN(created.getTime())) return false;
      if (start && created < start) return false;
      if (end && created > end) return false;
      return true;
    });
  }, [allOrders, fromDate, toDate]);

  // metrics computed from filteredOrders
  const metrics: Metrics & { collectedOrders: RawOrder[]; pendingOrders: RawOrder[] } = useMemo(() => {
    const totalOrders = filteredOrders.length;
    // adjust collected statuses as needed
    const collectedStatuses = new Set(["collected", "delivered", "paid"]); // tweak to match your app
    const collectedOrders = filteredOrders.filter((o) => collectedStatuses.has((o.status ?? "").toLowerCase()));
    const pendingOrders = filteredOrders.filter((o) => !collectedStatuses.has((o.status ?? "").toLowerCase()));

    const collectedCount = collectedOrders.length;
    const pendingCount = pendingOrders.length;
    const collectedPct = totalOrders > 0 ? ((collectedCount / totalOrders) * 100).toFixed(2) : "0.00";
    const pendingPct = totalOrders > 0 ? ((pendingCount / totalOrders) * 100).toFixed(2) : "0.00";
    const ratio = pendingCount > 0 ? String(collectedCount / pendingCount) : pendingCount === 0 && collectedCount > 0 ? "Infinity" : "0";

    return {
      totalOrders,
      collected: { count: collectedCount, percentage: collectedPct },
      pending: { count: pendingCount, percentage: pendingPct },
      ratio: { collectedToPending: ratio },
      collectedOrders,
      pendingOrders,
    } as any;
  }, [filteredOrders]);

  const chartData = useMemo(
    () => [
      { name: "Collected", count: metrics.collected.count, percentage: metrics.collected.percentage },
      { name: "Pending", count: metrics.pending.count, percentage: metrics.pending.percentage },
    ],
    [metrics]
  );

  // Download aggregated PDF endpoint using same from/to query params
  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", new Date(fromDate + "T00:00:00").toISOString());
      if (toDate) params.set("to", new Date(toDate + "T23:59:59.999").toISOString());
      const url = params.toString()
        ? `https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending/pdf?${params.toString()}`
        : `https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending/pdf`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        const blob = new Blob([res.data], { type: "application/pdf" });
        const link = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = link;
        const suffix = fromDate ? `-${fromDate}` : "";
        a.download = `collected-vs-pending${suffix}.pdf`;
        a.click();
        window.URL.revokeObjectURL(link);
      } else {
        // try to read error body
        let msg = `Server returned ${res.status}`;
        try {
          const text = await (res.data as Blob).text();
          msg += `: ${text.slice(0, 300)}`;
        } catch {}
        console.error(msg);
        alert("Failed to download PDF. See console for details.");
      }
    } catch (err) {
      console.error("Download PDF error:", err);
      alert("Failed to download PDF. See console for details.");
    } finally {
      setDownloading(false);
    }
  }, [fromDate, toDate, token]);

  // small helpers
  const startISOForChildren = fromDate ? new Date(fromDate + "T00:00:00").toISOString() : null;
  const endISOForChildren = toDate ? new Date(toDate + "T23:59:59.999").toISOString() : null;

  return (
    <div className="lg:p-6 space-y-6 p-4">
      {/* header + filter controls */}
      <div className="lg:flex block items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collected vs Pending Orders</h1>
          <div className="text-sm text-muted-foreground">Showing metrics for selected date range</div>
        </div>

        <div className="flex items-center gap-3 lg:overflow-auto overflow-x-scroll">
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="border px-2 py-2 rounded"
            title="Quick ranges"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This week</option>
            <option value="last_week">Last week</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
          </select>

          <label className="text-sm">From:</label>
          <input
            type="date"
            value={fromDate ?? ""}
            onChange={(e) => {
              setFromDate(e.target.value || null);
              setPreset("custom");
            }}
            className="border rounded px-2 py-1"
          />
          <label className="text-sm">To:</label>
          <input
            type="date"
            value={toDate ?? ""}
            onChange={(e) => {
              setToDate(e.target.value || null);
              setPreset("custom");
            }}
            className="border rounded px-2 py-1"
          />

          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Orders",
            value: metrics.totalOrders,
            trend: "up",
          },
          {
            title: "Collected Orders",
            value: `${metrics.collected.count} (${metrics.collected.percentage}%)`,
            trend: "up",
          },
          {
            title: "Pending Orders",
            value: `${metrics.pending.count} (${metrics.pending.percentage}%)`,
            trend: "down",
          },
          {
            title: "Collection Ratio",
            value:
              metrics.ratio.collectedToPending === "Infinity"
                ? "100%"
                : isFinite(Number(metrics.ratio.collectedToPending))
                ? `${(Number(metrics.ratio.collectedToPending) * 100).toFixed(2)}%`
                : "—",
            trend: "up",
          },
        ].map((m, i) => {
          const isPositive = m.trend === "up";
          const Icon = isPositive ? TrendingUp : TrendingDown;
          return (
            <Card key={i} className="@container/card">
              <CardHeader>
                <CardDescription>{m.title}</CardDescription>
                <CardTitle className="text-2xl">{m.value}</CardTitle>
                <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll text-sm text-muted-foreground">
                  <Icon className={`h-4 w-4 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                  {isPositive ? "Trending up" : "Trending down"}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* chart */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Orders Chart</CardTitle>
          <CardDescription>Collected vs Pending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string, props: any) => [
                    `${value} orders (${props.payload?.percentage ?? "0"}%)`,
                    name,
                  ]}
                />
                <Bar dataKey="count" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* table of filtered orders */}
      <div className="overflow-hidden rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2">Order ID</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {loadingOrders ? (
              <tr>
                <td colSpan={4} className="p-4 text-center">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length ? (
              filteredOrders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{o.orderId ?? o.id}</td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2">{typeof o.totalAmount === "number" ? o.totalAmount : "—"}</td>
                  <td className="px-3 py-2">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center">
                  No orders for this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredOrders.length} order(s) — data fetched from <code>/api/admin/orders</code>
      </div>
    </div>
  );
}
