"use client";

import * as React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DownloadIcon, RefreshCcwIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SellerLite = { _id: string; name?: string; storeName?: string; email?: string } | null;

export type Invoice = {
  _id: string;
  seller: SellerLite;
  invoiceNumber: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  totals: { grossAmount: number; taxAmount: number; commissionAmount: number; netAmount: number };
  currency: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

interface InvoicesTableProps {
  mode: "admin" | "seller";
}

export default function InvoicesTableAdmin() {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");

  // date filter states
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");
  const [fromDate, setFromDate] = React.useState<string>(""); // yyyy-mm-dd
  const [toDate, setToDate] = React.useState<string>(""); // yyyy-mm-dd

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // helper to extract array from different response shapes
  const extractArrayFromPayload = (payload: any): any[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.invoices)) return payload.invoices;
    if (Array.isArray(payload.results)) return payload.results;
    // fallback: first array property
    for (const k of Object.keys(payload || {})) {
      if (Array.isArray(payload[k])) return payload[k];
    }
    return [];
  };

  // low-level fetch that returns array (does not mutate state)
  const fetchInvoicesRaw = React.useCallback(async (): Promise<Invoice[]> => {
    const endpoint = "https://cod-ecommerce-two.vercel.app/api/seller/get-all-invoices";
    const res = await axios.get(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" } : { "Cache-Control": "no-cache" },
      params: { _t: Date.now() }, // cache buster
    });
    const arr = extractArrayFromPayload(res.data).slice();
    // sort newest first
    arr.sort((a: any, b: any) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    return arr;
  }, [token]);

  // normal fetch that updates state & loading
  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const arr = await fetchInvoicesRaw();
      setInvoices(arr);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [fetchInvoicesRaw]);

  React.useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh + short polling if backend generation is async
  const refreshAndPoll = React.useCallback(async (opts?: { maxTries?: number; intervalMs?: number }) => {
    const maxTries = opts?.maxTries ?? 10;
    const intervalMs = opts?.intervalMs ?? 1000;

    try {
      // quick immediate fetch
      const before = invoices.length;
      const first = await fetchInvoicesRaw();
      if (first.length > before) {
        setInvoices(first);
        return;
      }

      // poll until new item appears (or timeout)
      let tries = 0;
      while (tries < maxTries) {
        await new Promise((r) => setTimeout(r, intervalMs));
        const arr = await fetchInvoicesRaw();
        if (arr.length > before) {
          setInvoices(arr);
          return;
        }
        tries++;
      }

      // final fallback: just set latest even if count same
      const last = await fetchInvoicesRaw();
      setInvoices(last);
    } catch (err) {
      console.error("Error during refreshAndPoll:", err);
    }
  }, [fetchInvoicesRaw, invoices.length]);

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const pdfEndpoint = `https://cod-ecommerce-two.vercel.app/api/admin/invoices/${invoiceId}/pdf`;
      const res = await axios.get(pdfEndpoint, { headers: token ? { Authorization: `Bearer ${token}` } : {}, responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF");
    }
  };

  // --- date helpers ---
  const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
  };
  const startOfWeek = (d: Date) => {
    const c = new Date(d);
    c.setDate(c.getDate() - c.getDay());
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfWeek = (d: Date) => {
    const s = startOfWeek(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return endOfDay(e);
  };
  const startOfMonth = (d: Date) => {
    const c = new Date(d.getFullYear(), d.getMonth(), 1);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfMonth = (d: Date) => {
    const c = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return endOfDay(c);
  };
  const formatISODate = (d: Date) => d.toISOString().slice(0, 10);

  // Apply preset: sets dateFilter AND updates fromDate/toDate so both controls stay in sync.
  const applyPreset = (preset: typeof dateFilter) => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case "all":
        from = null;
        to = null;
        break;
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday": {
        const y = new Date();
        y.setDate(today.getDate() - 1);
        from = startOfDay(y);
        to = endOfDay(y);
        break;
      }
      case "thisWeek":
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      case "lastWeek": {
        // compute last week relative to today
        const lwRef = new Date(today);
        lwRef.setDate(today.getDate() - 7);
        const lwStart = startOfWeek(lwRef);
        from = lwStart;
        to = endOfWeek(lwStart);
        break;
      }
      case "thisMonth":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "lastMonth": {
        const lm = new Date();
        lm.setMonth(lm.getMonth() - 1);
        from = startOfMonth(lm);
        to = endOfMonth(lm);
        break;
      }
    }

    setDateFilter(preset);
    setFromDate(from ? formatISODate(from) : "");
    setToDate(to ? formatISODate(to) : "");
  };

  // filtered invoices by search + date (range priority: from/to > preset)
  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();

    // create date bounds if provided
    const hasFrom = !!fromDate;
    const hasTo = !!toDate;
    let fromBound: Date | null = null;
    let toBound: Date | null = null;
    if (hasFrom) {
      const parsed = new Date(fromDate);
      if (!isNaN(parsed.getTime())) fromBound = startOfDay(parsed);
    }
    if (hasTo) {
      const parsed = new Date(toDate);
      if (!isNaN(parsed.getTime())) toBound = endOfDay(parsed);
    }

    // if no custom range, but preset selected (and not 'all'), compute bounds for preset
    if (!hasFrom && !hasTo && dateFilter !== "all") {
      const today = new Date();
      switch (dateFilter) {
        case "today":
          fromBound = startOfDay(today);
          toBound = endOfDay(today);
          break;
        case "yesterday": {
          const y = new Date();
          y.setDate(today.getDate() - 1);
          fromBound = startOfDay(y);
          toBound = endOfDay(y);
          break;
        }
        case "thisWeek":
          fromBound = startOfWeek(today);
          toBound = endOfWeek(today);
          break;
        case "lastWeek": {
          const lwRef = new Date(today);
          lwRef.setDate(today.getDate() - 7);
          const lwStart = startOfWeek(lwRef);
          fromBound = lwStart;
          toBound = endOfWeek(lwStart);
          break;
        }
        case "thisMonth":
          fromBound = startOfMonth(today);
          toBound = endOfMonth(today);
          break;
        case "lastMonth": {
          const lm = new Date();
          lm.setMonth(lm.getMonth() - 1);
          fromBound = startOfMonth(lm);
          toBound = endOfMonth(lm);
          break;
        }
      }
    }

    return invoices.filter((inv) => {
      // search filter
      if (q) {
        const sellerName = (inv.seller?.name || inv.seller?.storeName || inv.seller?.email || "").toLowerCase();
        const matches =
          String(inv.invoiceNumber || "").toLowerCase().includes(q) ||
          sellerName.includes(q) ||
          String(inv.status || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // date filter if bounds exist
      if (fromBound || toBound) {
        if (!inv.createdAt) return false;
        const d = new Date(inv.createdAt);
        if (isNaN(d.getTime())) return false;
        if (fromBound && toBound) {
          return d >= fromBound && d <= toBound;
        } else if (fromBound) {
          return d >= fromBound;
        } else if (toBound) {
          return d <= toBound;
        }
      }

      return true;
    });
  }, [invoices, filter, fromDate, toDate, dateFilter]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-3 flex-wrap">
        <Input
          placeholder="Search invoices..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />

        {/* date controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {dateFilter === "all" ? "All" :
                  dateFilter === "today" ? "Today" :
                  dateFilter === "yesterday" ? "Yesterday" :
                  dateFilter === "thisWeek" ? "This Week" :
                  dateFilter === "lastWeek" ? "Last Week" :
                  dateFilter === "thisMonth" ? "This Month" :
                  "Last Month"
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => applyPreset("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("yesterday")}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("thisWeek")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("lastWeek")}>Last Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("thisMonth")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPreset("lastMonth")}>Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
            <label className="text-sm hidden md:inline">From:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
              className="max-w-[160px]"
            />
            <label className="text-sm hidden md:inline ml-2">To:</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
              className="max-w-[160px]"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setDateFilter("all");
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refreshAndPoll({ maxTries: 12, intervalMs: 1000 })}>
            <RefreshCcwIcon className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead># Invoice</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Totals</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">Loading invoices...</TableCell>
              </TableRow>
            ) : filtered.length ? (
              filtered.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    {inv.seller ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{inv.seller.name || inv.seller.storeName || "—"}</span>
                        <span className="text-xs text-muted-foreground">{inv.seller.email || "—"}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {/* keep the same placeholder value you had */}
                      3 days
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{inv.status || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs leading-5">
                      <div>Gross: {inv.totals?.grossAmount ?? "—"} {inv.currency ?? ""}</div>
                      <div>Tax: {inv.totals?.taxAmount ?? "—"} {inv.currency ?? ""}</div>
                      <div>Commission: {inv.totals?.commissionAmount ?? "—"} {inv.currency ?? ""}</div>
                      <div className="font-semibold">Net: {inv.totals?.netAmount ?? "—"} {inv.currency ?? ""}</div>
                    </div>
                  </TableCell>
                  <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => handleDownloadPdf(inv._id)}>
                        <DownloadIcon className="h-4 w-4 mr-2" /> PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">No invoices found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
