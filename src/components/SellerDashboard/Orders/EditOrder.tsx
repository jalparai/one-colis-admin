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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import toast from "react-hot-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";

/* ---------- Types ---------- */
interface Order {
  _id?: string;
  id?: string;
  orderId?: string;
  notes?: string;
  items?: any[];
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  seller?: any;
}

type CityFee = { city: string; fee?: number };

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

  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPostalCode, setCustomerPostalCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // city fees state
  const [cityFees, setCityFees] = useState<CityFee[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  /* Initialize form from order - reset on open/order change */
  useEffect(() => {
    if (!open) return;

    setMessage("");

    if (!order) {
      setNotes("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setCustomerCity("");
      setCustomerPostalCode("");
      return;
    }

    setNotes(order.notes ?? "");
    setCustomerName(order.customer?.name ?? "");
    setCustomerPhone(order.customer?.phone ?? "");
    setCustomerAddress(order.customer?.address ?? "");
    setCustomerCity(order.customer?.city ?? "");
    setCustomerPostalCode(order.customer?.postalCode ?? "");
  }, [order, open]);

  // fetch city fees when sheet opens
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setCityLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/admin/city-fees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Failed to fetch city fees");
        const resData = await res.json();
        const rawList: any[] = Array.isArray(resData) ? resData : (resData?.data ?? resData?.cityFees ?? []);
        const normalized: CityFee[] = (rawList || [])
          .map((c: any) => ({
            city: String(c.city ?? c.name ?? c.cityName ?? c.city_name ?? c.name_en ?? "").trim(),
            fee:
              c.fee !== undefined
                ? Number(c.fee)
                : (c.charge ?? c.amount ?? undefined) !== undefined
                ? Number(c.charge ?? c.amount)
                : undefined,
          }))
          .filter((cf) => cf.city);
        if (mounted) setCityFees(normalized);
      } catch (err) {
        console.error("[EditOrder] Unable to load city fees", err);
        toast.error("Unable to load city fees");
      } finally {
        if (mounted) setCityLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

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

      const token = getToken();
      if (!token) {
        toast.error("No auth token found. Please login.");
        setLoading(false);
        return;
      }

      // Build payload matching backend API structure
      const payload = {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          city: customerCity.trim(),
          postalCode: customerPostalCode.trim(),
        },
        notes: notes.trim(),
      };

      console.log("[EditOrder] Sending payload:", JSON.stringify(payload, null, 2));

      const dbId = String(order._id ?? order.id ?? "").trim();
      if (!dbId) {
        toast.error("Order database id (_id) is missing. Cannot update.");
        setLoading(false);
        return;
      }

      const idForRoute = encodeURIComponent(dbId);
      // use seller route like your existing code
      const url = `${API_BASE}/api/seller/orders/${idForRoute}`;

      const res = await axios.put(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      console.log("[EditOrder] Response:", res.status, res.data);

      if (res.status >= 200 && res.status < 300) {
        setMessage("✅ Order updated successfully");
        toast.success("Order updated successfully");

        // Refresh parent data
        if (onUpdated) {
          await Promise.resolve(onUpdated());
        }

        // Close the sheet after a brief delay
        setTimeout(() => onClose(), 300);
      } else {
        const detail = res.data?.message ?? "Update failed";
        setMessage(`❌ ${detail}`);
        toast.error(detail);
      }
    } catch (err: any) {
      console.error("[EditOrder] error", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Unexpected error";
      setMessage(`❌ ${msg}`);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedCityFee = React.useMemo(() => {
    return cityFees.find((c) => c.city === (customerCity ?? ""))?.fee;
  }, [cityFees, customerCity]);

  const filteredCities = cityFees.filter((c) => c.city.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Order</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSave} className="space-y-4 py-4 pl-4">
          <div className="space-y-2">
            <Label>Order ID</Label>
            <Input value={order?.orderId ?? order?._id ?? ""} disabled className="bg-gray-100" />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Customer Information</h3>

            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerCity">City *</Label>

              {/* City popover (searchable) */}
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
                        <div className="px-2 py-2 text-sm text-muted-foreground text-center">No cities found</div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {selectedCityFee !== undefined && <div className="text-sm mt-1">Delivery fee: {selectedCityFee}</div>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address *</Label>
              <Input
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter street address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPostalCode">Postal Code</Label>
              <Input
                id="customerPostalCode"
                value={customerPostalCode}
                onChange={(e) => setCustomerPostalCode(e.target.value)}
                placeholder="Enter postal code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Urgent delivery, fragile items"
            />
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded ${
                message.includes("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </form>

        <SheetFooter className="gap-2 mt-4">
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
