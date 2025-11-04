// EditOrder.fixed.tsx
"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash } from "lucide-react";

/**
 * EditOrder component (select-based product picker)
 *
 * Replaces the popover product picker with a <select>.
 * Stable UID for rows, safe enrichment, initialization guard,
 * immediate assignment of available/unitPrice on selection.
 */

/* ----- Types ----- */

export type Order = {
  id: string;
  orderId?: string;
  seller?: any;
  items: {
    productId?: string | null;
    productName?: string;
    quantity: number;
    unitPrice?: number;
  }[];
  totalAmount?: number;
  notes?: string;
  createdAt?: string;
  status?: string;
};

type EditOrderProps = {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
};

type StockItem = {
  _id?: string;
  id?: string;
  productId?: string;
  product?: { _id?: string; id?: string; name?: string } | null;
  name?: string;
  productName?: string;
  sku?: string;
  seller?: any;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  price?: number;
  unitPrice?: number;
  quantity?: number;
  stock?: number;
  available?: number;
};

type OrderItem = {
  uid: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  available?: number | undefined;
};

/* ----- Helpers ----- */

const uid = () =>
  typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const getStockId = (p: StockItem) =>
  String(p._id ?? p.id ?? p.productId ?? p.product?._id ?? p.product?.id ?? "").trim();

const getStockName = (p: StockItem) =>
  (p.productName ?? p.name ?? p.product?.name ?? p.sku ?? "").toString().trim();

const getStockAvailable = (p: StockItem) =>
  typeof p.quantity === "number" ? p.quantity : typeof p.stock === "number" ? p.stock : typeof p.available === "number" ? p.available : undefined;

const getStockUnitPrice = (p: StockItem) => (p.price ?? p.unitPrice) as number | undefined;

/* attempt to derive seller id/email/name from order.seller */
const deriveSellerId = (ord: Order | null) => {
  if (!ord) return undefined;
  const s = ord.seller;
  if (!s) return undefined;
  if (typeof s === "string") {
    if (/^[0-9a-fA-F]{24}$/.test(s)) return s;
    return s;
  }
  if (typeof s === "object") {
    return s._id ?? s.id ?? s.sellerId ?? s.email ?? s.name ?? s.fullName ?? undefined;
  }
  return undefined;
};

/* ----- Component ----- */

