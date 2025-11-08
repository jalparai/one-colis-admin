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
import { Check, ChevronsUpDownIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Seller = {
  id: string
  name: string
}

type Item = {
  productName: string
  quantity: number
  unitPrice: number
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
  const [sellerId, setSellerId] = useState("")
  const [sellers, setSellers] = useState<Seller[]>([])

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerCity, setCustomerCity] = useState("")
  const [customerPostalCode, setCustomerPostalCode] = useState("")
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")

  const [items, setItems] = useState<Item[]>([
    { productName: "", quantity: 1, unitPrice: 0 },
  ])

  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch sellers for dropdown
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) return
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/sellers", {
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
  const filteredSellers = sellers.filter((s) =>
    s.name.toLowerCase().includes(searchInput.toLowerCase())
  )
  const selectedSellerName = sellers.find((s) => s.id === sellerId)?.name

  const updateItem = (index: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const addItem = () => setItems((prev) => [...prev, { productName: "", quantity: 1, unitPrice: 0 }])
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

      const payload = {
        sellerId,
        customer: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          city: customerCity,
          postalCode: customerPostalCode,
        },
        items: items.map((it) => ({
          productName: it.productName,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice) || 0,
        })),
        notes,
      }

      await axios.post("https://cod-ecommerce-two.vercel.app/api/seller/orders/ready", payload, {
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
      setItems([{ productName: "", quantity: 1, unitPrice: 0 }])
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
  {/* Only show the internal trigger when this component is used standalone
          (i.e. parent didn't pass `open` prop). */}
      {typeof externalOpen === "undefined" && (
        <SheetTrigger asChild>
          <Button>+ Add Ready Order</Button>
        </SheetTrigger>
      )}      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Ready Order</SheetTitle>
          <SheetDescription>Fill in the details to create a ready order.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="grid flex-1 auto-rows-min gap-6 px-4 overflow-scroll py-2 overflow-scroll">
          {/* Seller */}

          {/* Customer Info */}
          <div className="grid gap-2">
            <Label>Customer Info</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
              <Input placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
              <Input placeholder="City" value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} required />
              <Input placeholder="Postal Code" value={customerPostalCode} onChange={(e) => setCustomerPostalCode(e.target.value)} />
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
                  <div className="">
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

                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Unit Price"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => addItem()}>Add</Button>
                  {items.length > 1 && (
                    <Button type="button" variant="destructive" onClick={() => removeItem(idx)}>Remove</Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="grid gap-3">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <SheetFooter className="gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
