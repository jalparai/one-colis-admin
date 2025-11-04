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
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import DownloadPayoutHistoryPdf from "../ReportsPdf/PayoutHistory";

interface Payout {
  amount: number;
  fees: number;
  netAmount: number;
  status: string;
  date: string;
  sellerName: string;
  sellerEmail: string;
}

interface PendingBalance {
  amount: number;
  seller: string;
}

export default function PayoutHistoryPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [pendingBalances, setPendingBalances] = useState<PendingBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // --- Fetch API ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found in localStorage");
      return;
    }

    fetch("https://cod-ecommerce-two.vercel.app/api/admin/financials/payout-history", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const payoutsData = Array.isArray(res.data)
          ? res.data.map((p: any) => ({
              amount: p.amount,
              fees: p.fees,
              netAmount: p.netAmount,
              status: p.status,
              date: p.createdAt,
              sellerName: p.sellerName,
              sellerEmail: p.sellerEmail,
            }))
          : [];

        const pendingData = Array.isArray(res.pendingBalances)
          ? res.pendingBalances.map((b: any) => ({
              amount: b.pendingAmount,
              seller: b.sellerName,
            }))
          : [];

        setPayouts(payoutsData);
        setPendingBalances(pendingData);
        setFilteredPayouts(payoutsData);
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // --- Filter logic (no date-fns) ---
  useEffect(() => {
    const now = new Date();
    const startOfWeek = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };
    const endOfWeek = (d: Date) => {
      const s = startOfWeek(new Date(d));
      return new Date(s.setDate(s.getDate() + 6));
    };

    const filtered = payouts.filter((p) => {
      const date = new Date(p.date);
      const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

      switch (dateFilter) {
        case "today":
          return sameDay(date, now);
        case "yesterday":
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return sameDay(date, y);
        case "thisWeek":
          return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
        case "lastWeek":
          const lastWStart = startOfWeek(new Date(now.setDate(now.getDate() - 7)));
          const lastWEnd = endOfWeek(new Date(now));
          return date >= lastWStart && date <= lastWEnd;
        case "thisMonth":
          return (
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear()
          );
        case "lastMonth":
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return (
            date.getMonth() === lastMonth.getMonth() &&
            date.getFullYear() === lastMonth.getFullYear()
          );
        default:
          return true;
      }
    });

    setFilteredPayouts(filtered);
  }, [dateFilter, payouts]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="lg:p-6 space-y-6 p-0">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">💰 Payout History</h1>
        <DownloadPayoutHistoryPdf />
      </div>

      {/* Pending Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBalances.length === 0 ? (
            <p className="text-muted-foreground text-sm">✅ No pending balances</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Pending Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBalances.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell>{b.seller}</TableCell>
                      <TableCell className="text-right">${b.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Transactions */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Payout Transactions</CardTitle>

          {/* ✅ Filter dropdown */}
          <div className="flex items-center gap-2">
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPayouts.length === 0 ? (
            <p className="text-muted-foreground text-sm">📭 No payouts found for this range</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Seller Name</TableHead>
                    <TableHead>Seller Email</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Fees</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.sellerName}</TableCell>
                      <TableCell>{p.sellerEmail}</TableCell>
                      <TableCell className="text-right">${p.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${p.fees.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${p.netAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right capitalize">{p.status}</TableCell>
                      <TableCell className="text-right">
                        {new Date(p.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
