"use client";

import * as React from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddStockDialogProps {
  sellerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockAdded?: () => void; // callback to refresh table
}

export function AddStockDialog({
  sellerId,
  open,
  onOpenChange,
  onStockAdded,
}: AddStockDialogProps) {
  const [form, setForm] = React.useState({
    sku: "",
    category: "",
    name: "",
    price: "",
    quantity: "",
  });
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `https://cod-ecommerce-two.vercel.app/api/admin/sellers/${sellerId}/add-stock`,
        {
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Stock added successfully!");
      setForm({ sku: "", category: "", name: "", price: "", quantity: "" }); // reset
      onOpenChange(false); // close dialog
      onStockAdded?.(); // refresh seller table
    } catch (err) {
      console.error("Error adding stock:", err);
      toast.error("Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="SKU"
            name="sku"
            value={form.sku}
            onChange={handleChange}
          />
          <Input
            placeholder="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
          />
          <Input
            placeholder="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            placeholder="Price"
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
          />
          <Input
            placeholder="Quantity"
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
