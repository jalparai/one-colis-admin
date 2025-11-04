"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/top-products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!products.length) return <p>No products found.</p>;

  const chartData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    quantity: p.quantity,
    revenue: p.revenue,
  }));

  // ✅ dynamic width for horizontal scroll
  const chartWidth = Math.max(700, products.length * 90); // auto expand when many products

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Top Products</h1>
        <DownloadTopProductsPdf />
      </div>

      {/* ✅ Chart Section */}
      <Card className="bg-gradient-to-t from-[#F59E0B]/5 to-[#3B82F6]/5 shadow-sm border rounded-2xl">
        <CardHeader>
          <CardTitle>Top Products Revenue Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ scroll horizontally when many bars */}
          <div className="h-96 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            <div style={{ width: chartWidth, minWidth: 700, height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#2BC3F1"
                    radius={[8, 8, 0, 0]}
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold uppercase text-xs tracking-wider">
                    Product
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">
                    Quantity
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">
                    Orders
                  </TableHead>
                  <TableHead className="font-semibold uppercase text-xs tracking-wider text-right">
                    Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium truncate max-w-[250px]">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.ordersCount}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#2BC3F1]">
                      ${product.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
