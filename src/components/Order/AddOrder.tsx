"use client";

import { useEffect, useState } from "react";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import toast from "react-hot-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

type Seller = { id: string; name: string };
type Product = { id: string; name: string; sku?: string; price?: number; sellerId?: string; qty?: number };
type OrderItem = {
  productId?: string | null;
  sku?: string | null;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  open?: boolean;
  searchInput?: string;
};
type CityFee = { city: string; fee?: number };

export function AddOrder({ onOrderAdded }: { onOrderAdded?: () => void }) {
  const API_BASE = "https://cod-ecommerce-two.vercel.app";
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerId, setSellerId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([{ productId: null, sku: null, productName: "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPostalCode, setCustomerPostalCode] = useState("");

  // city fees state
  const [cityFees, setCityFees] = useState<CityFee[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  // city popover state
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  // fetch sellers
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        const res = await axios.get(`${API_BASE}/api/admin/sellers`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
        const raw = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        const normalized: Seller[] = (raw || []).map((s: any) => ({ id: s.id ?? s._id ?? s._id_str ?? "", name: s.name ?? s.shopName ?? s.email ?? "Unknown" })).filter(Boolean);
        setSellers(normalized);
      } catch (err) {
        console.error("Error fetching sellers", err);
      }
    })();
  }, []);

  const filteredSellers = sellers.filter((s) =>
    s.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  const selectedSellerName = sellers.find((s) => s.id === sellerId)?.name;

  // fetch all stock from the provided endpoint
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get(`${API_BASE}/api/admin/getAllStock`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, validateStatus: () => true });
        const raw = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
        const normalized: Product[] = (raw || []).map((p: any) => ({
          id: p.productId ?? p._id ?? p.product?._id ?? p.id ?? String(Math.random()),
          name: p.productName ?? p.product?.name ?? p.name ?? p.sku ?? "Unnamed product",
          sku: p.sku ?? p.product?.sku,
          price: Number(p.price ?? p.unitPrice ?? p.product?.price ?? 0),
          sellerId: p.sellerId ?? p.seller?._id ?? p.seller ?? p.product?.seller,
          qty: Number(p.quantity ?? p.stock ?? p.product?.quantity ?? 0),
        }));
        setProducts(normalized);
      } catch (err) {
        console.error("Error fetching stock", err);
        setProducts([]);
      }
    })();
  }, []);

  // fetch city fees and normalize the shape
  useEffect(() => {
    async function fetchCityFees() {
      setCityLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(`${API_BASE}/api/admin/city-fees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) throw new Error("Failed to fetch city fees");
        const resData = await res.json();
        // Normalize different possible shapes from the API
        const rawList: any[] = Array.isArray(resData) ? resData : (resData?.data ?? resData?.cityFees ?? []);
        const normalized: CityFee[] = (rawList || []).map((c: any) => ({
          city: String(c.city ?? c.name ?? c.cityName ?? c.city_name ?? c.name_en ?? "").trim(),
          fee: c.fee !== undefined ? Number(c.fee) : (c.charge ?? c.amount ?? undefined) !== undefined ? Number(c.charge ?? c.amount) : undefined,
        })).filter(cf => cf.city);
        setCityFees(normalized);
      } catch (err) {
        console.error("Unable to load city fees", err);
        toast.error("Unable to load city fees");
      } finally {
        setCityLoading(false);
      }
    }

    fetchCityFees();
  }, []);

  const availableProducts = sellerId ? products.filter(p => String(p.sellerId) === String(sellerId)) : products;

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      if (patch.productId) {
        const prod = products.find(p => p.id === patch.productId);
        if (prod) {
          next[index].productName = prod.name;
          next[index].sku = prod.sku ?? next[index].sku;
          next[index].unitPrice = prod.price ?? next[index].unitPrice;
        }
      }
      next[index].total = (next[index].unitPrice ?? 0) * (Number(next[index].quantity ?? 0) || 0);
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, { productId: null, sku: null, productName: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { setMessage("Authentication required"); setLoading(false); return; }
      if (!sellerId) { setMessage("Please select a seller"); setLoading(false); return; }
      if (!items.length) { setMessage("Add at least one product"); setLoading(false); return; }

      if (!customerName || !customerPhone || !customerAddress || !customerCity) {
        toast.error("Please fill customer name, phone, address, and city");
        setLoading(false);
        return;
      }

      for (const [i, it] of items.entries()) {
        if (!it.productId) { setMessage(`Select product for line ${i + 1}`); setLoading(false); return; }
        const q = Number(it.quantity ?? 0);
        if (!Number.isFinite(q) || q <= 0) { setMessage(`Invalid quantity at line ${i + 1}`); setLoading(false); return; }
        // ensure sku exists for compatibility
        if (!it.sku) {
          // try to fill from products list
          const prod = products.find(p => p.id === it.productId);
          if (prod?.sku) it.sku = prod.sku;
        }
        if (!it.sku) { setMessage(`Product SKU missing for line ${i + 1}`); setLoading(false); return; }
      }

      const payload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          postalCode: customerPostalCode,
        },
        sellerId,
        // include sku and productId for compatibility
        items: items.map(it => ({ productId: it.productId, sku: it.sku, quantity: Number(it.quantity) })),
        notes,
      };

      const res = await axios.post(`${API_BASE}/api/admin/create/orders`, payload, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });

      if (res.status >= 200 && res.status < 300) {
        const created = res.data?.data ?? res.data?.order ?? res.data;
        const createdOrderId =
          created?.orderId ??
          created?.order_number ??
          created?.orderNo ??
          created?.trackingNumber ??
          created?._id ??
          "";

        toast.success(createdOrderId ? `Order created: ${createdOrderId}` : "Order created");

        setMessage("Order created");
        setItems([{ productId: null, sku: null, productName: "", quantity: 1, unitPrice: 0 }]);
        setNotes("");
        setSellerId("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setCustomerCity("");
        setCustomerPostalCode("");
        onOrderAdded?.();
      } else {
        setMessage(res.data?.message ?? `Failed (${res.status})`);
        toast.error(res.data?.message ?? `Failed (${res.status})`);
      }
    } catch (err: any) {
      console.error("Add order error", err);
      const errMsg = err?.response?.data?.message ?? err.message ?? "Unexpected error";
      setMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative")) {
        /* nothing specific for seller anymore, kept for legacy UI behavior */
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const selectedCityFee = cityFees.find(c => c.city === customerCity)?.fee;

  const filteredCities = cityFees.filter(c => c.city.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>+ Add Order Based on Stock</Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Order</SheetTitle>
          <SheetDescription>Choose seller and products to create a new order.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleAddOrder} className="grid gap-4 px-4 overflow-scroll">
          <div>
            <Label className="mb-2">Seller</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-transparent"
                  onClick={() => setOpen(!open)} // toggle on click
                >
                  <span className="truncate">{selectedSellerName || "Select seller..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Search seller..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="h-8"
                    autoFocus
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredSellers.length > 0 ? (
                      filteredSellers.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSellerId(s.id);
                            setSearchInput("");
                            setOpen(false);
                            setItems([{ productId: null, sku: null, productName: "", quantity: 1, unitPrice: 0 }]);
                          }}
                          className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${sellerId === s.id ? "bg-accent text-accent-foreground" : ""
                            }`}
                        >
                          <span>{s.name}</span>
                          {sellerId === s.id && <Check className="h-4 w-4" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                        No sellers found
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Customer Info</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
              <Input placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />

              {/* city popover */}
              <div>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityOpen}
                      className="w-full justify-between bg-transparent"
                      onClick={() => setCityOpen(!cityOpen)}
                    >
                      <span className="truncate">{customerCity || (cityLoading ? "Loading cities..." : "Select city...")}</span>
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
                                setCustomerCity(c.city);
                                setCitySearch("");
                                setCityOpen(false);
                              }}
                              className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${customerCity === c.city ? "bg-accent text-accent-foreground" : ""}`}
                            >
                              <span>{c.city}{c.fee !== undefined ? ` — ${c.fee}` : ""}</span>
                              {customerCity === c.city && <Check className="h-4 w-4" />}
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

              <Input placeholder="Postal Code" value={customerPostalCode} onChange={(e) => setCustomerPostalCode(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-2">Products</Label>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="gap-2 items-center">
                  <div className="col-span-6">
                    <Popover open={it.open || false} onOpenChange={(open) => updateItem(idx, { open })}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={it.open || false}
                          className="w-full justify-between bg-transparent"
                          onClick={() => updateItem(idx, { open: !(it.open || false) })}
                        >
                          <span className="truncate">{it.productName || "-- Select product --"}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2 space-y-2">
                          <Input
                            placeholder="Search product..."
                            value={it.searchInput || ""}
                            onChange={(e) => updateItem(idx, { searchInput: e.target.value })}
                            className="h-8"
                            autoFocus
                          />

                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {availableProducts.filter(p =>
                              p.name.toLowerCase().includes((it.searchInput || "").toLowerCase())
                            ).length > 0 ? (
                              availableProducts
                                .filter(p =>
                                  p.name.toLowerCase().includes((it.searchInput || "").toLowerCase())
                                )
                                .map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      updateItem(idx, {
                                        productId: p.id,
                                        productName: p.name,
                                        sku: p.sku,
                                        unitPrice: p.price,
                                        searchInput: "",
                                        open: false,
                                      });
                                    }}
                                    className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${it.productId === p.id ? "bg-accent text-accent-foreground" : ""
                                      }`}
                                  >
                                    <span>{p.name}{p.sku ? ` (${p.sku})` : ""}</span>
                                    {it.productId === p.id && <Check className="h-4 w-4" />}
                                  </button>
                                ))
                            ) : (
                              <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                                No products found
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 mt-4 gap-2">
                    <div className="col-span-1">
                      <Label className="mb-2">Qty</Label>
                      <Input type="number" min={1} value={it.quantity ?? 1} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })} />
                    </div>

                    <div className="col-span-1">
                      <Label className="mb-2">Amount</Label>
                      <Input value={it.unitPrice ?? ""} readOnly placeholder="unit price" />
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-12">
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" onClick={(e) => { e.preventDefault(); removeItem(idx); }} disabled={items.length === 1}>Remove</Button>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Button type="button" onClick={addItem}>+ Add product</Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2">Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Deliver by Friday" />
          </div>

          {message && <p className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}

          <SheetFooter>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Order"}</Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
