"use client";

import { useState, useEffect } from "react";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";

export function AddPayout({ onPayoutAdded }: { onPayoutAdded?: () => void }) {
  const [seller, setSeller] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerOpen, setSellerOpen] = useState(false);

  const [sellers, setSellers] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [fees, setFees] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fetchingSellers, setFetchingSellers] = useState(true);

  // Fetch all sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "https://cod-ecommerce-two.vercel.app/api/admin/sellers",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSellers(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch sellers:", err);
      } finally {
        setFetchingSellers(false);
      }
    };
    fetchSellers();
  }, []);

  const handleAddPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/admin/create-payout",
        { seller, amount, fees, method, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Payout created successfully!");
      setSeller("");
      setSellerName("");
      setSellerSearch("");
      setAmount("");
      setFees("");
      setMethod("");
      setNotes("");

      if (onPayoutAdded) onPayoutAdded();
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "❌ Failed to create payout");
      } else {
        setMessage("❌ Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>+ Add Payout</Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Payout</SheetTitle>
          <SheetDescription>
            Fill in the payout details to create a new payout record.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleAddPayout}
          className="grid flex-1 auto-rows-min gap-6 px-4 overflow-scroll py-4"
        >
          {/* Seller Dropdown */}
          <div className="grid gap-2">
            <Label>Seller</Label>
            <Popover open={sellerOpen} onOpenChange={setSellerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sellerOpen}
                  className="w-full justify-between bg-transparent"
                  onClick={() => setSellerOpen(!sellerOpen)}
                >
                  <span className="truncate">
                    {sellerName || (fetchingSellers ? "Loading sellers..." : "Select Seller")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Search seller..."
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    className="h-8"
                    autoFocus
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {sellers.filter((s) =>
                      s.name.toLowerCase().includes(sellerSearch.toLowerCase())
                    ).length > 0 ? (
                      sellers
                        .filter((s) =>
                          s.name.toLowerCase().includes(sellerSearch.toLowerCase())
                        )
                        .map((s) => (
                          <button
                            key={s._id}
                            onClick={() => {
                              setSeller(s._id);
                              setSellerName(s.name);
                              setSellerOpen(false);
                              setSellerSearch("");
                            }}
                            className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                              seller === s._id ? "bg-accent text-accent-foreground" : ""
                            }`}
                          >
                            <span>{s.name || s.email}</span>
                            {seller === s._id && <Check className="h-4 w-4" />}
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

          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            required
          />
          <Input
            id="fees"
            type="number"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            placeholder="Fees"
          />
          <Input
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Payment Method"
            required
          />
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />

          {message && <p className="text-sm text-red-500">{message}</p>}

          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Payout"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
