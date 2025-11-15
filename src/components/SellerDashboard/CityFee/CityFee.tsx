"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type ApiResponse = {
  message?: string;
  city?: string;
  fee?: number;
};

type CityFee = {
  city: string;
  fee: number;
  [k: string]: any;
};

export function DeliveryFeeChecker() {
  const [city, setCity] = React.useState("");
  const [loadingCheck, setLoadingCheck] = React.useState(false);
  const [result, setResult] = React.useState<ApiResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // city-fees list
  const [cityFees, setCityFees] = React.useState<CityFee[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);

  // fetch the list of available city fees
  const fetchCityFees = React.useCallback(async () => {
    setListError(null);
    setLoadingList(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await axios.get<CityFee[]>(
        "https://cod-ecommerce-two.vercel.app/api/admin/city-fees",
        token ? { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 } : { timeout: 10000 }
      );
      // assume res.data is an array of { city, fee }
      setCityFees(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("Failed to fetch city fees:", err?.response?.data || err.message || err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load city fees";
      setListError(msg);
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    // fetch list on mount
    fetchCityFees();
  }, [fetchCityFees]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = city.trim();
    if (!trimmed) {
      setError("Please enter a city.");
      return;
    }

    setLoadingCheck(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No token found. Please login.");
        setLoadingCheck(false);
        return;
      }

      const res = await axios.post<ApiResponse>(
        "https://cod-ecommerce-two.vercel.app/api/seller/orders/calc-delivery-fee",
        { city: trimmed },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setResult(res.data || null);
      toast.success(res.data?.message || "Delivery fee fetched");
    } catch (err: any) {
      console.error("Failed to calculate delivery fee:", err?.response?.data || err.message || err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch delivery fee";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingCheck(false);
    }
  };

  // Filter displayed city list by typed input (case-insensitive)
  const displayedCityFees = React.useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return cityFees;
    return cityFees.filter((c) => c.city.toLowerCase().includes(q));
  }, [city, cityFees]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Check Delivery Fee</CardTitle>
        <CardDescription>Enter city name to calculate delivery fee for that city. Available city fees are listed below.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter city (or type to filter list below)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="City"
            />

            <Button type="submit" disabled={loadingCheck}>
              {loadingCheck ? (
                <span className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Checking...
                </span>
              ) : (
                "Check"
              )}
            </Button>

            <Button type="button" variant="ghost" onClick={fetchCityFees} disabled={loadingList}>
              {loadingList ? "Refreshing..." : "Refresh list"}
            </Button>
          </div>

          {/* Result / Error */}
          <div>
            {error && <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-rose-700">{error}</div>}

            {result && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-800">
                <div className="text-sm">
                  City: <strong>{result.city ?? city}</strong>
                </div>
                <div className="text-lg font-semibold mt-1">
                  Delivery fee: {typeof result.fee === "number" ? `₨ ${result.fee}` : "Not available"}
                </div>
                {result.message && <div className="text-sm opacity-80 mt-1">{result.message}</div>}
              </div>
            )}
          </div>

          {/* City fees list */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Available cities & fees</h3>
              <div className="text-xs text-muted-foreground">{loadingList ? "Loading…" : `${displayedCityFees.length} shown`}</div>
            </div>

            {listError && (
              <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-rose-700 mb-2">
                {listError}
              </div>
            )}

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-2 gap-0 bg-gray-50 px-4 py-2 text-xs font-medium">
                <div>City</div>
                <div className="text-right">Fee</div>
              </div>

              <div className="max-h-64 overflow-auto">
                {loadingList ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading city fees...</div>
                ) : displayedCityFees.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No cities found.</div>
                ) : (
                  displayedCityFees.map((c) => (
                    <div key={c.city} className="grid grid-cols-2 gap-0 px-4 py-2 border-t last:border-b">
                      <div className="truncate">{c.city}</div>
                      <div className="text-right font-semibold">{typeof c.fee === "number" ? `₨ ${c.fee}` : "-"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default DeliveryFeeChecker;
