// AddOrder.tsx
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
import { ProductSelect } from "@/components/Seller/ProductSelect";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

interface AddOrderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderAdded?: () => void;
}

type Product = {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  quantity?: number | undefined; // allow undefined when backend doesn't provide it
};

type Row = {
  id: string;
  productId?: string | null;
  productName?: string;
  sku?: string;
  unitPrice?: number;
  quantity?: number;
  available?: number | undefined; // unknown vs zero
  total?: number;
};

type CityFee = { city: string; fee?: number };


export function AddOrder({ open, onOpenChange, onOrderAdded }: AddOrderProps) {
  const API_BASE = "https://cod-ecommerce-two.vercel.app";
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Row[]>([
    { id: String(Date.now()), productId: null, productName: "", quantity: 1, unitPrice: 0, total: 0, available: undefined },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ignoreStock, setIgnoreStock] = useState(false); // <-- allow override
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerCity, setCustomerCity] = useState("")
  const [customerPostalCode, setCustomerPostalCode] = useState("")
  // Fetch seller's products when sheet opens
  useEffect(() => {
    if (!open) return;

    const fetchProducts = async () => {
      setProducts([]);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const candidates = [
          `${API_BASE}/api/seller/products`,
          `${API_BASE}/seller/products`,
          `${API_BASE}/api/products/mine`,
          `${API_BASE}/api/products?sellerSelf=true`,
          `${API_BASE}/api/products?mine=true`,
        ];

        let res: any = null;
        for (const url of candidates) {
          try {
            res = await axios.get(url, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              validateStatus: () => true,
            });
            if (res && res.status >= 200 && res.status < 300 && (Array.isArray(res.data?.data) || Array.isArray(res.data))) {
              break;
            }
          } catch (err) {
            // try next
          }
        }

        const raw = res?.data?.data ?? (Array.isArray(res?.data) ? res.data : []);
        const normalized: Product[] = (raw || []).map((p: any, i: number) => ({
          id: String(p.id ?? p._id ?? `fallback-${i}`),
          name: p.name ?? p.title ?? p.productName ?? p.sku ?? "Unnamed product",
          sku: p.sku,
          // allow price/quantity to be undefined if backend didn't provide them
          price: p.price !== undefined ? Number(p.price) : (p.unitPrice !== undefined ? Number(p.unitPrice) : undefined),
          quantity:
            p.quantity !== undefined
              ? Number(p.quantity)
              : (p.stock !== undefined ? Number(p.stock) : undefined),
        }));

        setProducts(normalized);
      } catch (err) {
        console.error("Error fetching seller products", err);
        setProducts([]);
      }
    };

    fetchProducts();
    // reset form each time sheet opens
    setItems([{ id: String(Date.now()), productId: null, productName: "", quantity: 1, unitPrice: 0, total: 0, available: undefined }]);
    setNotes("");
    setMessage("");
    setIgnoreStock(false);
  }, [open]);

  // Helpers
  const updateItem = (index: number, patch: Partial<Row>) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], ...patch };

      // If productId changed, fill productName, unitPrice, available (only if backend provided)
      if (patch.productId !== undefined) {
        const prod = products.find((p) => p.id === patch.productId);
        if (prod) {
          current.productName = prod.name;
          current.sku = prod.sku;
          current.unitPrice = prod.price ?? 0;
          current.available = prod.quantity !== undefined ? prod.quantity : undefined;
        } else {
          current.productName = "";
          current.unitPrice = 0;
          current.available = undefined;
        }
      }

      const qty = Number(current.quantity ?? 0) || 0;
      const unit = Number(current.unitPrice ?? 0) || 0;
      current.total = qty * unit;

      copy[index] = current;
      return copy;
    });
  };

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), productId: null, productName: "", quantity: 1, unitPrice: 0, total: 0, available: undefined },
    ]);

  const removeRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const itemsTotal = items.reduce((s, it) => s + (Number(it.total ?? 0) || 0), 0);

  // city fees state
  const [cityFees, setCityFees] = useState<CityFee[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const selectedCityFee = cityFees.find(c => c.city === customerCity)?.fee;

  // city popover state
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const filteredCities = cityFees.filter(c => c.city.toLowerCase().includes(citySearch.toLowerCase()));



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



// Fix for AddOrder.tsx - handleAddOrder function
const handleAddOrder = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage("");

  // Validate customer info
  if (!customerName.trim()) {
    setMessage("Customer name is required");
    return;
  }
  if (!customerPhone.trim()) {
    setMessage("Customer phone is required");
    return;
  }
  if (!customerAddress.trim()) {
    setMessage("Customer address is required");
    return;
  }
  if (!customerCity.trim()) {
    setMessage("Customer city is required");
    return;
  }

  // Basic validation for items
  for (const [idx, r] of items.entries()) {
    if (!r.productId) {
      setMessage(`Please pick a product for line ${idx + 1}`);
      return;
    }
    const q = Number(r.quantity ?? 0);
    if (!Number.isFinite(q) || q <= 0) {
      setMessage(`Invalid quantity for line ${idx + 1}`);
      return;
    }
    if (!ignoreStock && Number.isFinite(Number(r.available)) && q > Number(r.available)) {
      setMessage(`Quantity for line ${idx + 1} exceeds available stock (${r.available})`);
      return;
    }
  }

  setLoading(true);

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setMessage("Authentication token missing");
      setLoading(false);
      return;
    }

    // Ensure payload has all customer fields with proper structure
    const payload = {
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        city: customerCity.trim(),
        postalCode: customerPostalCode.trim() || undefined,
      },
      // Also send customer fields at root level for backward compatibility
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerCity: customerCity.trim(),
      customerPostalCode: customerPostalCode.trim() || undefined,
      items: items.map((it) => ({ 
        productId: it.productId, 
        quantity: Number(it.quantity ?? 0) 
      })),
      notes: notes.trim() || undefined,
      meta: { ignoreStock: Boolean(ignoreStock) },
    };

    console.log("Sending order payload:", payload); // Debug log

    const attempts = [
      `${API_BASE}/api/seller/orders`,
      `${API_BASE}/seller/orders`,
      `${API_BASE}/api/orders`,
    ];

    let res: any = null;
    let ok = false;
    const errors: any[] = [];

    for (const url of attempts) {
      try {
        res = await axios.post(url, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          validateStatus: () => true,
        });
        
        console.log(`Response from ${url}:`, res.data); // Debug log
        
        if (res.status >= 200 && res.status < 300) {
          ok = true;
          break;
        } else {
          errors.push({ url, status: res.status, data: res.data });
          if (res.status === 401 || res.status === 403) break;
        }
      } catch (err: any) {
        errors.push({ url, error: err?.message ?? err });
      }
    }

    if (!ok) {
      console.error("All attempts failed:", errors);
      const firstErr = errors[0];
      setMessage(firstErr?.data?.message ?? "Failed to create order");
      toast.error("Failed to create order — check console");
      setLoading(false);
      return;
    }

    toast.success("Order created successfully");
    
    // Reset form
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerCity("");
    setCustomerPostalCode("");
    setItems([{ 
      id: String(Date.now()), 
      productId: null, 
      productName: "", 
      quantity: 1, 
      unitPrice: 0, 
      total: 0, 
      available: undefined 
    }]);
    setNotes("");
    setIgnoreStock(false);
    setMessage("Order created successfully");
    
    onOrderAdded?.();
    onOpenChange(false);
  } catch (err: any) {
    console.error("Create order error", err);
    const msg = axios.isAxiosError(err) 
      ? err.response?.data?.message || err.message 
      : "Unexpected error";
    setMessage(msg);
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Order Based On Stock</SheetTitle>
          <SheetDescription>Select products and quantities to create an order.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleAddOrder} className="grid flex-1 auto-rows-min gap-6 px-4 overflow-scroll overflow-scroll">
          <div className="grid gap-2">
            <Label>Customer Info</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
              <Input placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />

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

            </div>
          </div>
          <div>
            <Label>Products</Label>
            <div className="space-y-3">
              {items.map((row, idx) => (
                <div key={row.id} className=" items-center">
                  <div className="col-span-6">
                    <ProductSelect
                      value={row.productId ?? null}
                      onChange={(v) => updateItem(idx, { productId: v })}
                      placeholder="Select product"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[12px] mb-2">Qty</label>

                    <Input
                      type="number"
                      min={1}
                      value={String(row.quantity ?? 1)}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value ?? 0) })}
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[12px] mb-2">Unit Price</label>

  <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder=""
                        value={row.unitPrice ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const parsed = v === "" ? undefined : parseFloat(v);
                          updateItem(idx, { unitPrice: parsed });
                        }}
                      />                  </div>



                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={items.length === 1}
                      onClick={() => removeRow(idx)}
                      className="h-8 px-2"
                    >
                      Remove
                    </Button>
                  </div>

                  {/* show available (if known) */}
                  <div className="col-span-12 text-xs text-muted-foreground">
                    {row.available === undefined ? "Stock: unknown" : `Stock: ${row.available}`}
                  </div>
                </div>
              ))}

              <div>
                <Button type="button" onClick={addRow}>
                  + Add product
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[12px] mb-2">Note</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          {/* <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 lg:overflow-auto overflow-x-scroll text-sm">
              <input type="checkbox" checked={ignoreStock} onChange={(e) => setIgnoreStock(e.target.checked)} />
              <span>Force create order even if quantity exceeds stock</span>
            </label>
            {ignoreStock && <div className="text-sm text-yellow-600">You are bypassing stock validation.</div>}
          </div> */}

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Total: {itemsTotal.toFixed(2)}</div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Order"}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </SheetClose>
            </div>
          </div>

          {message && <p className={`text-sm mt-1 ${message.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}

          <SheetFooter />
        </form>
      </SheetContent>
    </Sheet>
  );
}
