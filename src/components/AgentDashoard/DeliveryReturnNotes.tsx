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

// keep your original helper but add safer start/end day utils
function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

function getDateRangeForFilter(key: string): [Date | null, Date | null] {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const endOfToday = endOfDay(now);

  switch (key) {
    case "today":
      return [startOfToday, endOfToday];

    case "yesterday": {
      const s = new Date(startOfToday);
      s.setDate(s.getDate() - 1);
      return [startOfDay(s), endOfDay(s)];
    }

    case "this_week": {
      // week starts Monday
      const d = new Date(startOfToday);
      const day = d.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = (day + 6) % 7; // map Sun->6, Mon->0, ...
      const s = new Date(d);
      s.setDate(d.getDate() - diffToMonday);
      return [startOfDay(s), endOfDay(new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6))];
    }

    case "last_week": {
      const d = new Date(startOfToday);
      const day = d.getDay();
      const diffToMonday = (day + 6) % 7;
      const startThisWeek = new Date(d);
      startThisWeek.setDate(d.getDate() - diffToMonday);
      startThisWeek.setHours(0, 0, 0, 0);
      const s = new Date(startThisWeek);
      s.setDate(startThisWeek.getDate() - 7);
      const e = new Date(startThisWeek);
      e.setDate(startThisWeek.getDate() - 1);
      return [startOfDay(s), endOfDay(e)];
    }

    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return [startOfDay(s), endOfDay(e)];
    }

    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return [startOfDay(s), endOfDay(e)];
    }

    case "all":
    default:
      return [null, null];
  }
}

