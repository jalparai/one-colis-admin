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
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // Preview state
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [downloadFilename, setDownloadFilename] = React.useState<string | null>(null);

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

  // Extract filename from Content-Disposition header (if present)
  const getFilenameFromDisposition = (disp?: string | null) => {
    if (!disp) return null;
    const match = /filename\*?=(?:UTF-8''?)?["']?([^"';]+)["']?/.exec(disp);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return null;
  };

  // Open preview modal (fetch blob and create object URL)
  const handlePreviewPdf = async (invoiceId: string) => {
    setPreviewLoading(true);
    setPreviewInvoiceId(invoiceId);
    try {
      const pdfEndpoint = `https://cod-ecommerce-two.vercel.app/api/admin/invoices/${invoiceId}/pdf`;
      const res = await axios.get(pdfEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });

      // try to get filename
      const contentDisp = (res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"])) || null;
      const filename = getFilenameFromDisposition(contentDisp) || `invoice-${invoiceId}.pdf`;
      setDownloadFilename(filename);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      // cleanup previous if exists
      if (previewUrl) {
        try { window.URL.revokeObjectURL(previewUrl); } catch { }
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

  const getFilenameFromContentDisposition = (cd?: string) => {
    if (!cd) return null;
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/.exec(cd);
    return m ? decodeURIComponent(m[1] || m[2]) : null;
  };


  const handleDownloadPdf = async (invoiceId: string, { preview = true } = {}) => {
    try {
      const pdfEndpoint = `https://cod-ecommerce-two.vercel.app/api/admin/invoices/${invoiceId}/pdf`;
      // Use arraybuffer to preserve binary accurately
      const res = await axios.get(pdfEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" } : { Accept: "application/pdf" },
        responseType: "arraybuffer",
      });

      const contentType = (res.headers["content-type"] || "").toLowerCase();
      const contentDisposition = res.headers["content-disposition"];
      const filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
      const defaultName = `invoice-${invoiceId}.pdf`;

      // If the server sent a PDF
      if (contentType.includes("application/pdf")) {
        const blob = new Blob([res.data], { type: contentType || "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        if (preview) {
          // open in new tab for preview
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          // force download
          const a = document.createElement("a");
          a.href = url;
          a.download = filenameFromHeader || defaultName;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        // free URL after a short delay
        setTimeout(() => window.URL.revokeObjectURL(url), 15_000);
        return;
      }

      // If server returned HTML (fallback) — open as HTML so user sees the page rather than broken PDF
      if (contentType.includes("text/html")) {
        const blob = new Blob([res.data], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 15_000);
        return;
      }

      // Unknown content
      console.error("Unexpected content-type:", contentType);
      alert("Unexpected response from server when requesting PDF. Check server logs or network tab.");
    } catch (err: any) {
      console.error("Error downloading/previewing PDF:", err);
      // if server responded with HTML error page, show short guidance
      if (err?.response?.data) {
        alert("Server responded but returned an unexpected payload. Check network tab for details.");
      } else {
        alert("Failed to fetch PDF — check network, CORS, and authorization.");
      }
    }
  };


  // Download currently previewed PDF (if previewUrl exists) or fall back to direct fetch+download
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


    // fallback: re-fetch and force download
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

  // Cleanup object URL on unmount or when previewUrl changes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        try { window.URL.revokeObjectURL(previewUrl); } catch { }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closePreview = () => {
    setDialogOpen(false);
    if (previewUrl) {
      try { window.URL.revokeObjectURL(previewUrl); } catch { }
    }
    setPreviewUrl(null);
    setPreviewInvoiceId(null);
    setDownloadFilename(null);
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
                      <div className="text-muted-foreground">
                        3 days
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
                      <Button size="sm" onClick={() => handleDownloadPdf(inv._id, { preview: true })}>
                        <DownloadIcon className="h-4 w-4 mr-2" /> Preview PDF
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