export default function EditOrder({ order, open, onOpenChange, onOrderUpdated }: EditOrderProps) {
  const [newOrderId, setNewOrderId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [stocks, setStocks] = React.useState<StockItem[]>([]);
  const [loadingStocks, setLoadingStocks] = React.useState(false);

  // Guard: only initialize when order.id actually changes (avoid wiping user edits)
  const lastInitOrderIdRef = React.useRef<string | null>(null);
  const sellerId = deriveSellerId(order);

  /* Fetch stocks when dialog opens */
  React.useEffect(() => {
    const ctrl = new AbortController();
    const fetchStocks = async () => {
      if (!open) return;
      setLoadingStocks(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/getAllStock", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: ctrl.signal as any,
          validateStatus: () => true,
        });

        const raw = res.data?.data ?? res.data ?? [];
        const arr: StockItem[] = Array.isArray(raw) ? raw : (raw.stocks ?? raw.items ?? []);
        setStocks(Array.isArray(arr) ? arr : []);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("Failed to fetch stocks", err);
        toast.error("Could not load products");
      } finally {
        setLoadingStocks(false);
      }
    };

    fetchStocks();
    return () => ctrl.abort();
  }, [open, order]);

  /* Initialize form only when the order id actually changes */
  React.useEffect(() => {
    const orderId = order?.id ?? null;
    if (orderId === lastInitOrderIdRef.current) {
      // do nothing - prevents resetting while editing
      return;
    }
    lastInitOrderIdRef.current = orderId;

    if (!order) {
      setNewOrderId("");
      setNotes("");
      setItems([]);
      return;
    }

    setNewOrderId(order.orderId ?? "");
    setNotes(order.notes ?? "");
    setItems(
      (order.items ?? []).map((it) => {
        const pid = String(it.productId ?? "").trim();
        const pname = it.productName ?? "";
        return {
          uid: uid(),
          productId: pid,
          productName: pname,
          quantity: Number(it.quantity ?? 1),
          unitPrice: it.unitPrice ?? undefined,
          available: undefined, // will be enriched from stocks (non-destructive)
        } as OrderItem;
      })
    );
  }, [order]);

  /* Enrich items from stocks WITHOUT overwriting user-entered values */
  React.useEffect(() => {
    if (!stocks?.length) return;
    setItems((prev) =>
      prev.map((it) => {
        // prefer matching by productId; fallback to matching by name
        let stock: StockItem | undefined;
        if (it.productId) stock = stocks.find((s) => getStockId(s) === it.productId);
        if (!stock && it.productName) {
          stock = stocks.find((s) => getStockName(s).toLowerCase() === it.productName!.toLowerCase().trim());
        }
        if (!stock) return it;

        // Only fill missing values (do NOT overwrite user-entered unitPrice/available/productName)
        return {
          ...it,
          productId: it.productId || getStockId(stock),
          productName: (it.productName && it.productName.trim()) ? it.productName : getStockName(stock),
          unitPrice: it.unitPrice ?? getStockUnitPrice(stock),
          available: it.available ?? getStockAvailable(stock),
        };
      })
    );
  }, [stocks]);

  /* Filter stocks for seller (best-effort). If none matched, fallback to all stocks */
  const sellerProducts = React.useMemo(() => {
    if (!sellerId) return stocks;
    const normalize = (v?: string) => (v ?? "").toString().trim().toLowerCase();
    const wanted = normalize(String(sellerId));
    const filtered = stocks.filter((s) => {
      const sid = normalize(String(s._id ?? s.id ?? s.seller ?? s.sellerId ?? s.seller?._id ?? ""));
      const sname = normalize(String(s.sellerName ?? s.seller?.name ?? s.seller?.fullName ?? ""));
      const semail = normalize(String(s.sellerEmail ?? s.seller?.email ?? ""));
      if (wanted && sid && wanted === sid) return true;
      if (wanted && semail && wanted === semail) return true;
      if (wanted && sname && wanted === sname) return true;
      return false;
    });
    return filtered.length ? filtered : stocks;
  }, [stocks, sellerId]);

  /* Helpers to update a single item by index */
  const updateItem = (idx: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  /* When user selects a product from <select>, we immediately set unitPrice and available */
  const onSelectProduct = (idx: number, selectedId: string) => {
    if (!selectedId) {
      updateItem(idx, { productId: "", productName: "", unitPrice: undefined, available: undefined });
      return;
    }

    const stock = sellerProducts.find((s) => getStockId(s) === selectedId) ?? stocks.find((s) => getStockId(s) === selectedId);
    if (!stock) {
      // if stock not found, still write id
      updateItem(idx, { productId: selectedId });
      return;
    }

    updateItem(idx, {
      productId: getStockId(stock),
      productName: getStockName(stock),
      unitPrice: getStockUnitPrice(stock),
      available: getStockAvailable(stock),
    });
  };

  /* Add / remove items (when adding, create stable uid and preselect first seller product if available) */
  const addItem = () => {
    if (sellerProducts.length > 0) {
      const p = sellerProducts[0];
      const pid = getStockId(p);
      const pname = getStockName(p);
      const price = getStockUnitPrice(p);
      const available = getStockAvailable(p);
      if (pid) {
        setItems((s) => [
          ...s,
          { uid: uid(), productId: pid, productName: pname, quantity: 1, unitPrice: price, available },
        ]);
        return;
      }
    }
    setItems((s) => [...s, { uid: uid(), productId: "", productName: "", quantity: 1 }]);
  };

  const removeItem = (idx: number) => setItems((s) => s.filter((_, i) => i !== idx));

  /* Validate & submit (send { notes, items: [{productId, quantity}] }) */
  const handleSave = async () => {
    if (!order) return toast.error("No order selected");
    if (!items.length) return toast.error("Order must contain at least one item");

    const stockMap = new Map<string, StockItem>();
    for (const s of stocks) {
      const sid = getStockId(s);
      if (sid) stockMap.set(sid, s);
    }

    const fixed = items.map((it) => ({ ...it }));
    const invalid: { idx: number; reason: string }[] = [];

    for (let i = 0; i < fixed.length; i++) {
      const it = fixed[i];
      // require productId
      if (!it.productId) {
        invalid.push({ idx: i, reason: "No product selected" });
        continue;
      }
      if (!stockMap.has(it.productId)) {
        invalid.push({ idx: i, reason: `Unknown productId ${it.productId}` });
        continue;
      }
      // quantity check
      if (!it.quantity || Number(it.quantity) <= 0) {
        invalid.push({ idx: i, reason: `Invalid quantity ${it.quantity}` });
        continue;
      }
      // available check (if known)
      const stock = stockMap.get(it.productId)!;
      const available = it.available ?? getStockAvailable(stock);
    }

    if (invalid.length > 0) {
      const first = invalid[0];
      toast.error(`Item ${first.idx + 1}: ${first.reason}`);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("No auth token found. Please login.");
      return;
    }

    const payload = {
      notes: notes ?? "",
      items: fixed.map((it) => ({ productId: it.productId!.trim(), quantity: Number(it.quantity) })),
    };

    setLoading(true);
    try {
      const url = `https://cod-ecommerce-two.vercel.app/api/admin/update-order/${order.id}`;
      const res = await axios.put(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        toast.success("Order updated successfully");
        onOrderUpdated?.();
        onOpenChange(false);
      } else {
        console.error("Update failed", res.status, res.data);
        toast.error(res.data?.message ?? `Update failed (${res.status})`);
      }
    } catch (err: any) {
      console.error("Network error updating order:", err);
      toast.error("Network error — check console for details");
    } finally {
      setLoading(false);
    }
  };

  /* ----- JSX (select-based UI) ----- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <label className="text-sm">Seller</label>
            <div className="p-2 rounded-md border bg-muted/30">
              {typeof order?.seller === "object" ? order?.seller?.name ?? order?.seller?._id : order?.seller}
            </div>
          </div>

          <label className="text-sm">Order ID (display only)</label>
          <Input value={newOrderId} onChange={(e) => setNewOrderId(e.target.value)} placeholder="ORD-2025-00145" />

          <label className="text-sm">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border p-2 h-24"
            placeholder="Customer requested express delivery."
          />

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Items</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add item
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={it.uid} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs">Product {!it.productId && <span className="text-red-500">*</span>}</label>
                  <select
                    value={it.productId ?? ""}
                    onChange={(e) => onSelectProduct(idx, e.target.value)}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="">-- Select product --</option>
                    {sellerProducts.map((p) => {
                      const pid = getStockId(p);
                      const pname = getStockName(p) || "Unnamed";
                      const avail = getStockAvailable(p);
                      return (
                        <option key={pid || pname} value={pid}>
                          {pname}
                          {p.sku ? ` (${p.sku})` : ""}
                          {typeof avail === "number" ? ` — stock: ${avail}` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <div className="text-xs text-muted-foreground mt-1">{it.productName || (it.productId ? "(product selected)" : "Choose a product")}</div>
                </div>

                <div className="w-28">
                  <label className="text-xs">Qty</label>
                  <div>
                    <Input
                      type="number"
                      min={1}
                      value={String(it.quantity)}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                    />
                    <div className="text-xs mt-1">
                      {typeof it.available === "number" ? (
                        <span className={it.available === 0 ? "text-red-600" : "text-muted-foreground"}>Available: {it.available}</span>
                      ) : (
                        <span className="text-muted-foreground">Stock: unknown</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-36">
                  <label className="text-xs">Unit Price</label>
                  <Input readOnly value={it.unitPrice != null ? String(it.unitPrice) : ""} />
                </div>

                <div className="flex items-end">
                  <Button variant="destructive" size="sm" onClick={() => removeItem(idx)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {items.length === 0 && <div className="text-sm text-muted-foreground">No items — add one to update the order.</div>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
