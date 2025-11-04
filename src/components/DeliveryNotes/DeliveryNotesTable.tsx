"use client";

import * as React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DownloadIcon, RefreshCcwIcon } from "lucide-react";

type Note = {
  _id: string;
  status: string;
  note: string;
  createdAt: string;
  order?: { _id?: string; orderId?: string; totalAmount?: number; status?: string } | null;
};

export default function DeliveryNotesTable() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");
  const [downloadingNoteId, setDownloadingNoteId] = React.useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchNotes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/delivery-notes", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.debug("delivery notes response:", res.data);

      const payload = res.data;
      let dataArray: any[] = [];

      if (Array.isArray(payload)) dataArray = payload;
      else if (Array.isArray(payload.notes)) dataArray = payload.notes;
      else if (Array.isArray(payload.data)) dataArray = payload.data;
      else {
        for (const k of Object.keys(payload || {})) {
          if (Array.isArray((payload as any)[k])) {
            dataArray = (payload as any)[k];
            break;
          }
        }
      }

      setNotes(dataArray);
    } catch (err) {
      console.error("Error fetching delivery notes:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      return (
        n.status?.toLowerCase().includes(q) ||
        n.note?.toLowerCase().includes(q) ||
        (n.order?.orderId || n.order?._id || "").toLowerCase().includes(q)
      );
    });
  }, [notes, filter]);

  const handleExportPdf = async () => {
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/delivery-notes/pdf", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "delivery-notes.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Failed to download PDF — check console for details.");
    }
  };

  // Try to download PDF; first attempt https, then http fallback.
  const handleDownloadNote = React.useCallback(
    async (noteId: string) => {
      if (!noteId) return;
      setDownloadingNoteId(noteId);

      const basePaths = [
        `https://cod-ecommerce-two.vercel.app/api/admin/delivery-notes/${noteId}/pdf`,
        `http://cod-ecommerce-two.vercel.app/api/admin/delivery-notes/${noteId}/pdf`,
      ];

      let lastError: any = null;

      for (const url of basePaths) {
        try {
          const res = await axios.get(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            responseType: "blob",
            validateStatus: (s) => s >= 200 && s < 500, // let us inspect non-2xx bodies too
          });

          // If server returned a non-200 status, try to inform user.
          if (res.status !== 200) {
            // try to read text from blob (likely HTML error page or JSON)
            const text = await (res.data as Blob).text();
            console.error(`Download failed (${url}) status=${res.status}`, text);
            lastError = `Server returned ${res.status}: ${text.slice(0, 300)}`;
            // try next fallback (http)
            continue;
          }

          const blob = res.data as Blob;

          // detect non-pdf responses (some servers return HTML or JSON error with 200)
          const isPdf = blob.type === "application/pdf" || blob.type === "application/octet-stream" || blob.size > 0 && blob.type.includes("pdf");
          if (!isPdf && blob.size > 0) {
            // read text for a helpful error
            const text = await blob.text();
            console.error("Server returned non-PDF payload:", text);
            lastError = `Unexpected response: ${text.slice(0, 500)}`;
            continue;
          }

          // success: trigger download
          const link = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = link;
          a.download = `delivery-note-${noteId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(link);
          setDownloadingNoteId(null);
          return;
        } catch (err: any) {
          console.error(`Error fetching note PDF from ${url}:`, err);
          lastError = err?.message || String(err);
          // try next fallback
        }
      }

      // if we reached here, all attempts failed
      setDownloadingNoteId(null);
      console.error("All download attempts failed:", lastError);
      alert(
        `Failed to download note PDF.\n\nReason: ${typeof lastError === "string" ? lastError : "see console for details"}\n\nTry opening the API URL in your browser or check server logs/CORS settings.`
      );
    },
    [token]
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-3">
        <Input
          placeholder="Search notes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotes}>
            <RefreshCcwIcon className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={handleExportPdf}>
            <DownloadIcon className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading notes...
                </TableCell>
              </TableRow>
            ) : filtered.length ? (
              filtered.map((n) => (
                <TableRow key={n._id}>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        n.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : n.status === "returned"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {n.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[420px] truncate" title={n.note}>
                    {n.note}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {/* prefer order.orderId, fallback to order._id */}
                    {n.order?.orderId}
                  </TableCell>
                  <TableCell>
                    {typeof n.order?.totalAmount === "number" ? n.order.totalAmount : "—"}
                  </TableCell>
                  <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadNote(n._id)}
                        disabled={downloadingNoteId === n._id}
                        title="Download note PDF"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        {downloadingNoteId === n._id ? "Downloading..." : "Download"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No notes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
