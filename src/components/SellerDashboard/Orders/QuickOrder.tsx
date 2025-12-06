"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import toast from "react-hot-toast"
import { Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Seller = {
  id: string
  name: string
}

// NOTE: unitPrice is now string | number so the input can be empty ""
type Item = {
  productName: string
  quantity: number
  unitPrice: string | number
}

type CityFee = { 
  city: string
  fee?: number 
}

export function AddReadyOrder({
  onOrderAdded,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  onOrderAdded?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const API_BASE = "https://cod-ecommerce-two.vercel.app"
  
  const [sellerId, setSellerId] = useState("")
  const [sellers, setSellers] = useState<Seller[]>([])

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerCity, setCustomerCity] = useState("")
  const [customerPostalCode, setCustomerPostalCode] = useState("")
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")

  // INITIAL ITEM: unitPrice is empty string so the box shows empty (no 0)
  const [items, setItems] = useState<Item[]>([
    { productName: "", quantity: 1, unitPrice: "" },
  ])

  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // City fees state
  const [cityFees, setCityFees] = useState<CityFee[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [citySearch, setCitySearch] = useState("")

  const selectedCityFee = cityFees.find(c => c.city === customerCity)?.fee
  const filteredCities = cityFees.filter(c => 
    c.city.toLowerCase().includes(citySearch.toLowerCase())
  )

  // Fetch sellers for dropdown
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) return
        const res = await axios.get(`${API_BASE}/api/admin/sellers`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        })
        const raw = res.data?.data ?? (Array.isArray(res.data) ? res.data : [])
        const normalized: Seller[] = (raw || [])
          .map((s: any) => ({
            id: s.id ?? s._id ?? s._id_str ?? "",
            name: s.name ?? s.shopName ?? s.email ?? "Unknown",
          }))
          .filter((s: Seller) => !!s.id)
        setSellers(normalized)
      } catch (err) {
        console.error("Error fetching sellers", err)
      }
    }
    fetchSellers()
  }, [])

  // Fetch city fees
  useEffect(() => {
    async function fetchCityFees() {
      setCityLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        const res = await fetch(`${API_BASE}/api/admin/city-fees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        if (!res.ok) throw new Error("Failed to fetch city fees")
        const resData = await res.json()
        
        // Normalize different possible shapes from the API
        const rawList: any[] = Array.isArray(resData) 
          ? resData 
          : (resData?.data ?? resData?.cityFees ?? [])
        
        const normalized: CityFee[] = (rawList || []).map((c: any) => ({
          city: String(
            c.city ?? c.name ?? c.cityName ?? c.city_name ?? c.name_en ?? ""
          ).trim(),
          fee: c.fee !== undefined 
            ? Number(c.fee) 
            : (c.charge ?? c.amount ?? undefined) !== undefined 
            ? Number(c.charge ?? c.amount) 
            : undefined,
        })).filter(cf => cf.city)
        
        setCityFees(normalized)
      } catch (err) {
        console.error("Unable to load city fees", err)
        toast.error("Unable to load city fees")
      } finally {
        setCityLoading(false)
      }
    }

    fetchCityFees()
  }, [])

  const filteredSellers = sellers.filter((s) =>
    s.name.toLowerCase().includes(searchInput.toLowerCase())
  )
  const selectedSellerName = sellers.find((s) => s.id === sellerId)?.name

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const addItem = () => setItems((prev) => [...prev, { productName: "", quantity: 1, unitPrice: "" }])
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone || !customerAddress || !customerCity) {
      toast.error("Please fill customer name, phone, address, and city")
      return
    }
    if (!items.length || items.some((it) => !it.productName || it.quantity <= 0)) {
      toast.error("Please add at least one valid item")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Authentication token missing")

      // Build payload: convert unitPrice string -> number if provided; keep 0 if not specified
      const itemsPayload = items.map((it) => {
        const price = typeof it.unitPrice === "string" ? (it.unitPrice.trim() === "" ? 0 : Number(it.unitPrice)) : Number(it.unitPrice)
        return {
          productName: it.productName,
          quantity: Number(it.quantity),
          unitPrice: isFinite(price) ? price : 0,
        }
      })

      const payload = {
        sellerId,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          city: customerCity.trim(),
          postalCode: customerPostalCode.trim() || undefined,
        },
        // Also send at root level for backward compatibility
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerCity: customerCity.trim(),
        customerPostalCode: customerPostalCode.trim() || undefined,
        items: itemsPayload,
        notes,
      }

      await axios.post(`${API_BASE}/api/seller/orders/ready`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("Ready order created successfully")

      // reset
      setSellerId("")
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setCustomerCity("")
      setCustomerPostalCode("")
      setItems([{ productName: "", quantity: 1, unitPrice: "" }])
      setNotes("")

      onOrderAdded?.()
    } catch (err: any) {
      console.error("Failed to create ready order", err)
      const msg = err?.response?.data?.message || err.message || "Failed to create ready order"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={externalOpen} onOpenChange={externalOnOpenChange}>
      {/* Only show the internal trigger when this component is used standalone */}
      {typeof externalOpen === "undefined" && (
        <SheetTrigger asChild>
          <Button>+ Add Ready Order</Button>
        </SheetTrigger>
      )}
      
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Ready Order</SheetTitle>
          <SheetDescription>Fill in the details to create a ready order.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="grid flex-1 auto-rows-min gap-6 px-4 overflow-scroll py-2">
          {/* Customer Info */}
          <div className="grid gap-2">
            <Label>Customer Info</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input 
                placeholder="Name" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                required 
              />
              <Input 
                placeholder="Phone" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
                required 
              />
              <Input 
                placeholder="Address" 
                value={customerAddress} 
                onChange={(e) => setCustomerAddress(e.target.value)} 
                required 
              />

              {/* City Select with Popover */}
              <div>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityOpen}
                      className="w-full justify-between bg-transparent"
                      type="button"
                    >
                      <span className="truncate">
                        {customerCity || (cityLoading ? "Loading cities..." : "Select city...")}
                      </span>
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
                          <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                            Loading cities...
                          </div>
                        ) : filteredCities.length > 0 ? (
                          filteredCities.map((c) => (
                            <button
                              key={c.city}
                              type="button"
                              onClick={() => {
                                setCustomerCity(c.city)
                                setCitySearch("")
                                setCityOpen(false)
                              }}
                              className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                                customerCity === c.city ? "bg-accent text-accent-foreground" : ""
                              }`}
                            >
                              <span>
                                {c.city}
                                {c.fee !== undefined ? ` — ${c.fee} DH` : ""}
                              </span>
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
                  <div className="text-sm mt-1 text-muted-foreground">
                    Delivery fee: {selectedCityFee} DH
                  </div>
                )}
              </div>

             
            </div>
          </div>

          {/* Items */}
          <div className="grid gap-2">
            <Label>Items</Label>
            {items.map((it, idx) => (
              <div key={idx} className="items-center">
                <div className="md:col-span-3">
                  <Input
                    placeholder="Product name"
                    value={it.productName}
                    onChange={(e) => updateItem(idx, { productName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 mt-3 gap-2">
                  <div>
                    <Label className="mb-2">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="mb-2">Amount</Label>
                    {/* value is empty string by default; onChange stores raw string so user can delete/backspace freely */}
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Unit Price"
                      value={it.unitPrice ?? ""}
                      onChange={(e) => {
                        // Keep raw input so the field can be empty until user types
                        // note: e.target.value is a string even for type="number" in React; keep it as-is
                        updateItem(idx, { unitPrice: e.target.value })
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => addItem()}>
                    Add
                  </Button>
                  {items.length > 1 && (
                    <Button type="button" variant="destructive" onClick={() => removeItem(idx)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="grid gap-3">
            <Label htmlFor="notes">Notes</Label>
            <Input 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Optional notes" 
            />
          </div>

          <SheetFooter className="gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
