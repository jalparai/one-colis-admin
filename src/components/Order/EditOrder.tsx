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
import { Plus, Trash, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* ----- Types ----- */

export type Order = {
  id: string;
  orderId?: string;
  seller?: any;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
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

type Customer = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
};

type CityFee = { city: string; fee?: number };

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

  const [customer, setCustomer] = React.useState<Customer>({});
  const [stocks, setStocks] = React.useState<StockItem[]>([]);
  const [loadingStocks, setLoadingStocks] = React.useState(false);

  // city fees state (added)
  const [cityFees, setCityFees] = React.useState<CityFee[]>([]);
  const [cityLoading, setCityLoading] = React.useState(false);
  const [cityOpen, setCityOpen] = React.useState(false);
  const [citySearch, setCitySearch] = React.useState("");

  const lastInitOrderIdRef = React.useRef<string | null>(null);
  const sellerId = deriveSellerId(order);
  const API_BASE = "https://cod-ecommerce-two.vercel.app";

  React.useEffect(() => {
    const ctrl = new AbortController();
    const fetchStocks = async () => {
      if (!open) return;
      setLoadingStocks(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get(`${API_BASE}/api/admin/getAllStock`, {
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

  // fetch city fees when dialog opens
  React.useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setCityLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_BASE}/api/admin/city-fees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to fetch city fees");
        const resData = await res.json();
        const rawList: any[] = Array.isArray(resData) ? resData : (resData?.data ?? resData?.cityFees ?? []);
        const normalized: CityFee[] = (rawList || []).map((c: any) => ({
          city: String(c.city ?? c.name ?? c.cityName ?? c.city_name ?? c.name_en ?? "").trim(),
          fee: c.fee !== undefined ? Number(c.fee) : (c.charge ?? c.amount ?? undefined) !== undefined ? Number(c.charge ?? c.amount) : undefined,
        })).filter((cf) => cf.city);
        if (mounted) setCityFees(normalized);
      } catch (err) {
        console.error("Unable to load city fees", err);
        toast.error("Unable to load city fees");
      } finally {
        if (mounted) setCityLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

  React.useEffect(() => {
    const orderId = order?.id ?? null;
    if (orderId === lastInitOrderIdRef.current) {
      return;
    }
    lastInitOrderIdRef.current = orderId;

    if (!order) {
      setNewOrderId("");
      setNotes("");
      setItems([]);
      setCustomer({});
      return;
    }

    setNewOrderId(order.orderId ?? "");
    setNotes(order.notes ?? "");
    setCustomer({
      name: order.customer?.name ?? "",
      phone: order.customer?.phone ?? "",
      address: order.customer?.address ?? "",
      city: order.customer?.city ?? "",
      postalCode: order.customer?.postalCode ?? "",
    });

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
          available: undefined,
        } as OrderItem;
      })
    );
  }, [order]);

  React.useEffect(() => {
    if (!stocks?.length) return;
    setItems((prev) =>
      prev.map((it) => {
        let stock: StockItem | undefined;
        if (it.productId) stock = stocks.find((s) => getStockId(s) === it.productId);
        if (!stock && it.productName) {
          stock = stocks.find((s) => getStockName(s).toLowerCase() === it.productName!.toLowerCase().trim());
        }
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
  }, [stocks]);

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

  const updateItem = (idx: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const onSelectProduct = (idx: number, selectedId: string) => {
    if (!selectedId) {
      updateItem(idx, { productId: "", productName: "", unitPrice: undefined, available: undefined });
      return;
    }

    const stock = sellerProducts.find((s) => getStockId(s) === selectedId) ?? stocks.find((s) => getStockId(s) === selectedId);
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

  const handleSave = async () => {
    if (!order) return toast.error("No order selected");
    if (!items.length) return toast.error("Order must contain at least one item");

    if (order.status === "ready") {
      const { name, phone, address, city } = customer || {};
      if (!name || !phone || !address || !city) {
        return toast.error("For 'ready' orders: customer name, phone, address and city are required");
      }
    }

    const stockMap = new Map<string, StockItem>();
    for (const s of stocks) {
      const sid = getStockId(s);
      if (sid) stockMap.set(sid, s);
    }

    const fixed = items.map((it) => ({ ...it }));
    const invalid: { idx: number; reason: string }[] = [];

    for (let i = 0; i < fixed.length; i++) {
      const it = fixed[i];
      // If productId missing — allow it only when 'ready' and productName is present
      if (!it.productId) {
        if (order?.status === "ready") {
          if (!it.productName || !String(it.productName).trim()) {
            continue;
          }
        } else {
          continue;
        }
      }

      if (!stockMap.has(it.productId)) {
        continue;
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        continue;
      }
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

    const payload: any = {
      notes: notes ?? "",
      items: fixed.map((it) => ({ productId: it.productId!.trim(), quantity: Number(it.quantity) })),
      customer: {
        name: (customer.name ?? "").toString(),
        phone: (customer.phone ?? "").toString(),
        address: (customer.address ?? "").toString(),
        city: (customer.city ?? "").toString(),
        postalCode: (customer.postalCode ?? "").toString(),
      },
    };

    if ((newOrderId ?? "").toString().trim() !== "") {
      payload.newOrderId = (newOrderId ?? "").toString().trim();
    }

    setLoading(true);
    try {
      const url = `${API_BASE}/api/admin/update-order/${order.id}`;
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

  const selectedCityFee = React.useMemo(() => {
    return cityFees.find((c) => c.city === (customer.city ?? ""))?.fee;
  }, [cityFees, customer.city]);

  const filteredCities = cityFees.filter((c) => c.city.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Make dialog a fixed-height flex column so header/footer stay visible */}
      <DialogContent className="max-w-4xl w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          <div className="grid gap-4">
            <div>
              <label className="text-sm">Seller</label>
              <div className="p-2 rounded-md border bg-muted/30">
                {typeof order?.seller === "object" ? order?.seller?.name ?? order?.seller?._id : order?.seller}
              </div>
            </div>

            <label className="text-sm">Order ID (display / change only for admins)</label>
            <Input value={newOrderId} onChange={(e) => setNewOrderId(e.target.value)} placeholder="ORD-2025-00145" />

            <label className="text-sm">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border p-2 h-24"
              placeholder="Customer requested express delivery."
            />

            {/* Customer fields */}
            <div>
              <h4 className="text-sm font-medium mb-2">Customer</h4>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-xs">Name</label>
                  <Input value={customer.name ?? ""} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} />
                </div>

                <div>
                  <label className="text-xs">Phone</label>
                  <Input value={customer.phone ?? ""} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
                </div>

                <div>
                  <label className="text-xs">Address</label>
                  <textarea
                    value={customer.address ?? ""}
                    onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                    className="w-full rounded-md border p-2 h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs">City</label>
                    {/* City popover (copied/adapted from AddOrder) */}
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityOpen}
                          className="w-full justify-between bg-transparent"
                          onClick={() => setCityOpen(!cityOpen)}
                        >
                          <span className="truncate">{customer.city || (cityLoading ? "Loading cities..." : "Select city...")}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2 space-y-2">
                          <Input
                            placeholder="Search city..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="h-8"
                            autoFocus
                          />

                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {cityLoading ? (
                              <div className="px-2 py-2 text-sm text-muted-foreground text-center">Loading cities...</div>
                            ) : filteredCities.length > 0 ? (
                              filteredCities.map((c) => (
                                <button
                                  key={c.city}
                                  onClick={() => {
                                    setCustomer((cur) => ({ ...cur, city: c.city }));
                                    setCitySearch("");
                                    setCityOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${customer.city === c.city ? "bg-accent text-accent-foreground" : ""}`}
                                >
                                  <span>{c.city}{c.fee !== undefined ? ` — ${c.fee}` : ""}</span>
                                  {customer.city === c.city && <Check className="h-4 w-4" />}
                                </button>
                              ))
                            ) : (
                              <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                                No cities found
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {selectedCityFee !== undefined && (
                      <div className="text-sm mt-1">Delivery fee: {selectedCityFee}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Postal Code</label>
                    <Input value={customer.postalCode ?? ""} onChange={(e) => setCustomer((c) => ({ ...c, postalCode: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Items — kept commented as in original (you can un-comment if needed) */}
          </div>
        </div>

        <DialogFooter className="border-t px-4 py-3 bg-white/60">
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
