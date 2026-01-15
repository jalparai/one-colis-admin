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

type RawOrder = {
  id: string;
  orderId?: string;
  status?: string;
  totalAmount?: number;
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
    case "today": return [startOfToday, endOfToday];
    case "yesterday": {
      const s = new Date(startOfToday); s.setDate(s.getDate() - 1);
      const e = new Date(s); e.setHours(23,59,59,999);
      return [s,e];
    }
    case "this_week": {
      const d = new Date(startOfToday); const day = d.getDay(); const diffToMonday = (day + 6) % 7;
      const s = new Date(d); s.setDate(d.getDate() - diffToMonday); s.setHours(0,0,0,0);
      const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999);
      return [s,e];
    }
    case "last_week": {
      const d = new Date(startOfToday); const day = d.getDay(); const diffToMonday = (day + 6) % 7;
      const startThisWeek = new Date(d); startThisWeek.setDate(d.getDate() - diffToMonday); startThisWeek.setHours(0,0,0,0);
      const s = new Date(startThisWeek); s.setDate(startThisWeek.getDate() - 7);
      const e = new Date(startThisWeek); e.setDate(startThisWeek.getDate() - 1); e.setHours(23,59,59,999);
      return [s,e];
    }
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1); s.setHours(0,0,0,0);
      const e = new Date(now.getFullYear(), now.getMonth()+1, 0); e.setHours(23,59,59,999);
      return [s,e];
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth()-1, 1); s.setHours(0,0,0,0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0); e.setHours(23,59,59,999);
      return [s,e];
    }
    default: return [null, null];
  }
}

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// parse YYYY-MM-DD into Date local start/end
function parseDateStart(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map((s) => Number(s));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function parseDateEnd(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map((s) => Number(s));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

// Convert any createdAt into local YYYY-MM-DD string (returns null if invalid)
function createdAtToLocalYYYYMMDD(createdAt?: string | null): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CollectedVsPendingSingle() {
  const [allOrders, setAllOrders] = useState<RawOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [preset, setPreset] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [serverMessage, setServerMessage] = useState<string | null>(null);

  // NEW: store aggregated metrics when API returns aggregated-only
  const [aggregatedMetrics, setAggregatedMetrics] = useState<null | {
    totalOrders: number;
    collected: { count: number; percentage: string };
    pending: { count: number; percentage: string };
    ratio: { collectedToPending: string };
  }>(null);

  // Normalize an order list into our shape
  const normalizeOrders = (arr: any[]): RawOrder[] =>
    arr.map((o: any) => ({
      id: o.id ?? o._id ?? String(Math.random()),
      orderId: (o.orderId ?? o.orderID ?? o.order_number ?? o.orderNumber ?? o._id) as string,
      status: (o.status ?? "").toString().toLowerCase(),
      totalAmount: Number(o.totalAmount ?? o.total ?? o.amount ?? 0),
      createdAt: o.createdAt ?? o.orderDate ?? o.created_at ?? null,
      seller: o.seller ?? null,
    }));

  // Try to extract an orders array from different possible shapes
  const tryExtractOrders = (payload: any): RawOrder[] | null => {
    if (!payload) return null;
    if (Array.isArray(payload)) return normalizeOrders(payload);
    if (Array.isArray(payload?.data)) return normalizeOrders(payload.data);
    if (Array.isArray(payload?.orders)) return normalizeOrders(payload.orders);
    if (Array.isArray(payload?.rows)) return normalizeOrders(payload.rows);
    if (Array.isArray(payload?.result)) return normalizeOrders(payload.result);
    if (Array.isArray(payload?.data?.orders)) return normalizeOrders(payload.data.orders);
    return null;
  };

  /**
   * fetchAllOrders(opts)
   * opts:
   *   - fromIso, toIso : optional date filters
   *   - preferAggregatedOnly (boolean) : when true (used for preset === 'all') we WILL use aggregated metrics returned
   *                                       by the main endpoint and SKIP the fallback to /api/admin/orders.
   */
  const fetchAllOrders = useCallback(async (opts?: { fromIso?: string | null; toIso?: string | null; preferAggregatedOnly?: boolean }) => {
    setLoadingOrders(true);
    setServerMessage(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const params = new URLSearchParams();
      if (opts?.fromIso) params.set("from", opts.fromIso);
      if (opts?.toIso) params.set("to", opts.toIso);

      const base = "https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending";
      const url = params.toString() ? `${base}?${params.toString()}` : base;

      console.debug("[fetchAllOrders] requesting", url);
      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        validateStatus: () => true,
      });

      console.debug("[fetchAllOrders] response", res.status, res.data);

      const top = res.data;
      const payload = top?.data ?? top;

      const orders = tryExtractOrders(payload);
      if (orders && orders.length) {
        // raw orders returned directly -> use them
        setAllOrders(orders);
        setAggregatedMetrics(null); // raw rows supersede aggregated metrics
        setServerMessage(top?.message ?? null);
        return;
      }

      // If payload looks like aggregated metrics
      if (payload && (payload.totalOrders || payload.collected || payload.pending)) {
        // parse and store aggregated metrics
        try {
          const totalOrders = Number(payload.totalOrders ?? 0);
          const collected = payload.collected ?? { count: 0, percentage: "0.00" };
          const pending = payload.pending ?? { count: 0, percentage: "0.00" };
          const ratio = payload.ratio ?? { collectedToPending: "0" };

          setAggregatedMetrics({
            totalOrders: Number(totalOrders),
            collected: { count: Number(collected.count ?? 0), percentage: String(collected.percentage ?? "0.00") },
            pending: { count: Number(pending.count ?? 0), percentage: String(pending.percentage ?? "0.00") },
            ratio: { collectedToPending: String(ratio.collectedToPending ?? "0") },
          });
        } catch (ex) {
          console.warn("[fetchAllOrders] failed to parse aggregated payload", ex);
          setAggregatedMetrics(null);
        }

        setServerMessage(top?.message ?? "Server returned aggregated metrics only.");

        // IMPORTANT: when caller asked to prefer aggregated-only (used for preset === 'all'),
        // skip the fallback and trust the aggregated numbers from the API.
        if (opts?.preferAggregatedOnly) {
          setAllOrders([]); // ensure raw list is empty so UI uses aggregatedMetrics
          setLoadingOrders(false);
          return;
        }

        // Otherwise (not preferAggregatedOnly) try the fallback to fetch raw rows (for date filters)
        const fallbackUrl = params.toString()
          ? `https://cod-ecommerce-two.vercel.app/api/admin/orders?${params.toString()}`
          : `https://cod-ecommerce-two.vercel.app/api/admin/orders`;

        try {
          console.debug("[fetchAllOrders] trying fallback", fallbackUrl);
          const r2 = await axios.get(fallbackUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            validateStatus: () => true,
          });
          console.debug("[fetchAllOrders] fallback response", r2.status, r2.data);
          const raw = r2.data?.data ?? r2.data ?? null;
          const orders2 = tryExtractOrders(raw);
          if (orders2 && orders2.length) {
            setAllOrders(orders2);
            setServerMessage("Fetched raw orders from fallback endpoint.");
            return;
          }
          // fallback didn't return rows
          setAllOrders([]);
          setServerMessage("Server returned aggregated metrics and fallback did not return rows.");
          return;
        } catch (err) {
          console.warn("[fetchAllOrders] fallback failed", err);
          setAllOrders([]);
          setServerMessage("Server returned aggregated metrics and fallback request failed. See console.");
          return;
        }
      }

      // unrecognized
      console.warn("Unexpected payload shape:", payload);
      setAllOrders([]);
      setAggregatedMetrics(null);
      setServerMessage("Server returned unexpected data shape. See console.");
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setAllOrders([]);
      setAggregatedMetrics(null);
      setServerMessage("Network or server error. See console.");
    } finally {
      setLoadingOrders(false);
    }
  }, []); // stable: does not reference preset directly; we pass preferAggregatedOnly from caller

  // initial fetch and re-fetch when preset/from/to change
  useEffect(() => {
    const start = parseDateStart(fromDate);
    const end = parseDateEnd(toDate);
    const fromIso = start ? start.toISOString() : null;
    const toIso = end ? end.toISOString() : null;

    // prefer aggregated only when preset === 'all'
    const preferAggregatedOnly = preset === "all";
    fetchAllOrders({ fromIso, toIso, preferAggregatedOnly });
  }, [preset, fromDate, toDate, fetchAllOrders]);

  // preset -> populate from/to inputs in yyyy-mm-dd
  useEffect(() => {
    const [s, e] = getDateRangeForFilter(preset);
    if (s && e) {
      setFromDate(formatLocalDate(s));
      setToDate(formatLocalDate(e));
    } else {
      // keep existing behavior: clear only when preset is not a recognized range
      setFromDate(null);
      setToDate(null);
    }
  }, [preset]);

  // Client-side filtering now uses local yyyy-mm-dd string comparison to avoid timezone drift.
  const filteredOrders = useMemo(() => {
    if (!allOrders || !allOrders.length) return [];

    // if no from/to then include all
    if (!fromDate && !toDate) return allOrders.slice();

    return allOrders.filter((o) => {
      const createdLocal = createdAtToLocalYYYYMMDD(o.createdAt ?? null);
      if (!createdLocal) return false; // exclude if we cannot parse createdAt
      // if fromDate exists and createdLocal < fromDate => exclude
      if (fromDate && createdLocal < fromDate) return false;
      // if toDate exists and createdLocal > toDate => exclude
      if (toDate && createdLocal > toDate) return false;
      return true;
    });
  }, [allOrders, fromDate, toDate]);

  // compute metrics: for preset === 'all' prefer aggregatedMetrics (if present),
  // otherwise compute from filteredOrders as before.
  const computedMetrics = useMemo(() => {
    if (preset === "all" && aggregatedMetrics) {
      // use aggregated server values
      const collectedCount = aggregatedMetrics.collected.count;
      const pendingCount = aggregatedMetrics.pending.count;
      return {
        totalOrders: aggregatedMetrics.totalOrders,
        collected: { count: collectedCount, percentage: aggregatedMetrics.collected.percentage },
        pending: { count: pendingCount, percentage: aggregatedMetrics.pending.percentage },
        ratio: { collectedToPending: aggregatedMetrics.ratio.collectedToPending },
        collectedOrders: [],
        pendingOrders: [],
      } as const;
    }

    // fallback to computing from filteredOrders (for non-'all' presets or when aggregatedMetrics missing)
    const totalOrders = filteredOrders.length;
    const collectedStatuses = new Set(["collected", "delivered", "paid"]);
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
    } as const;
  }, [filteredOrders, aggregatedMetrics, preset]);

  const chartData = useMemo(
    () => [
      { name: "Collected", count: computedMetrics.collected.count, percentage: computedMetrics.collected.percentage },
      { name: "Pending", count: computedMetrics.pending.count, percentage: computedMetrics.pending.percentage },
    ],
    [computedMetrics]
  );

  // handle download PDF (kept as your original button behavior)
  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      const start = parseDateStart(fromDate);
      const end = parseDateEnd(toDate);
      if (start) params.set("from", start.toISOString());
      if (end) params.set("to", end.toISOString());
      const url = params.toString()
        ? `https://cod-ecommerce-two.vercel.app/api/admin/collected-vs-pending/pdf?${params.toString()}`
        : `https://cod-ecommerce-two.vercel.app/api/admin/collected-vs-pending/pdf`;

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
  }, [fromDate, toDate]);

  // Debug first item and counts
  const firstCreatedAt = allOrders[0]?.createdAt ?? null;

  return (
    <div className="lg:p-6 space-y-6 p-4">
      <div className="lg:flex block items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collected vs Pending Orders</h1>
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
            onChange={(e) => { setFromDate(e.target.value || null); setPreset("custom"); }}
            className="border rounded px-2 py-1"
          />
          <label className="text-sm">To:</label>
          <input
            type="date"
            value={toDate ?? ""}
            onChange={(e) => { setToDate(e.target.value || null); setPreset("custom"); }}
            className="border rounded px-2 py-1"
          />

          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* show server message for debug (useful)
      {serverMessage ? (
        <div className="p-3 rounded bg-yellow-50 border border-yellow-200 text-sm">
          <div className="font-medium">Server info</div>
          <div className="text-xs">{serverMessage}</div>
        </div>
      ) : null} */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Orders", value: computedMetrics.totalOrders, trend: "up" },
          { title: "Collected Orders", value: `${computedMetrics.collected.count} (${computedMetrics.collected.percentage}%)`, trend: "up" },
          { title: "Pending Orders", value: `${computedMetrics.pending.count} (${computedMetrics.pending.percentage}%)`, trend: "down" },
          { title: "Collection Ratio", value: computedMetrics.ratio.collectedToPending === "Infinity" ? "100%" : isFinite(Number(computedMetrics.ratio.collectedToPending)) ? `${(Number(computedMetrics.ratio.collectedToPending) * 100).toFixed(2)}%` : "—", trend: "up" },
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
                <Tooltip formatter={(value: any, name: string, props: any) => [`${value} orders (${props.payload?.percentage ?? "0"}%)`, name]} />
                <Bar dataKey="count" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
