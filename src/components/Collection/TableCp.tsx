"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// ✅ Order Type
export type Order = {
  id: string;
  seller: string;
  sellerEmail?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total?: number;
  }[];
  itemsTotal?: number;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export default function CollectedPendingOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Date filter state
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // ✅ Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = res.data?.data || [];
      const normalized = raw.map((o: any) => ({
        id: o.id ?? o._id ?? String(Math.random()),
        seller: o.seller ?? o.sellerName ?? "",
        sellerEmail: o.sellerEmail ?? o.email ?? "",
        items: o.items ?? [],
        totalAmount: o.totalAmount ?? o.total ?? 0,
        status: o.status ?? "",
        notes: o.notes ?? "",
        createdAt: o.createdAt ?? o.orderDate ?? new Date().toISOString(),
      })) as Order[];

      setOrders(normalized);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ Filter by date
  const filteredOrders = useMemo(() => {
    if (dateFilter === "all") return orders;

    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);

      switch (dateFilter) {
        case "today":
          return createdAt >= startOfDay(now) && createdAt <= endOfDay(now);
        case "yesterday": {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return createdAt >= startOfDay(y) && createdAt <= endOfDay(y);
        }
        case "thisWeek": {
          const day = now.getDay();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - day);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return createdAt >= weekStart && createdAt <= weekEnd;
        }
        case "lastWeek": {
          const lastWeekStart = new Date(now);
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
          lastWeekStart.setHours(0, 0, 0, 0);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          lastWeekEnd.setHours(23, 59, 59, 999);
          return createdAt >= lastWeekStart && createdAt <= lastWeekEnd;
        }
        case "thisMonth": {
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          return createdAt >= thisMonthStart && createdAt <= thisMonthEnd;
        }
        case "lastMonth": {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
        }
        default:
          return true;
      }
    });
  }, [orders, dateFilter]);

  // ✅ Show only collected & pending
  const visibleOrders = filteredOrders.filter(
    (o) => o.status.toLowerCase() === "collected" || o.status.toLowerCase() === "pending"
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Collected & Pending Orders</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter} <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[
              { key: "all", label: "All" },
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "thisWeek", label: "This Week" },
              { key: "lastWeek", label: "Last Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
            ].map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onClick={() => setDateFilter(opt.key as typeof dateFilter)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ✅ Orders Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : visibleOrders.length > 0 ? (
              visibleOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.seller}</TableCell>
                  <TableCell>{order.sellerEmail ?? "—"}</TableCell>
                  <TableCell className="capitalize">{order.status}</TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
