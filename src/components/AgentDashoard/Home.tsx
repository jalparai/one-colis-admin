"use client";

import { useEffect, useState } from "react";
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

type OverviewResponse = {
  message: string;
  requester?: { id?: string; role?: string };
  totalOrders?: number;
  totalPickups?: number;
  deliveredOrders?: number;
  returnOrders?: number;
  cashCollected?: number;
  statusCounts?: Record<string, number>;
};

export function Home() {
  // data & UI state
  const [stats, setStats] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // date filter state
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom"
  >("all");
  const [startDate, setStartDate] = useState<string | null>(null); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchOverview = async (opts?: { range?: string; start?: string | null; end?: string | null }) => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        // build params — backend may accept 'range' or startDate/endDate; harmless if ignored
        const params: Record<string, string> = {};
        if (opts?.range && opts.range !== "all") params.range = opts.range;
        if (opts?.start) params.startDate = opts.start;
        if (opts?.end) params.endDate = opts.end;

        const res = await axios.get<OverviewResponse>(
          "https://cod-ecommerce-two.vercel.app/api/delivery-agent/stats/overview",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            params,
          }
        );
        if (!mounted) return;
        setStats(res.data || null);
      } catch (err: any) {
        console.error("Error fetching overview stats:", err?.response?.data || err.message);
        if (mounted) setError("Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // If user selects a preset (not custom) we fetch immediately with that preset
    if (dateFilter !== "custom") {
      const rangeParam = dateFilter === "all" ? undefined : dateFilter;
      fetchOverview({ range: rangeParam as any });
    } else {
      // custom: fetch only when user clicks Apply (handled elsewhere)
      // but still fetch default overview for initial mount
      fetchOverview();
    }

    return () => {
      mounted = false;
    };
  }, [dateFilter]);

  // Apply custom range button handler
  const applyCustomRange = async () => {
    // Validate custom dates (basic)
    if (!startDate && !endDate) {
      setError("Select start and/or end date for custom range.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get<OverviewResponse>(
        "https://cod-ecommerce-two.vercel.app/api/delivery-agent/stats/overview",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params,
        }
      );
      setStats(res.data || null);
    } catch (err: any) {
      console.error("Error fetching custom-range overview:", err?.response?.data || err.message);
      setError("Failed to fetch custom range");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n?: number) => (n == null ? "0" : n.toLocaleString());
  const formatCurrency = (n?: number) =>
    n == null ? "0.00" : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      title: "Ready (statusCounts.ready)",
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
            // clear custom dates when switching away
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
          <div className="flex items-center gap-2">
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
            <button
              onClick={applyCustomRange}
              className="px-3 py-1 rounded-md bg-slate-800 text-white text-sm"
            >
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

      {/* Cards grid (keeps your exact style) */}
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
    </div>
  );
}

export default Home;
