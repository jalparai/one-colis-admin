"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface TopProduct {
  _id: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  productId: string | null;
  sku: string;
  productName: string;
  averagePrice: number;
}

interface TopCity {
  _id: string;
  orderCount: number;
  totalRevenue: number;
  totalItems: number;
  city: string;
  averageOrderValue: number;
}

export default function SellerReports() {
  const API_BASE = "https://cod-ecommerce-two.vercel.app";
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCities, setTopCities] = useState<TopCity[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication required");
          return;
        }

        setLoading(true);

        const [productsRes, citiesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/seller/reports/top-products`, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          }),
          axios.get(`${API_BASE}/api/seller/reports/top-cities`, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          }),
        ]);

        if (productsRes.status === 200 && productsRes.data?.data) {
          setTopProducts(productsRes.data.data);
        } else {
          toast.error("Failed to fetch top products");
        }

        if (citiesRes.status === 200 && citiesRes.data?.data) {
          setTopCities(citiesRes.data.data);
        } else {
          toast.error("Failed to fetch top cities");
        }
      } catch (err) {
        console.error("Error fetching reports", err);
        toast.error("Unable to fetch reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] text-gray-500">
        <Loader2 className="animate-spin w-8 h-8 mb-2 text-primary" />
        <p className="text-sm">Fetching your performance data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 animate-in fade-in duration-300">
      {/* ===== Dashboard Header ===== */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Performance Reports</h1>
        <p className="text-sm text-muted-foreground">
          Insights into your best-selling products and most active cities.
        </p>
      </div>

      {/* ===== Top Products Section ===== */}
      <Card className="shadow-sm border-border/60 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
              <CardDescription>Based on sales performance and total revenue</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">
              Showing {topProducts.length} product{topProducts.length !== 1 && "s"}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p._id} className="hover:bg-muted/50">
                      <TableCell>{p.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{p.totalQuantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{p.orderCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.averagePrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No top products found yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===== Top Cities Section ===== */}
      <Card className="shadow-sm border-border/60 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">Top Cities</CardTitle>
              <CardDescription>Regions generating the most revenue and orders</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">
              Showing {topCities.length} cit{topCities.length !== 1 ? "ies" : "y"}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {topCities.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">City</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Items</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Avg. Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCities.map((c) => (
                    <TableRow key={c._id} className="hover:bg-muted/50">
                      <TableCell>{c.city}</TableCell>
                      <TableCell className="text-right font-medium">{c.orderCount}</TableCell>
                      <TableCell className="text-right">{c.totalItems}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.averageOrderValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No city data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
