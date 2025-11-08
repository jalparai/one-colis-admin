"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import toast from "react-hot-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

/* ---------- Helpers / Types ---------- */

interface StockProduct {
  _id?: string;
  id?: string;
  productId?: string;
  product?: { _id?: string; id?: string; name?: string } | null;
  name?: string;
  productName?: string;
  sku?: string;
  price?: number;
  unitPrice?: number;
  available?: number;
  stock?: number;
  quantity?: number;
  seller?: any;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
}

interface Item {
  uid?: string;
  sku?: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice?: number;
  available?: number;
}

interface Order {
  _id?: string; // backend MongoDB id (not editable)
  id?: string;
  orderId?: string; // customer-visible order id
  notes?: string;
  items?: Item[];
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  seller?: any;
}

const uid = () =>
  typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const getStockId = (p: StockProduct) => String(p._id ?? p.id ?? p.productId ?? p.product?._id ?? p.product?.id ?? "").trim();
const getStockName = (p: StockProduct) => (p.productName ?? p.name ?? p.product?.name ?? p.sku ?? "").toString().trim();
const getStockAvailable = (p: StockProduct) =>
  typeof p.quantity === "number" ? p.quantity : typeof p.stock === "number" ? p.stock : typeof p.available === "number" ? p.available : undefined;
const getStockUnitPrice = (p: StockProduct) => (p.price ?? p.unitPrice) as number | undefined;