export default function DeliveryNotesTable() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<string>("all");
  const [fromDate, setFromDate] = React.useState<string>(""); // ISO yyyy-mm-dd
  const [toDate, setToDate] = React.useState<string>(""); // ISO yyyy-mm-dd
  const [downloadingNoteId, setDownloadingNoteId] = React.useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchNotes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/delivery-agent/getDeliveryNotes", {
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

  // unified function that returns start/end using either manual range OR preset
  const computeRange = React.useCallback((): [Date | null, Date | null] => {
    // manual range takes precedence
    if (fromDate || toDate) {
      let from: Date | null = null;
      let to: Date | null = null;
      if (fromDate) {
        const f = new Date(fromDate);
        if (!isNaN(f.getTime())) from = startOfDay(f);
      }
      if (toDate) {
        const t = new Date(toDate);
        if (!isNaN(t.getTime())) to = endOfDay(t);
      }
      return [from, to];
    }
    // otherwise use preset dropdown
    return getDateRangeForFilter(dateFilter);
  }, [fromDate, toDate, dateFilter]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    const [start, end] = computeRange();

    // debug
    // console.debug("Applying filter:", { q, start, end, dateFilter, fromDate, toDate });

    return notes.filter((n) => {
      // text match
      const textMatch =
        !q ||
        (n.status || "").toLowerCase().includes(q) ||
        (n.note || "").toLowerCase().includes(q) ||
        ((n.order?.orderId || n.order?._id || "") as string).toLowerCase().includes(q);

      if (!textMatch) return false;

      // date match
      if (!start && !end) return true; // 'all' selected

      if (!n.createdAt) return false;
      // parse reliably: prefer Date constructor for ISO; fallback to parse
      const created = new Date(n.createdAt);
      if (isNaN(created.getTime())) {
        // try loose parse fallback (may still fail)
        const parsed = new Date(Date.parse(String(n.createdAt)));
        if (isNaN(parsed.getTime())) return false;
      }

      // compare using ms
      const createdMs = created.getTime();
      if (start && createdMs < start.getTime()) return false;
      if (end && createdMs > end.getTime()) return false;
      return true;
    });
  }, [notes, filter, computeRange, dateFilter, fromDate, toDate]);

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

  const handleDownload = React.useCallback(
    async (note: Note) => {
      if (!note || !note._id) return;
      setDownloadingNoteId(note._id);

      const baseCandidates: string[] =
        note.status === "returned"
          ? [
              `https://cod-ecommerce-two.vercel.app/api/admin/return-notes/${note._id}/pdf`,
              `http://cod-ecommerce-two.vercel.app/api/admin/return-notes/${note._id}/pdf`,
            ]
          : [
              `https://cod-ecommerce-two.vercel.app/api/admin/delivery-notes/${note._id}/pdf`,
              `http://cod-ecommerce-two.vercel.app/api/admin/delivery-notes/${note._id}/pdf`,
            ];

      if (!["delivered", "returned"].includes(note.status)) {
        setDownloadingNoteId(null);
        alert("PDF not available for this status.");
        return;
      }

      let lastError: any = null;

      for (const url of baseCandidates) {
        try {
          const res = await axios.get(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            responseType: "blob",
            validateStatus: (s) => s >= 200 && s < 500,
          });

          if (res.status !== 200) {
            try {
              const text = await (res.data as Blob).text();
              console.error(`Download failed (${url}) status=${res.status}`, text);
              lastError = `Server returned ${res.status}: ${text.slice(0, 300)}`;
            } catch (e) {
              console.error(`Download failed (${url}) status=${res.status} (no preview)`);
              lastError = `Server returned ${res.status}`;
            }
            continue;
          }

          const blob = res.data as Blob;
          const isPdf =
            blob.type === "application/pdf" ||
            blob.type === "application/octet-stream" ||
            (blob.size > 0 && blob.type.includes("pdf"));
          if (!isPdf && blob.size > 0) {
            const text = await blob.text();
            console.error("Server returned non-PDF payload:", text);
            lastError = `Unexpected response: ${text.slice(0, 500)}`;
            continue;
          }

          const link = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          const kind = note.status === "returned" ? "return-note" : "delivery-note";
          a.href = link;
          a.download = `${kind}-${note._id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(link);
          setDownloadingNoteId(null);
          return;
        } catch (err: any) {
          console.error(`Error fetching PDF from ${url}:`, err);
          lastError = err?.message || String(err);
        }
      }

      setDownloadingNoteId(null);
      console.error("All download attempts failed:", lastError);
      alert(
        `Failed to download PDF.\n\nReason: ${typeof lastError === "string" ? lastError : "see console for details"}\n\nTry opening the API URL in your browser or check server logs/CORS settings.`
      );
    },
    [token]
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-3 overflow-scroll">
        <div className="flex gap-2 items-center w-full max-w-2xl ">
          {/* <Input
            placeholder="Search notes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1"
          /> */}

          <label htmlFor="date-filter" className="sr-only">
            Date filter
          </label>
          <select
            id="date-filter"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              // when selecting a preset, clear manual range to avoid confusion
              setFromDate("");
              setToDate("");
            }}
            className="ml-2 border rounded px-2 py-2 text-sm"
            title="Filter by date range"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This week</option>
            <option value="last_week">Last week</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
          </select>

          {/* Manual range inputs — manual range takes precedence */}
          <label className="sr-only" htmlFor="from-date">From date</label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              // when using manual range, clear preset to avoid conflict
              if (e.target.value) setDateFilter("all");
            }}
            className="ml-2"
          />
          <label className="sr-only" htmlFor="to-date">To date</label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              if (e.target.value) setDateFilter("all");
            }}
            className="ml-2"
          />
        </div>

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
                  <TableCell className="font-mono text-xs">{n.order?.orderId}</TableCell>
                  <TableCell>
                    {typeof n.order?.totalAmount === "number" ? n.order.totalAmount : "—"}
                  </TableCell>
                  <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(n)}
                        disabled={downloadingNoteId === n._id}
                        title={
                          n.status === "delivered"
                            ? "Download delivery note"
                            : n.status === "returned"
                            ? "Download return note"
                            : "PDF not available for this status"
                        }
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        {downloadingNoteId === n._id
                          ? "Downloading..."
                          : n.status === "delivered"
                          ? "Download"
                          : n.status === "returned"
                          ? "Download Return"
                          : "No PDF"}
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
