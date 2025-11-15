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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // date filters: start/end (yyyy-mm-dd) and selected preset
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<"" | "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth">("all");

  // format Date -> yyyy-mm-dd
  const formatDateForInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // compute preset ranges (weeks start Monday)
  const getPresetRange = (preset: Exclude<typeof selectedPreset, "">): { start: string; end: string } => {
    const now = new Date();
    const startOfWeek = (d: Date) => {
      const copy = new Date(d);
      const day = (copy.getDay() + 6) % 7; // Monday = 0
      copy.setDate(copy.getDate() - day);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };

    if (preset === "all") return { start: "", end: "" };

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
        start = new Date(now);
        end = new Date(now);
        break;
    }

    return { start: formatDateForInput(start), end: formatDateForInput(end) };
  };

  // apply preset: sets start/end and selected preset
  const applyPreset = (preset: typeof selectedPreset) => {
    if (preset === "") return;
    setSelectedPreset(preset);
    const r = getPresetRange(preset as any);
    setStartDate(r.start);
    setEndDate(r.end);
  };

  // detect if current start/end match a preset
  const detectPreset = (): typeof selectedPreset => {
    if (!startDate && !endDate) return "all";
    const presets: Array<Exclude<typeof selectedPreset, "">> = ["today", "yesterday", "lastWeek", "thisWeek", "lastMonth", "thisMonth", "all"];
    for (const p of presets) {
      const r = getPresetRange(p);
      if (r.start === startDate && r.end === endDate) return p as any;
    }
    return "";
  };

  // --- Fetch payouts once on mount ---
  const fetchPayouts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found in localStorage");

      const res = await fetch("https://cod-ecommerce-two.vercel.app/api/admin/financials/payout-history", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server ${res.status}: ${txt}`);
      }

      const json = await res.json();

      const payoutsData: Payout[] = Array.isArray(json.data)
        ? json.data.map((p: any) => ({
            amount: p.amount,
            fees: p.fees,
            netAmount: p.netAmount,
            status: p.status,
            date: p.createdAt,
            sellerName: p.sellerName,
            sellerEmail: p.sellerEmail,
          }))
        : [];

      const pendingData: PendingBalance[] = Array.isArray(json.pendingBalances)
        ? json.pendingBalances.map((b: any) => ({ amount: b.pendingAmount, seller: b.sellerName }))
        : [];

      setPayouts(payoutsData);
      setPendingBalances(pendingData);
      // initialize filter to selectedPreset (default 'all')
      setFilteredPayouts(payoutsData);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch payouts");
      setPayouts([]);
      setPendingBalances([]);
      setFilteredPayouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPayouts();
  }, [fetchPayouts]);

  // update selectedPreset when start/end change (keeps dropdown in sync)
  useEffect(() => {
    const detected = detectPreset();
    if (detected !== selectedPreset) setSelectedPreset(detected);
  }, [startDate, endDate]);

  // filter payouts client-side whenever payouts, startDate, or endDate change
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredPayouts(payouts);
      return;
    }

    const s = startDate ? new Date(startDate + "T00:00:00") : null;
    const e = endDate ? new Date(endDate + "T23:59:59.999") : null;

    const filtered = payouts.filter((p) => {
      const d = new Date(p.date);
      if (s && d < s) return false;
      if (e && d > e) return false;
      return true;
    });

    setFilteredPayouts(filtered);
  }, [payouts, startDate, endDate]);

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="p-3 rounded-md border bg-red-50 text-red-700">{error}</div>;

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

          {/* Filter controls */}
          <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
            <Select value={selectedPreset} onValueChange={(v) => applyPreset(v as any)}>
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

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            />
            <span className="text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            />
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
                      <TableCell className="text-right">DH {p.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">DH {p.fees.toLocaleString()}</TableCell>
                      <TableCell className="text-right">DH {p.netAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right capitalize">{p.status}</TableCell>
                      <TableCell className="text-right">{new Date(p.date).toLocaleDateString()}</TableCell>
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
