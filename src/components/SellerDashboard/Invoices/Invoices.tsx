"use client";

import * as React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DownloadIcon, RefreshCcwIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
    const endpoint = "https://cod-ecommerce-two.vercel.app/api/admin/get-all-invoices";
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

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const sellerName = (inv.seller?.name || inv.seller?.storeName || inv.seller?.email || "").toLowerCase();
      return (
        String(inv.invoiceNumber || "").toLowerCase().includes(q) ||
        sellerName.includes(q) ||
        String(inv.status || "").toLowerCase().includes(q)
      );
    });
  }, [invoices, filter]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-3">
        <Input
          placeholder="Search invoices..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
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
                      <div>{inv.periodType || "—"}</div>
                      <div className="text-muted-foreground">
                        {inv.periodStart ? new Date(inv.periodStart).toLocaleDateString() : "—"} → {inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString() : "—"}
                      </div>
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