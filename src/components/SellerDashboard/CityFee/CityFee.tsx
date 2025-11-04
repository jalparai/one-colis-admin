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

export function DeliveryFeeChecker() {
  const [city, setCity] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ApiResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = city.trim();
    if (!trimmed) {
      setError("Please enter a city.");
      return;
    }

    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No token found. Please login.");
        setLoading(false);
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
      console.error(
        "Failed to calculate delivery fee:",
        err?.response?.data || err.message || err
      );
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Failed to fetch delivery fee";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Check Delivery Fee</CardTitle>
        <CardDescription>
          Enter city name to calculate delivery fee for that city.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="City"
            />

            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeOpacity="0.2"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  Checking...
                </span>
              ) : (
                "Check"
              )}
            </Button>
          </div>

          {/* Result / Error */}
          <div>
            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-rose-700">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-800">
                <div className="text-sm">
                  City: <strong>{result.city ?? city}</strong>
                </div>
                <div className="text-lg font-semibold mt-1">
                  Delivery fee:{" "}
                  {typeof result.fee === "number"
                    ? `₨ ${result.fee}`
                    : "Not available"}
                </div>
                {result.message && (
                  <div className="text-sm opacity-80 mt-1">
                    {result.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default DeliveryFeeChecker;
