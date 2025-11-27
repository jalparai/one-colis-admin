// Home.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  IconPackage,
  IconTruckDelivery,
  IconCheck,
  IconRotate2,
  IconCurrencyDollar,
  IconClock,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type OverviewResponse = {
  message?: string;
  requester?: { id?: string; role?: string };
  totalOrders?: number;
  totalPickups?: number;
  deliveredOrders?: number;
  returnOrders?: number;
  cashCollected?: number;
  statusCounts?: Record<string, number>;
};

// ---------- Helpers ----------
const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const computeRange = (
  filter:
    | "all"
    | "today"
    | "yesterday"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "lastMonth"
    | "custom"
) => {
  const now = new Date();
  const today = formatDate(now);

  switch (filter) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return { start: formatDate(y), end: formatDate(y) };
    }
    case "thisWeek": {
      // Monday start
      const dayIndex = (now.getDay() + 6) % 7; // 0 = Mon
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayIndex);
      return { start: formatDate(monday), end: today };
    }
    case "lastWeek": {
      const dayIndex = (now.getDay() + 6) % 7;
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - dayIndex - 1); // previous Sunday
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return { start: formatDate(lastWeekStart), end: formatDate(lastWeekEnd) };
    }
    case "thisMonth": {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDate(startMonth), end: today };
    }
    case "lastMonth": {
      const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLast = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: formatDate(startLast), end: formatDate(endLast) };
    }
    default:
      return {};
  }
};

// Build params helper that provides multiple common keys so the backend can accept any variant
const buildParams = (opts?: { range?: string; start?: string | null; end?: string | null }) => {
  const params: Record<string, string> = {};
  if (!opts) return params;
  if (opts.range && opts.range !== "all") params.range = opts.range;

  if (opts.start) {
    params.startDate = opts.start;
    params.start = opts.start;
    params.from = opts.start;
  }
  if (opts.end) {
    params.endDate = opts.end;
    params.end = opts.end;
    params.to = opts.end;
  }
  return params;
};

// ---------- RecentOrder type ----------
type RecentOrder = {
  id: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};

