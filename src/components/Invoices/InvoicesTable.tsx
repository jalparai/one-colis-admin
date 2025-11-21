"use client";

import * as React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DownloadIcon, RefreshCcwIcon } from "lucide-react";
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

export default function InvoicesTableAdmin() {
  // core state
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState(""); // text filter

  // date filter state
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom"
  >("all");
  const [customStart, setCustomStart] = React.useState<string | null>(null); // YYYY-MM-DD
  const [customEnd, setCustomEnd] = React.useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // Preview state
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [downloadFilename, setDownloadFilename] = React.useState<string | null>(null);

  // ---------- Helpers ----------
  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Compute start/end for presets. Monday as week start.
  const computeRange = (
    filter:
      | "all"
      | "today"
      | "yesterday"
      | "thisWeek"
      | "lastWeek"
      | "thisMonth"
      | "lastMonth"
      | "custom"
  ) => {
    const now = new Date();
    const today = formatDate(now);

    switch (filter) {
      case "today":
        return { start: today, end: today };
      case "yesterday": {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        return { start: formatDate(y), end: formatDate(y) };
      }
      case "thisWeek": {
        const dayIndex = (now.getDay() + 6) % 7; // 0 = Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayIndex);
        return { start: formatDate(monday), end: today };
      }
      case "lastWeek": {
        const dayIndex = (now.getDay() + 6) % 7;
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - dayIndex - 1); // previous Sunday
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        return { start: formatDate(lastWeekStart), end: formatDate(lastWeekEnd) };
      }
      case "thisMonth": {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: formatDate(startMonth), end: today };
      }
      case "lastMonth": {
        const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLast = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: formatDate(startLast), end: formatDate(endLast) };
      }
      default:
        return {};
    }
  };

  // Build params helper that supplies several commonly-used keys (server may accept any)
  const buildParams = (opts?: { range?: string; start?: string | null; end?: string | null }) => {
    const params: Record<string, string> = {};
    if (!opts) return params;
    if (opts.range && opts.range !== "all") params.range = opts.range;
    if (opts.start) {
      params.startDate = opts.start;
      params.start = opts.start;
      params.from = opts.start;
    }
    if (opts.end) {
      params.endDate = opts.end;
      params.end = opts.end;
      params.to = opts.end;
    }
    return params;
  };

  // Extract array from different response shapes
  const extractArrayFromPayload = (payload: any): any[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.invoices)) return payload.invoices;
    if (Array.isArray(payload.results)) return payload.results;
    for (const k of Object.keys(payload || {})) {
      if (Array.isArray(payload[k])) return payload[k];
    }
    return [];
  };

  // ---------- Fetch functions (server-side) ----------
  // fetchInvoicesRaw accepts optional date opts and returns array (does not mutate loading)
  const fetchInvoicesRaw = React.useCallback(
    async (opts?: { range?: string; start?: string | null; end?: string | null }) => {
      const endpoint = "https://cod-ecommerce-two.vercel.app/api/admin/get-all-invoices";
      const params = { ...buildParams(opts), _t: Date.now() }; // cache buster
      const res = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" } : { "Cache-Control": "no-cache" },
        params,
      });
      const arr = extractArrayFromPayload(res.data).slice();
      arr.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return arr as Invoice[];
    },
    [token]
  );

  // fetchInvoices updates state & sets loading
  const fetchInvoices = React.useCallback(
    async (opts?: { range?: string; start?: string | null; end?: string | null }) => {
      setLoading(true);
      try {
        const arr = await fetchInvoicesRaw(opts);
        setInvoices(arr);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchInvoicesRaw]
  );

  // initial load
  React.useEffect(() => {
    // On mount, use current dateFilter if not custom; else fetch all and wait for custom Apply
    if (dateFilter !== "custom") {
      const range = computeRange(dateFilter);
      if (!range || Object.keys(range).length === 0) {
        fetchInvoices({ range: "all" });
      } else {
        fetchInvoices({ range: dateFilter, start: (range as any).start, end: (range as any).end });
      }
    } else {
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when a preset dateFilter changes (but not when user is in custom mode)
  React.useEffect(() => {
    if (dateFilter !== "custom") {
      const range = computeRange(dateFilter);
      if (!range || Object.keys(range).length === 0) {
        fetchInvoices({ range: "all" });
      } else {
        fetchInvoices({ range: dateFilter, start: (range as any).start, end: (range as any).end });
      }
    }
  }, [dateFilter, fetchInvoices]);

  // Apply custom range (user clicks Apply)
  const applyCustomRange = async () => {
    // basic validation
    if (!customStart && !customEnd) {
      alert("Please choose start and/or end date for custom range.");
      return;
    }
    if (customStart && customEnd) {
      if (new Date(customStart).getTime() > new Date(customEnd).getTime()) {
        alert("Start date cannot be after end date.");
        return;
      }
    }
    setDateFilter("custom");
    await fetchInvoices({ range: "custom", start: customStart ?? null, end: customEnd ?? null });
  };

  // Clear custom filter and reset to All
  const clearCustomRange = async () => {
    setCustomStart(null);
    setCustomEnd(null);
    setDateFilter("all");
    await fetchInvoices({ range: "all" });
  };

  // Refresh + poll if backend generation is async (accept opts)
  const refreshAndPoll = React.useCallback(
    async (opts?: { maxTries?: number; intervalMs?: number; rangeOpts?: { range?: string; start?: string | null; end?: string | null } }) => {
      const maxTries = opts?.maxTries ?? 10;
      const intervalMs = opts?.intervalMs ?? 1000;
      const rangeOpts = opts?.rangeOpts;
      try {
        const before = invoices.length;
        const first = await fetchInvoicesRaw(rangeOpts);
        if (first.length > before) {
          setInvoices(first);
          return;
        }
        let tries = 0;
        while (tries < maxTries) {
          await new Promise((r) => setTimeout(r, intervalMs));
          const arr = await fetchInvoicesRaw(rangeOpts);
          if (arr.length > before) {
            setInvoices(arr);
            return;
          }
          tries++;
        }
        // fallback to latest
        const last = await fetchInvoicesRaw(rangeOpts);
        setInvoices(last);
      } catch (err) {
        console.error("Error during refreshAndPoll:", err);
      }
    },
    [fetchInvoicesRaw, invoices.length]
  );

  // ---------- PDF helpers (unchanged) ----------
  const getFilenameFromDisposition = (disp?: string | null) => {
    if (!disp) return null;
    const match = /filename\*?=(?:UTF-8''?)?["']?([^"';]+)["']?/.exec(disp);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return null;
  };

  const getFilenameFromContentDisposition = (cd?: string) => {
    if (!cd) return null;
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/.exec(cd);
    return m ? decodeURIComponent(m[1] || m[2]) : null;
  };

  const handlePreviewPdf = async (invoiceId: string) => {
    setPreviewLoading(true);
    setPreviewInvoiceId(invoiceId);
    try {
      const pdfEndpoint = `https://cod-ecommerce-two.vercel.app/api/admin/invoices/${invoiceId}/pdf`;
      const res = await axios.get(pdfEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const contentDisp = (res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"])) || null;
      const filename = getFilenameFromDisposition(contentDisp) || `invoice-${invoiceId}.pdf`;
      setDownloadFilename(filename);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      if (previewUrl) {
        try {
          window.URL.revokeObjectURL(previewUrl);
        } catch {}
      }
      setPreviewUrl(url);
      setDialogOpen(true);
    } catch (err) {
      console.error("Error fetching PDF for preview:", err);
      alert("Failed to load PDF preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, { preview = true } = {}) => {
    try {
      const pdfEndpoint = `https://cod-ecommerce-two.vercel.app/api/admin/invoices/${invoiceId}/pdf`;
      const res = await axios.get(pdfEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" } : { Accept: "application/pdf" },
        responseType: "arraybuffer",
      });

      const contentType = (res.headers["content-type"] || "").toLowerCase();
      const contentDisposition = res.headers["content-disposition"];
      const filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
      const defaultName = `invoice-${invoiceId}.pdf`;

      if (contentType.includes("application/pdf")) {
        const blob = new Blob([res.data], { type: contentType || "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        if (preview) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.download = filenameFromHeader || defaultName;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        setTimeout(() => window.URL.revokeObjectURL(url), 15_000);
        return;
      }

      if (contentType.includes("text/html")) {
        const blob = new Blob([res.data], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 15_000);
        return;
      }

      console.error("Unexpected content-type:", contentType);
      alert("Unexpected response from server when requesting PDF. Check server logs or network tab.");
    } catch (err: any) {
      console.error("Error downloading/previewing PDF:", err);
      if (err?.response?.data) {
        alert("Server responded but returned an unexpected payload. Check network tab for details.");
      } else {
        alert("Failed to fetch PDF — check network, CORS, and authorization.");
      }
    }
  };

  const handleDownloadFromPreview = async () => {
    if (previewUrl && downloadFilename) {
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    if (!previewInvoiceId) return;
    try {
      const pdfEndpoint = `https://cod-ecommerce-two.vercel.app/api/admin/invoices/${previewInvoiceId}/pdf`;
      const res = await axios.get(pdfEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const contentDisp = (res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"])) || null;
      const filename = getFilenameFromDisposition(contentDisp) || `invoice-${previewInvoiceId}.pdf`;
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF");
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        try {
          window.URL.revokeObjectURL(previewUrl);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closePreview = () => {
    setDialogOpen(false);
    if (previewUrl) {
      try {
        window.URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setPreviewUrl(null);
    setPreviewInvoiceId(null);
    setDownloadFilename(null);
  };

  // ---------- Client-side filtering (text + date fallback) ----------
  const invoiceInRange = (createdAt?: string) => {
    if (!createdAt) return true;
    const d = new Date(createdAt);
    // If preset (not custom) use computeRange
    if (dateFilter && dateFilter !== "custom") {
      const r = computeRange(dateFilter);
      if (!r || !r.start || !r.end) return true;
      const start = new Date(r.start + "T00:00:00");
      const end = new Date(r.end + "T23:59:59");
      return d >= start && d <= end;
    }
    // custom
    if (dateFilter === "custom") {
      const from = customStart ? new Date(customStart + "T00:00:00") : null;
      const to = customEnd ? new Date(customEnd + "T23:59:59") : null;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    }
    return true;
  };

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        // date fallback filter
        return invoiceInRange(inv.createdAt);
      })
      .filter((inv) => {
        if (!q) return true;
        const sellerName = (inv.seller?.name || inv.seller?.storeName || inv.seller?.email || "").toLowerCase();
        return (
          String(inv.invoiceNumber || "").toLowerCase().includes(q) ||
          sellerName.includes(q) ||
          String(inv.status || "").toLowerCase().includes(q)
        );
      });
  }, [invoices, filter, dateFilter, customStart, customEnd]);

  // ---------- Render ----------
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3 justify-between py-4">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Search invoices..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />

          <label className="text-sm font-medium">Date:</label>
          <select
            value={dateFilter}
            onChange={(e) => {
              const v = e.target.value as any;
              setDateFilter(v);
              if (v !== "custom") {
                setCustomStart(null);
                setCustomEnd(null);
              }
            }}
            className="px-3 py-1 rounded-md border bg-white text-sm"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom</option>
          </select>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <Input
                type="date"
                value={customStart ?? ""}
                onChange={(e) => setCustomStart(e.target.value || null)}
                className="px-2 py-1"
              />
              <span className="text-sm">—</span>
              <Input
                type="date"
                value={customEnd ?? ""}
                onChange={(e) => setCustomEnd(e.target.value || null)}
                className="px-2 py-1"
              />
              <Button size="sm" variant="outline" onClick={applyCustomRange}>
                Apply
              </Button>
              <Button size="sm" variant="ghost" onClick={clearCustomRange}>
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              // pass current date opts to refreshAndPoll so it checks same filtered set server-side
              refreshAndPoll({
                maxTries: 12,
                intervalMs: 1000,
                rangeOpts:
                  dateFilter === "custom"
                    ? { range: "custom", start: customStart ?? null, end: customEnd ?? null }
                    : dateFilter === "all"
                    ? { range: "all" }
                    : (() => {
                        const r = computeRange(dateFilter);
                        return r && r.start && r.end ? { range: dateFilter, start: r.start, end: r.end } : { range: "all" };
                      })(),
              })
            }
          >
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading invoices...
                </TableCell>
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
                      <div className="text-muted-foreground">
                        {inv.periodStart && inv.periodEnd
                          ? `${new Date(inv.periodStart).toLocaleDateString()} → ${new Date(inv.periodEnd).toLocaleDateString()}`
                          : "—"}
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
                      <Button size="sm" onClick={() => handlePreviewPdf(inv._id)}>
                        <DownloadIcon className="h-4 w-4 mr-2" /> Preview PDF
                      </Button>
                      <Button size="sm" onClick={() => handleDownloadPdf(inv._id, { preview: false })}>
                        <DownloadIcon className="h-4 w-4 mr-2" /> Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Invoice Preview {previewInvoiceId ? `— ${previewInvoiceId}` : ""}</DialogTitle>
          </DialogHeader>

          <div className="h-[70vh]">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center">Loading preview...</div>
            ) : previewUrl ? (
              <iframe src={previewUrl} title="Invoice preview" className="w-full h-full border" />
            ) : (
              <div className="h-full flex items-center justify-center">No preview available.</div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              <Button variant="ghost" onClick={closePreview}>Close</Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownloadFromPreview} disabled={previewLoading || !previewUrl}>
                <DownloadIcon className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
