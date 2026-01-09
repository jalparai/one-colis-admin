"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import DownloadTopAgentPdf from "../ReportsPdf/DownloadTopAgentPdf";

interface Agent {
  orders: number;
  revenue: number;
  agentId: string | null;
  agentName: string;
  agentEmail?: string;
}

type FilterKey =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

const USE_POST_FALLBACK = true;

export default function TopAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [customFrom, setCustomFrom] = useState<string>(""); // yyyy-mm-dd
  const [customTo, setCustomTo] = useState<string>("");

  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  function getRangeForFilter(key: FilterKey) {
    const today = new Date();
    switch (key) {
      case "today":
        return { from: startOfDay(today).toISOString(), to: endOfDay(today).toISOString() };
      case "yesterday": {
        const y = new Date();
        y.setDate(today.getDate() - 1);
        return { from: startOfDay(y).toISOString(), to: endOfDay(y).toISOString() };
      }
      case "this_week": {
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const monday = startOfDay(new Date(today));
        monday.setDate(today.getDate() - diffToMonday);
        const sunday = endOfDay(new Date(monday));
        sunday.setDate(monday.getDate() + 6);
        return { from: monday.toISOString(), to: sunday.toISOString() };
      }
      case "last_week": {
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const thisMonday = startOfDay(new Date(today));
        thisMonday.setDate(today.getDate() - diffToMonday);
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(thisMonday.getDate() - 7);
        const lastSunday = endOfDay(new Date(lastMonday));
        lastSunday.setDate(lastMonday.getDate() + 6);
        return { from: lastMonday.toISOString(), to: lastSunday.toISOString() };
      }
      case "this_month": {
        const start = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
        const end = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "last_month": {
        const start = startOfDay(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        const end = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "custom": {
        if (!customFrom || !customTo) return null;
        const f = startOfDay(new Date(customFrom));
        const t = endOfDay(new Date(customTo));
        return { from: f.toISOString(), to: t.toISOString() };
      }
      case "all":
      default:
        return null;
    }
  }

  const fetchData = useCallback(
    async (filterKey: FilterKey = "all") => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token in localStorage — make sure you're logged in");

        const range = getRangeForFilter(filterKey);

        const baseUrl = "https://cod-ecommerce-two.vercel.app/api/admin/getTopAgents";
        const params = new URLSearchParams();
        if (range) {
          params.set("from", range.from);
          params.set("to", range.to);
          params.set("startDate", range.from);
          params.set("endDate", range.to);
        }
        const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

        console.info("[TopAgents] Fetching (GET):", url);
        setDebugUrl(url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        const json = await res.json().catch(() => null);
        console.info("[TopAgents] GET status:", res.status, json);

        const payload = json?.data ?? json?.results ?? json?.topAgents ?? json?.agents ?? json ?? null;

        if (res.ok && Array.isArray(payload)) {
          setAgents(payload);
          return;
        }

        if (USE_POST_FALLBACK) {
          console.info("[TopAgents] GET did not return array, attempting POST fallback");

          const postBody: any = {};
          if (range) {
            postBody.from = range.from;
            postBody.to = range.to;
            postBody.startDate = range.from;
            postBody.endDate = range.to;
          }

          console.info("[TopAgents] POST to:", baseUrl, "body:", postBody);

          const postRes = await fetch(baseUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postBody),
          });

          const postJson = await postRes.json().catch(() => null);
          console.info("[TopAgents] POST status:", postRes.status, postJson);

          const postPayload = postJson?.data ?? postJson?.results ?? postJson?.topAgents ?? postJson?.agents ?? postJson ?? null;
          if (postRes.ok && Array.isArray(postPayload)) {
            setAgents(postPayload);
            return;
          }

          const postMessage = postJson?.message ?? postJson?.error ?? `POST failed (${postRes.status})`;
          throw new Error(postMessage);
        }

        console.warn("[TopAgents] GET returned unexpected payload and POST fallback disabled", payload);
        setAgents([]);
        setError("Server returned data in an unexpected format (GET). Check console logs.");
      } catch (err: any) {
        console.error("[TopAgents] Fetch error:", err);
        setError(err.message || "Failed to fetch data — see console for details");
        setAgents([]);
      } finally {
        setLoading(false);
      }
    },
    [customFrom, customTo]
  );

  useEffect(() => {
    if (filter === "custom") return;
    fetchData(filter);
  }, [filter, fetchData]);

  useEffect(() => {
    fetchData("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setError("Please select both From and To dates for custom range");
      return;
    }
    setError(null);
    setFilter("custom");
    fetchData("custom");
  };

  // prepare chart data (empty => [])
  const chartData = agents.length
    ? agents.map((a) => ({ name: a.agentName || "Unknown", orders: a.orders, revenue: a.revenue }))
    : [];

  // compute max for placeholders/progress UI if needed
  const maxOrders = agents.length ? Math.max(...agents.map((a) => a.orders)) : 0;

  // the current ISO range -- passed to PDF downloader
  const currentRange = getRangeForFilter(filter);

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* header + controls */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Top Agents</h1>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterKey)}
            className="border px-2 py-2 rounded"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This week</option>
            <option value="last_week">Last week</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="custom">Custom</option>
          </select>

          {filter === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <button onClick={applyCustomRange} className="bg-primary text-white px-3 py-1 rounded">
                Apply
              </button>
            </>
          )}

          <DownloadTopAgentPdf  />
        </div>
      </div>

      {/* error */}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* cards: always show the grid; show message/placeholder when empty */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
          dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
          *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
          @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
      >
        {agents.length ? (
          agents.map((agent) => (
            <Card key={agent.agentId ?? agent.agentName} data-slot="card">
              <CardHeader>
                <CardDescription>{agent.agentName}</CardDescription>
                <CardTitle className="text-3xl">{agent.orders} Orders</CardTitle>
                <p className="text-sm text-muted-foreground">Revenue: {agent.revenue}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Performing well
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Scale (top = {maxOrders})</div>
              </CardContent>
            </Card>
          ))
        ) : (
          // placeholders / empty message — keeps layout visible while empty
          <>
            <div className="p-6 border rounded-md text-center text-sm text-muted-foreground col-span-1">
              No agents for this date range.
            </div>
            {/* three lightweight placeholder cards to preserve layout */}
            {[0, 1, 2].map((i) => (
              <Card key={`ph-${i}`} data-slot="card">
                <CardHeader>
                  <CardDescription className="opacity-50">—</CardDescription>
                  <CardTitle className="text-3xl opacity-40">—</CardTitle>
                  <p className="text-sm text-muted-foreground opacity-40">—</p>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-slate-100 rounded opacity-30" />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Chart area: if there's no chartData, show a friendly empty state inside the card */}
      <Card>
        <CardHeader>
          <CardTitle>Agents Performance Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 relative">
            {chartData.length ? (
           <ResponsiveContainer width="100%" height="100%">
  <BarChart data={chartData}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar
      dataKey="orders"
      name="Orders"
      fill="#2bc3f1"        
      radius={[8, 8, 0, 0]}
    />
    <Bar
      dataKey="revenue"
      name="Revenue"
      fill="#2bc3f1"        
      radius={[8, 8, 0, 0]}
    />
  </BarChart>
</ResponsiveContainer>

            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No chart data for selected range.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* debug url for QA */}
      {debugUrl && (
        <div className="text-xs text-muted-foreground break-all">
          Request URL: <code>{debugUrl}</code>
        </div>
      )}

      {/* show loading text when fetching (non-blocking) */}
      {loading && <div className="text-sm text-muted-foreground">Refreshing...</div>}
    </div>
  );
}