const deriveSellerId = (ord: Order | null | undefined) => {
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

/* ---------- Component ---------- */

export function EditOrder({
  order,
  onUpdated,
  open,
  onClose,
}: {
  order: Order | null | undefined;
  onUpdated?: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const API_BASE = "https://cod-ecommerce-two.vercel.app";

  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [customer, setCustomer] = useState<Order["customer"]>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const sellerId = deriveSellerId(order ?? null);

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  /* Fetch stock when editor opens */
  useEffect(() => {
    const ctrl = new AbortController();
    const fetchStock = async () => {
      if (!open) return;
      setLoadingProducts(true);
      try {
        const token = getToken();
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/seller/stock", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: ctrl.signal as any,
          validateStatus: () => true,
        });

        const raw = res.data?.data ?? res.data ?? [];
        const arr: StockProduct[] = Array.isArray(raw) ? raw : raw.stocks ?? raw.items ?? [];
        const mapped = (Array.isArray(arr) ? arr : []).map((p: any) => ({
          _id: p._id ?? p.id ?? String(p.productId ?? p.product?._id ?? p.sku ?? Math.random()),
          name: p.name ?? p.productName ?? p.product?.name ?? p.title ?? "",
          sku: p.sku ?? p.code ?? undefined,
          price: p.price ?? p.unitPrice ?? undefined,
          available: p.available ?? p.stock ?? p.quantity ?? undefined,
          productId: p.productId ?? undefined,
          seller: p.seller ?? undefined,
          sellerId: p.sellerId ?? undefined,
          sellerName: p.sellerName ?? undefined,
        } as StockProduct));

        setProducts(mapped);
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        console.error("fetchStock error", err);
        toast.error("Could not load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchStock();
    return () => ctrl.abort();
  }, [open]);

  /* Initialize local form from order (only when order changes) */
  const lastInitRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    const marker = order?.orderId ?? order?._id ?? order?.id;
    if (marker && marker === lastInitRef.current) return; // avoid resetting while editing
    lastInitRef.current = marker;

    setMessage("");
    setForceUpdate(false);

    if (!order) {
      setNotes("");
      setItems([]);
      setCustomer({});
      return;
    }

    setNotes(order.notes ?? "");

    const initialItems: Item[] = (order.items ?? []).map((it) => ({
      uid: uid(),
      sku: (it as any).sku ?? undefined,
      productId: (it as any).productId ?? (it as any)._id ?? null,
      productName: it.productName ?? (it as any).name ?? "",
      quantity: Number(it.quantity ?? 1),
      unitPrice: Number((it as any).unitPrice ?? (it as any).price ?? 0),
      available: (it as any).available,
    }));

    setItems(initialItems.length ? initialItems : [{ uid: uid(), productName: "", quantity: 1, unitPrice: 0 }]);

    setCustomer({
      name: order.customer?.name ?? undefined,
      phone: order.customer?.phone ?? undefined,
      address: order.customer?.address ?? undefined,
      city: order.customer?.city ?? undefined,
      postalCode: order.customer?.postalCode ?? undefined,
    });
  }, [order]);

  /* Enrich items from products WITHOUT overwriting user changes */
  useEffect(() => {
    if (!products?.length) return;
    setItems((prev) =>
      prev.map((it) => {
        let stock: StockProduct | undefined;
        if (it.productId) stock = products.find((p) => getStockId(p) === it.productId);
        if (!stock && it.productName) stock = products.find((p) => getStockName(p).toLowerCase() === it.productName.toLowerCase().trim());
        if (!stock) return it;
        return {
          ...it,
          productId: it.productId || getStockId(stock),
          productName: (it.productName && it.productName.trim()) ? it.productName : getStockName(stock),
          unitPrice: it.unitPrice ?? getStockUnitPrice(stock),
          available: it.available ?? getStockAvailable(stock),
        };
      })
    );
  }, [products]);

  /* Filter products for this seller (best-effort). Fallback to all products when none matched. */
  const sellerProducts = React.useMemo(() => {
    if (!sellerId) return products;
    const normalize = (v?: string) => (v ?? "").toString().trim().toLowerCase();
    const wanted = normalize(String(sellerId));
    const filtered = products.filter((p) => {
      const sid = normalize(String(p._id ?? p.id ?? p.seller ?? p.sellerId ?? p.seller?._id ?? ""));
      const sname = normalize(String(p.sellerName ?? p.seller?.name ?? ""));
      const semail = normalize(String(p.sellerEmail ?? p.seller?.email ?? ""));
      if (wanted && sid && wanted === sid) return true;
      if (wanted && semail && wanted === semail) return true;
      if (wanted && sname && wanted === sname) return true;
      return false;
    });
    return filtered.length ? filtered : products;
  }, [products, sellerId]);

  const updateItem = (index: number, patch: Partial<Item>) => setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const onSelectProduct = (idx: number, selectedId: string) => {
    if (!selectedId) {
      updateItem(idx, { productId: "", productName: "", unitPrice: undefined, available: undefined });
      return;
    }

    const stock = sellerProducts.find((s) => getStockId(s) === selectedId) ?? products.find((s) => getStockId(s) === selectedId);
    if (!stock) {
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

  const addItem = () => {
    if (sellerProducts.length > 0) {
      const p = sellerProducts[0];
      const pid = getStockId(p);
      const pname = getStockName(p);
      const price = getStockUnitPrice(p);
      const available = getStockAvailable(p);
      setItems((s) => [...s, { uid: uid(), productId: pid, productName: pname, quantity: 1, unitPrice: price ?? 0, available }]);
      return;
    }
    setItems((s) => [...s, { uid: uid(), productName: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => setItems((s) => s.filter((_, i) => i !== index));

  // inside your EditOrder component: replace the handleSave function with this
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (!order) {
        toast.error("No order selected");
        setLoading(false);
        return;
      }
      if (!items.length) {
        toast.error("Order must contain at least one item");
        setLoading(false);
        return;
      }

      // Validate items quickly before sending
      const invalid: { idx: number; reason: string }[] = [];
      const productIds = new Set(products.map((p) => getStockId(p)));

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.productId || !String(it.productId).trim()) {
          invalid.push({ idx: i, reason: "No product selected" });
          continue;
        }
        if (!productIds.has(it.productId)) {
          invalid.push({ idx: i, reason: `Unknown productId ${it.productId}` });
          continue;
        }
        if (!it.quantity || Number(it.quantity) <= 0) {
          invalid.push({ idx: i, reason: `Invalid quantity ${it.quantity}` });
        }
      }

      if (invalid.length) {
        const first = invalid[0];
        toast.error(`Item ${first.idx + 1}: ${first.reason}`);
        setLoading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        toast.error("No auth token found. Please login.");
        setLoading(false);
        return;
      }

      // Build payload exactly as your backend expects
      const payload = {
        notes: notes ?? "",
        items: items.map((it) => ({ productId: it.productId!.trim(), quantity: Number(it.quantity) })),
        customer: {
          name: customer?.name ?? undefined,
          phone: customer?.phone ?? undefined,
          address: customer?.address ?? undefined,
          city: customer?.city ?? undefined,
          postalCode: customer?.postalCode ?? undefined,
        },
        meta: { ignoreStock: Boolean(forceUpdate) },
      };

      // IMPORTANT: use DB id (_id) for the route. fallback to id only if _id missing.
      const dbId = String(order._id ?? order.id ?? "").trim();
      if (!dbId) {
        toast.error("Order database id (_id) is missing. Cannot update.");
        setLoading(false);
        return;
      }
      const idForRoute = encodeURIComponent(dbId);

      // Try the most likely single method: PUT to seller namespace first (server expects PUT + db id)
      const attempts = [
        { method: "put", url: `${API_BASE}/api/seller/orders/${idForRoute}` },
        { method: "put", url: `${API_BASE}/api/admin/orders/${idForRoute}` },
        { method: "put", url: `${API_BASE}/api/orders/${idForRoute}` },
      ];

      let ok = false;
      const errors: any[] = [];
      let lastRes: any = null;

      for (const a of attempts) {
        try {
          const res = await axios.request({
            url: a.url,
            method: a.method as any,
            data: payload,
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            timeout: 15000,
            validateStatus: () => true,
          });

          lastRes = res;
          console.log("[EditOrder] try", a.method.toUpperCase(), a.url, res.status, res.data);

          if (res.status >= 200 && res.status < 300) {
            ok = true;
            break;
          } else {
            errors.push({ url: a.url, status: res.status, data: res.data });
            // stop early on auth failure
            if (res.status === 401 || res.status === 403) break;
          }
        } catch (err: any) {
          console.error("[EditOrder] request error for", a.url, err?.message ?? err);
          errors.push({ url: a.url, error: err?.message ?? err });
        }
      }

      if (!ok) {
        console.error("[EditOrder] all attempts failed", errors);
        const firstErr = errors[0];
        // prefer server message if any
        const detail =
          firstErr?.data?.message ?? firstErr?.data ?? firstErr?.error ? JSON.stringify(firstErr.data ?? firstErr.error) : lastRes?.data ?? "No response";
        setMessage(`❌ Update failed — ${detail}`);
        toast.error("Update failed — check console for network details");
        setLoading(false);
        return;
      }

      setMessage("✅ Order updated successfully");
      toast.success("Order updated");
      onUpdated && onUpdated();
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      console.error("[EditOrder] unexpected error", err);
      setMessage(err?.message ?? "❌ Unexpected error");
      toast.error(err?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Order</SheetTitle>
          <SheetDescription>Edit customer, pick products from your stock and adjust quantity. Order id (orderId) is display only.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="grid gap-6 px-4 overflow-scroll">
          <div className="grid gap-2">
            <Label>Order ID</Label>
            <Input value={order?.orderId ?? order?._id ?? order?.id ?? ""} disabled />
          </div>

          <fieldset className="grid gap-2">
            <legend className="font-medium">Customer</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={customer?.name ?? ""} onChange={(e) => setCustomer((c) => ({ ...(c ?? {}), name: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={customer?.phone ?? ""} onChange={(e) => setCustomer((c) => ({ ...(c ?? {}), phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input value={customer?.city ?? ""} onChange={(e) => setCustomer((c) => ({ ...(c ?? {}), city: e.target.value }))} />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input value={customer?.postalCode ?? ""} onChange={(e) => setCustomer((c) => ({ ...(c ?? {}), postalCode: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={customer?.address ?? ""} onChange={(e) => setCustomer((c) => ({ ...(c ?? {}), address: e.target.value }))} />
            </div>
          </fieldset>

          <fieldset className="space-y-4 mt-4">
            <legend className="font-medium mb-2">Items</legend>

            {items.map((it, idx) => (
              <div className="bg-gray-50 p-4 rounded-lg border">

              <div
                key={it.uid ?? idx}
                className="grid grid-cols-12 gap-4 items-end"
              >
                {/* Product Select - 6 columns */}
                <div className="col-span-12">
                  <Label>Product</Label>
                  {products.length ? (
                    <Select
                      value={it.productId ?? ""}
                      onValueChange={(val) => onSelectProduct(idx, val)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={it.productName || "Select product"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sellerProducts.map((p) => (
                          <SelectItem
                            key={getStockId(p) || p.name}
                            value={getStockId(p)}
                          >
                            {getStockName(p)}
                            {p.sku ? ` (${p.sku})` : ""}
                            {typeof getStockAvailable(p) === "number"
                              ? ` — stock: ${getStockAvailable(p)}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>

                {/* Quantity - 2 columns */}
                <div className="col-span-6">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: Number(e.target.value) || 1 })
                    }
                  />
                </div>

                {/* Unit Price - 3 columns */}
                <div className="col-span-5">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unitPrice ?? 0}
                    onChange={(e) =>
                      updateItem(idx, { unitPrice: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
  {/* Remove Button - 1 column */}
                <div className="col-span-1 flex justify-end mt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              
              </div>

            ))}

            <div className="pt-2">
              <Button type="button" onClick={addItem}>
                + Add item
              </Button>
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Urgent delivery" />
          </div>

          {message && (
            <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>
          )}

          <SheetFooter>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</Button>
            <SheetClose asChild>
              <Button type="button" variant="outline" onClick={() => onClose()}>Close</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
