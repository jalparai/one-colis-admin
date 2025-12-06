"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import DownloadTopProductsPdf from "../ReportsPdf/DownloadTopProductsPdf";

interface ProductData {
  quantity: number;
  revenue: number;
  name: string;
  ordersCount: number;
}
export default function TopProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // date filters - empty string means "all time"
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // helper: format Date -> yyyy-mm-dd for input[type=date]
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // presets (dropdown options: today, yesterday, lastWeek, thisWeek, lastMonth, thisMonth, all)
  const applyPreset = (preset: "today" | "yesterday" | "lastWeek" | "thisWeek" | "lastMonth" | "thisMonth" | "all") => {
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    const now = new Date();

    const startOfWeek = (d: Date) => {
      // week starting Monday
      const copy = new Date(d);
      const day = (copy.getDay() + 6) % 7; // 0 = Monday
      copy.setDate(copy.getDate() - day);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };

    let start: Date;
    let end: Date;

    switch (preset) {
      case "today":
        start = new Date(now);
        end = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        start = new Date(now);
        start.setDate(now.getDate() - 1);
        end = new Date(start);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastWeek": {
        const thisMonday = startOfWeek(now);
        start = new Date(thisMonday);
        start.setDate(thisMonday.getDate() - 7);
        end = new Date(thisMonday);
        end.setDate(thisMonday.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "thisWeek":
        start = startOfWeek(now);
        end = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date();
        end = new Date();
        break;
    }

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };


  const fetchTopProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const url = new URL(
        "https://cod-ecommerce-two.vercel.app/api/admin/top-products"
      );

      // attach date params only when present
      if (startDate) url.searchParams.append("startDate", startDate);
      if (endDate) url.searchParams.append("endDate", endDate);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded ${res.status}: ${text}`);
      }

      const json = await res.json();
      // defensive: ensure array
      const data = Array.isArray(json.data) ? json.data : [];
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch top products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  // Derived chart data
  const chartData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    quantity: p.quantity,
    revenue: p.revenue,
  }));

  const chartWidth = Math.max(700, products.length * 90);

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Header with date filters and download */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Top Products</h1>
          <p className="text-sm text-muted-foreground">Filter by date range — affects chart, table and PDF export.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Preset buttons */}
          <div className="lg:flex gap-2">
        <select
  onChange={(e) => {
    applyPreset(e.target.value as any);
  }}
  defaultValue=""
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

<input
  type="date"
  value={endDate}
  onChange={(e) => setEndDate(e.target.value)}
  className="border rounded-md px-2 py-1 text-sm"
/>

            
            

            {/* pass dates to PDF downloader so export matches filter */}
            <DownloadTopProductsPdf  />
          </div>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && <p>Loading...</p>}
      {error && (
        <div className="p-3 rounded-md border bg-red-50 text-red-700">{error}</div>
      )}

      {/* Chart */}
      <Card className="bg-gradient-to-t from-[#F59E0B]/5 to-[#3B82F6]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Top Products Revenue Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            <div style={{ width: chartWidth, minWidth: 700, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={60} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} formatter={(value: number) => `${value.toLocaleString()} DH`} />
                  <Bar dataKey="revenue" fill="#2BC3F1" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold uppercase text-xs tracking-wider">Product</TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Quantity</TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Orders</TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium truncate max-w-[250px]">{product.name}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{product.ordersCount}</TableCell>
                    <TableCell className="text-right font-semibold text-[#2BC3F1]">{product.revenue.toLocaleString()} DH</TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No products found for selected date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
