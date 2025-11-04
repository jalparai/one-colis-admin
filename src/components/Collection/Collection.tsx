"use client";

import React, { useEffect, useState } from "react";
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
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import DownloadCollectedVsPendingPDF from "../ReportsPdf/DownloadCollectedVsPendingPDF";
import CollectedPendingOrdersTable from "./TableCp";

interface CollectedPendingData {
  totalOrders: number;
  collected: {
    count: number;
    percentage: string;
  };
  pending: {
    count: number;
    percentage: string;
  };
  ratio: {
    collectedToPending: string;
  };
}

export default function CollectedVsPendingPage() {
  const [data, setData] = useState<CollectedPendingData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  if (!data) return <p>Loading...</p>;

  // ✅ Prepare chart data
  const chartData = [
    { name: "Collected", count: data.collected.count, percentage: data.collected.percentage },
    { name: "Pending", count: data.pending.count, percentage: data.pending.percentage },
  ];

  // ✅ Prepare metric cards
  const metrics = [
    {
      title: "Total Orders",
      value: data.totalOrders,
      trend: "up",
    },
    {
      title: "Collected Orders",
      value: `${data.collected.count} (${data.collected.percentage}%)`,
      trend: "up",
    },
    {
      title: "Pending Orders",
      value: `${data.pending.count} (${data.pending.percentage}%)`,
      trend: "down",
    },
    {
      title: "Collection Ratio",
      value: `${(parseFloat(data.ratio.collectedToPending) * 100).toFixed(2)}%`,
      trend: "up",
    },
  ];

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Collected vs Pending Orders</h1>
        <DownloadCollectedVsPendingPDF />
      </div>

      {/* ✅ Metric Cards */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card 
        dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 
        *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs 
        md:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric, index) => {
          const isPositive = metric.trend === "up";
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          const trendText = isPositive ? "Trending up" : "Trending down";

          return (
            <Card key={index} className="@container/card" data-slot="card">
              <CardHeader>
                <CardDescription>{metric.title}</CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {metric.value}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendIcon
                    className={`h-4 w-4 ${
                      isPositive ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  {trendText}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* ✅ Bar Chart */}
      <Card className="bg-gradient-to-t from-[#2BC3F1]/5 to-[#E0B660]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Orders Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string, props: any) => [
                    `${value} orders (${props.payload.percentage}%)`,
                    name,
                  ]}
                />
                <Bar dataKey="count" fill="#2BC3F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <CollectedPendingOrdersTable />
    </div>
  );
}