// ---------- Home component ----------
export function Home() {
  // overview state
  const [stats, setStats] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // filter state
  const [dateFilter, setDateFilter] = useState<
    | "all"
    | "today"
    | "yesterday"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "lastMonth"
    | "custom"
  >("all");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // recent orders state
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const RECENT_COUNT = 10;

  // ---------- Fetch overview ----------
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchOverview = async (opts?: { range?: string; start?: string | null; end?: string | null }) => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const params = buildParams(opts);

        const res = await axios.get<OverviewResponse>(
          "https://cod-ecommerce-two.vercel.app/api/delivery-agent/stats/overview",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            params,
            signal: controller.signal,
          }
        );

        if (!mounted) return;
        setStats(res.data || null);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.message === "canceled") {
          return;
        }
        console.error("Error fetching overview stats:", err?.response?.data || err.message);
        if (mounted) setError("Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (dateFilter !== "custom") {
      const range = computeRange(dateFilter);
      if (!range || Object.keys(range).length === 0) {
        fetchOverview({ range: "all" });
      } else {
        fetchOverview({ range: dateFilter, start: (range as any).start, end: (range as any).end });
      }
    } else {
      // custom: don't auto-apply server-side until user clicks Apply
      fetchOverview();
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [dateFilter]);

  // ---------- Apply custom range ----------
  const applyCustomRange = async () => {
    setError(null);
    // validation
    if (!startDate && !endDate) {
      setError("Select start and/or end date for custom range.");
      return;
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (s.getTime() > e.getTime()) {
        setError("Start date cannot be after end date.");
        return;
      }
    }

    setLoading(true);
    try {
      setDateFilter("custom");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const params = buildParams({ range: "custom", start: startDate ?? null, end: endDate ?? null });

      const res = await axios.get<OverviewResponse>(
        "https://cod-ecommerce-two.vercel.app/api/delivery-agent/stats/overview",
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, params }
      );
      setStats(res.data || null);
    } catch (err: any) {
      console.error("Error fetching custom-range overview:", err?.response?.data || err.message);
      setError("Failed to fetch custom range");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Fetch recent orders ----------
  const fetchRecentOrders = async (opts?: { range?: string; start?: string | null; end?: string | null }) => {
    setRecentLoading(true);
    setRecentError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const params = buildParams(opts);
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/delivery-agent/me/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
        timeout: 15000,
      });

      const raw: any[] = res.data?.data ?? [];
      const normalized: RecentOrder[] = (raw || [])
        .map((o: any) => {
          const dbId = o._id ?? o.id ?? o.code ?? null;
          const orderId =
            o.orderId ??
            o.trackingNumber ??
            o.tracking_no ??
            o.order_number ??
            o.orderNo ??
            o.code ??
            dbId ??
            "";

          const cust = o.customer ?? o.customerInfo ?? o.shippingAddress ?? o.shipping ?? {};
          const customerName = cust?.name ?? cust?.fullName ?? cust?.contactName ?? undefined;
          const customerPhone = cust?.phone ?? cust?.mobile ?? cust?.contact?.phone ?? undefined;

          return {
            id: dbId ?? orderId,
            orderId,
            customerName,
            customerPhone,
            totalAmount: Number(o.totalAmount ?? o.total ?? o.grandTotal ?? 0),
            status: o.status ?? "",
            createdAt: o.createdAt ?? o.orderDate ?? new Date().toISOString(),
          } as RecentOrder;
        })
        .sort((a, b) => {
          const ta = new Date(a.createdAt ?? 0).getTime();
          const tb = new Date(b.createdAt ?? 0).getTime();
          return tb - ta;
        })
        .slice(0, RECENT_COUNT);

      setRecentOrders(normalized);
    } catch (err: any) {
      console.error("Error fetching recent orders:", err);
      setRecentError(err?.response?.data?.message ?? err?.message ?? "Failed to fetch recent orders");
    } finally {
      setRecentLoading(false);
    }
  };

  // Auto-fetch recent orders whenever the dateFilter or custom dates change
  useEffect(() => {
    if (dateFilter !== "custom") {
      const range = computeRange(dateFilter);
      if (!range || Object.keys(range).length === 0) {
        fetchRecentOrders({ range: "all" });
      } else {
        fetchRecentOrders({ range: dateFilter, start: (range as any).start, end: (range as any).end });
      }
    } else {
      if (startDate || endDate) {
        fetchRecentOrders({ range: "custom", start: startDate ?? null, end: endDate ?? null });
      } else {
        fetchRecentOrders();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, startDate, endDate]);

  // ---------- formatting helpers ----------
  const formatNumber = (n?: number) => (n == null ? "0" : n.toLocaleString());
  const formatCurrency = (n?: number) =>
    n == null ? "0.00" : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- cards ----------
  const cards = [
    {
      key: "totalOrders",
      title: "Total Orders",
      value: formatNumber(stats?.totalOrders),
      subtitle: "Orders assigned",
      icon: <IconTruckDelivery className="w-5 h-5" />,
      badge: stats?.requester?.role ?? "agent",
    },
    {
      key: "totalPickups",
      title: "Total Pickups",
      value: formatNumber(stats?.totalPickups),
      subtitle: "Pickup tasks",
      icon: <IconPackage className="w-5 h-5" />,
      badge: "Active",
    },
    {
      key: "deliveredOrders",
      title: "Delivered",
      value: formatNumber(stats?.deliveredOrders),
      subtitle: "Completed deliveries",
      icon: <IconCheck className="w-5 h-5" />,
      badge: "Success",
    },
    {
      key: "returnOrders",
      title: "Returned",
      value: formatNumber(stats?.returnOrders),
      subtitle: "Return attempts",
      icon: <IconRotate2 className="w-5 h-5" />,
      badge: "Returns",
    },
    {
      key: "cashCollected",
      title: "Cash Collected",
      value: formatCurrency(stats?.cashCollected),
      subtitle: "Collected from customers",
      icon: <IconCurrencyDollar className="w-5 h-5" />,
      badge: "COD",
    },
    {
      key: "readyCount",
      title: "Ready",
      value: formatNumber(stats?.statusCounts?.ready),
      subtitle: "Orders ready for action",
      icon: <IconClock className="w-5 h-5" />,
      badge: "Ready",
    },
  ];

  return (
    <div>
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-4 lg:px-6">
        <label className="text-sm font-medium">Date:</label>
        <select
          value={dateFilter}
          onChange={(e) => {
            const v = e.target.value as any;
            setDateFilter(v);
            if (v !== "custom") {
              setStartDate(null);
              setEndDate(null);
            }
          }}
          className="px-3 py-1 rounded-md border bg-white"
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="thisWeek">This Week</option>
          <option value="lastWeek">Last Week</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateFilter === "custom" && (
          <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
            <input
              type="date"
              value={startDate ?? ""}
              onChange={(e) => setStartDate(e.target.value || null)}
              className="px-2 py-1 rounded-md border bg-white"
            />
            <span className="text-sm">—</span>
            <input
              type="date"
              value={endDate ?? ""}
              onChange={(e) => setEndDate(e.target.value || null)}
              className="px-2 py-1 rounded-md border bg-white"
            />
            <button onClick={applyCustomRange} className="px-3 py-1 rounded-md bg-slate-800 text-white text-sm">
              Apply
            </button>
            <button
              onClick={() => {
                setDateFilter("all");
                setStartDate(null);
                setEndDate(null);
              }}
              className="px-3 py-1 rounded-md border text-sm"
            >
              Clear
            </button>
          </div>
        )}

        <div className="ml-auto text-sm text-muted-foreground">{error && <span className="text-rose-600">{error}</span>}</div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs">
        {loading ? (
          <Card className="@container/card" data-slot="card">
            <CardHeader>
              <CardDescription>Loading overview…</CardDescription>
              <CardTitle className="text-2xl">Loading…</CardTitle>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">Please wait</CardFooter>
          </Card>
        ) : (
          cards.map((c) => (
            <Card key={c.key} className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>{c.title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @{250px}/card:text-3xl">{c.value}</CardTitle>
                <CardAction>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {c.icon}
                    <span>{c.badge}</span>
                  </Badge>
                </CardAction>
              </CardHeader>

              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">{c.subtitle}</div>
                <div className="text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Recent Orders (bottom) */}
      <div className="mt-8 px-4 lg:px-6">
        <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>

        {recentLoading ? (
          <div className="p-4">Loading recent orders…</div>
        ) : recentError ? (
          <div className="p-4 text-rose-600">Error: {recentError}</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-4 text-muted-foreground">No recent orders found.</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{r.orderId}</td>
                    <td className="px-3 py-2">{r.customerName ?? "-"}</td>
                    <td className="px-3 py-2">{r.customerPhone ?? "-"}</td>
                    <td className="px-3 py-2">{Number(r.totalAmount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100">{r.status}</span>
                    </td>
                    <td className="px-3 py-2">{new Date(r.createdAt ?? "").toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="outline" onClick={() => fetchRecentOrders()}>
            Refresh Recent
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
