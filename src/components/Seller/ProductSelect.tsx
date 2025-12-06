// ProductSelect.tsx (fixed: no empty SelectItem values, ensure productId non-empty)
"use client";
import React from "react";
import axios from "axios";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export type StockItem = {
  productId: string; // always non-empty
  name: string;
  available?: number; // may be undefined
  price?: number;
};

type Props = {
  value?: string | null;
  onChange: (productId: string | null) => void;
  placeholder?: string;
  includeOutOfStock?: boolean;
};

export const ProductSelect: React.FC<Props> = ({ value, onChange, placeholder = "Select product", includeOutOfStock = false }) => {
  const [items, setItems] = React.useState<StockItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchStock = async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/seller/stock", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const raw = res.data?.data ?? res.data ?? [];
        const mapped = (Array.isArray(raw) ? raw : []).map((p: any, i: number) => {
          const productId = String(p._id ?? p.id ?? p.productId ?? `fallback-${i}`);
          const name = p.name ?? p.productName ?? p.title ?? p.product?.name ?? "Unnamed product";
          const available = p.quantity !== undefined ? Number(p.quantity) : (p.stock !== undefined ? Number(p.stock) : undefined);
          const price = p.price !== undefined ? Number(p.price) : (p.unitPrice !== undefined ? Number(p.unitPrice) : undefined);
          return { productId, name, available, price } as StockItem;
        });

        if (!mounted) return;
        setItems(mapped.filter(it => includeOutOfStock ? true : (it.available ?? 0) > 0));
        setError(null);
      } catch (err: any) {
        console.error("ProductSelect.fetchStock error:", err);
        if (!mounted) return;
        setError(err?.response?.data?.message ?? err.message ?? "Failed to load stock");
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStock();
    return () => { mounted = false; };
  }, [includeOutOfStock]);

  // map sentinel or empty back to null
  const handleValueChange = (v: string) => {
    if (!v || v.startsWith("__")) onChange(null);
    else onChange(v);
  };

  return (
    <div>
      <Select value={value ?? ""} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading products..." : error ? "Error loading" : placeholder} />
        </SelectTrigger>

        <SelectContent>
          {loading && (
            <SelectItem value="__loading" disabled>
              Loading...
            </SelectItem>
          )}

          {!loading && error && (
            <SelectItem value="__error" disabled>
              {String(error)}
            </SelectItem>
          )}

          {!loading && !error && items.length === 0 && (
            <SelectItem value="__none" disabled>
              No products in stock
            </SelectItem>
          )}

          {!loading && !error && items.map(it => (
            <SelectItem key={it.productId} value={it.productId}>
              {it.name}{typeof it.available === "number" ? ` — ${it.available} in stock` : ""}{it.price ? ` — ${it.price} DH` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
