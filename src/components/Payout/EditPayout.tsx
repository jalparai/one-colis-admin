"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EditPayout({
  payout,
  open,
  onClose,
  onUpdated,
}: {
  payout: any;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [fees, setFees] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (payout) {
      setSeller(payout?.seller?._id || "");
      setAmount(payout?.amount || "");
      setFees(payout?.fees || "");
      setMethod(payout?.method || "");
      setNotes(payout?.notes || "");
    }
  }, [payout]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "https://cod-ecommerce-two.vercel.app/api/admin/sellers",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSellers(res.data?.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch sellers:", err);
      }
    };
    fetchSellers();
  }, []);

  const handleUpdatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `https://cod-ecommerce-two.vercel.app/api/admin/update-payout/${payout._id}`,
        { seller, amount, fees, method, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Payout updated successfully!");
      if (onUpdated) onUpdated();
      onClose(); // close after update
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "❌ Failed to update payout");
      } else {
        setMessage("❌ Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Payout</SheetTitle>
          <SheetDescription>
            Update the payout details and save changes.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleUpdatePayout}
          className="grid flex-1 auto-rows-min gap-6 px-4 overflow-scroll py-4"
        >
          <Select onValueChange={setSeller} value={seller}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Seller" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name} ({s.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <Select onValueChange={setMethod} value={method}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>

          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />

          {message && (
            <p
              className={`text-sm ${
                message.startsWith("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          <SheetFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
