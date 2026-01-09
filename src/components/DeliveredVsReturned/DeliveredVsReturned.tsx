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
 * Single-file DeliveredVsReturned page with:
 * - date presets + manual range
 * - client-side calculation (from /api/admin/orders)
 * - chart, metric cards, filtered table
 * - Download PDF (uses same from/to query params)
 *
 * Tweak `deliveredStatuses` / `returnedStatuses` to match your backend.
 */

type RawOrder = {
  id: string;
  orderId?: string;
  status?: string;
  totalAmount?: number | null;
  createdAt?: string | null;
  seller?: any;
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
      const d = new Date(startOfToday);
      const day = d.getDay();
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

export default function DeliveredVsReturnedSingle() {
  const [allOrders, setAllOrders] = useState<RawOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [preset, setPreset] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string | null>(null); // yyyy-mm-dd
  const [toDate, setToDate] = useState<string | null>(null); // yyyy-mm-dd
  const [downloading, setDownloading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Adjust these sets to match your backend's status values
  const deliveredStatuses = new Set(["delivered", "collected", "paid"]);
  const returnedStatuses = new Set(["returned", "rto"]);

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
            orderId: (o.orderId ?? o.order_number ?? o._id ?? o.orderID ?? o.orderNumber) as string,
            status: (o.status ?? "").toString().toLowerCase(),
            totalAmount: o.totalAmount ?? o.total ?? o.amount ?? null,
            createdAt: o.createdAt ?? o.orderDate ?? o.created_at ?? null,
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
    if (!allOrders.length) return [];

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

  // compute delivered & returned metrics
  const metrics = useMemo(() => {
    const total = filteredOrders.length;
    const deliveredList = filteredOrders.filter((o) => deliveredStatuses.has((o.status ?? "").toLowerCase()));
    const returnedList = filteredOrders.filter((o) => returnedStatuses.has((o.status ?? "").toLowerCase()));
    const deliveredCount = deliveredList.length;
    const returnedCount = returnedList.length;
    const deliveredPct = total > 0 ? ((deliveredCount / total) * 100).toFixed(2) : "0.00";
    const returnedPct = total > 0 ? ((returnedCount / total) * 100).toFixed(2) : "0.00";
    const ratio = returnedCount > 0 ? String(deliveredCount / returnedCount) : returnedCount === 0 && deliveredCount > 0 ? "Infinity" : "0";
    return {
      totalOrders: total,
      delivered: { count: deliveredCount, percentage: deliveredPct },
      returned: { count: returnedCount, percentage: returnedPct },
      ratio: { deliveredToReturned: ratio },
      deliveredList,
      returnedList,
    };
  }, [filteredOrders]);

  const chartData = useMemo(
    () => [
      { name: "Delivered", value: metrics.delivered.count },
      { name: "Returned", value: metrics.returned.count },
    ],
    [metrics]
  );
// add this helper near your other helpers (e.g. above useMemo for filteredOrders)
function isDeliveredOrReturned(o: RawOrder, deliveredStatuses: Set<string>, returnedStatuses: Set<string>) {
  const st = (o.status ?? "").toString().toLowerCase();
  if (deliveredStatuses.has(st) || returnedStatuses.has(st)) return true;

  // fallback flags if backend uses boolean flags
  if ((o as any).isReturned === true || (o as any).isDelivered === true) return true;
  if ((o as any).returned === true || (o as any).delivered === true) return true;

  return false;
}

  // const handleDownloadPDF = useCallback(async () => {
  //   setDownloading(true);
  //   try {
  //     const params = new URLSearchParams();
  //     if (fromDate) params.set("from", new Date(fromDate + "T00:00:00").toISOString());
  //     if (toDate) params.set("to", new Date(toDate + "T23:59:59.999").toISOString());
  //     // assume server exposes a PDF endpoint; tweak path if needed
  //     const url = params.toString()
  //       ? `https://cod-ecommerce-two.vercel.app/api/admin/getDeliveredVsReturnedRatio/pdf?${params.toString()}`
  //       : `https://cod-ecommerce-two.vercel.app/api/admin/getDeliveredVsReturnedRatio/pdf`;

  //     const res = await axios.get(url, {
  //       headers: token ? { Authorization: `Bearer ${token}` } : {},
  //       responseType: "blob",
  //       validateStatus: () => true,
  //     });

  //     if (res.status >= 200 && res.status < 300) {
  //       const blob = new Blob([res.data], { type: "application/pdf" });
  //       const link = window.URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = link;
  //       const suffix = fromDate ? `-${fromDate}` : "";
  //       a.download = `delivered-vs-returned${suffix}.pdf`;
  //       a.click();
  //       window.URL.revokeObjectURL(link);
  //     } else {
  //       let msg = `Server returned ${res.status}`;
  //       try {
  //         const text = await (res.data as Blob).text();
  //         msg += `: ${text.slice(0, 300)}`;
  //       } catch {}
  //       console.error(msg);
  //       alert("Failed to download PDF. See console for details.");
  //     }
  //   } catch (err) {
  //     console.error("Download PDF error:", err);
  //     alert("Failed to download PDF. See console for details.");
  //   } finally {
  //     setDownloading(false);
  //   }
  // }, [fromDate, toDate, token]);
// below your filteredOrders/useMemo block
const displayedOrders = useMemo(() => {
  if (!filteredOrders.length) return [];

  const list = filteredOrders.filter((o) =>
    isDeliveredOrReturned(o, deliveredStatuses, returnedStatuses)
  );

  // optional: sort newest first
  return list.slice().sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}, [filteredOrders, deliveredStatuses, returnedStatuses]);

  const startISOForChildren = fromDate ? new Date(fromDate + "T00:00:00").toISOString() : null;
  const endISOForChildren = toDate ? new Date(toDate + "T23:59:59.999").toISOString() : null;

  if (loadingOrders && !allOrders.length) return <p>Loading...</p>;

  return (
    <div className="lg:p-6 space-y-6 p-4">
      {/* header + filter controls */}
      <div className="lg:flex block items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Delivered vs Returned Orders</h1>
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

          
        </div>
      </div>

      {/* metric cards */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
        dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
        *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
        @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        {[
          {
            title: "Delivered Orders",
            value: metrics.delivered.count,
            sub: `${metrics.delivered.percentage}%`,
            trend: "up",
          },
          {
            title: "Returned Orders",
            value: metrics.returned.count,
            sub: `${metrics.returned.percentage}%`,
            trend: "down",
          },
          {
            title: "Delivery Ratio",
            value:
              metrics.ratio.deliveredToReturned === "Infinity"
                ? "100%"
                : isFinite(Number(metrics.ratio.deliveredToReturned))
                ? `${(Number(metrics.ratio.deliveredToReturned) * 100).toFixed(2)}%`
                : "—",
            sub: "",
            trend: "up",
          },
        ].map((m, i) => {
          const isPositive = m.trend === "up";
          const Icon = isPositive ? TrendingUp : TrendingDown;
          return (
            <Card key={i} className="@container/card">
              <CardHeader>
                <CardDescription>{m.title}</CardDescription>
                <CardTitle className="text-2xl">{m.value}{m.sub ? ` (${m.sub})` : ""}</CardTitle>
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
          <CardDescription>Delivered vs Returned</CardDescription>
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
  ) : displayedOrders.length ? (
    displayedOrders.map((o) => (
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
        No delivered or returned orders for this date range.
      </td>
    </tr>
  )}
</tbody>

        </table>
      </div>

     
    </div>
  );
}
