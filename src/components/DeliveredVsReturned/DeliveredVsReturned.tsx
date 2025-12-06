"use client"
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type Props = {
  apiUrlRatio?: string;
  apiUrlOrders?: string;
  token?: string; // either full 'Bearer ...' or raw token
};

type RatioApiData = {
  deliveredOrders: number;
  returnedOrders: number;
  ratio: string;
};

type OrderItem = Record<string, any>;

const RANGE_OPTIONS = [
  "all",
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
] as const;

type RangeKey = typeof RANGE_OPTIONS[number];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(date.setDate(diff));
}

function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6, 23, 59, 59, 999);
}

function getRangeDates(range: RangeKey) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (range) {
    case "today":
      return { from: todayStart, to: todayEnd };
    case "yesterday": {
      const y = new Date(todayStart);
      y.setDate(y.getDate() - 1);
      return { from: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0), to: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999) };
    }
    case "this_week":
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case "last_week": {
      const last = new Date(now);
      last.setDate(last.getDate() - 7);
      return { from: startOfWeek(last), to: endOfWeek(last) };
    }
    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0), to: todayEnd };
    case "last_month": {
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthDate = new Date(firstOfThisMonth);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return { from: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1, 0, 0, 0, 0), to: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0, 23, 59, 59, 999) };
    }
    case "all":
    default:
      return { from: undefined, to: undefined } as const;
  }
}

function formatIso(date?: Date | undefined) {
  return date ? date.toISOString() : undefined;
}

/** Convert a possible customer value to a safe display string.
 *  Handles string, object, null/undefined.
 */
function customerToDisplay(c: any): string {
  if (!c && c !== 0) return "Unknown";

  if (typeof c === "string") return c;
  if (typeof c === "number") return String(c);

  // object -> try common fields
  const name = c?.name ?? c?.fullName ?? c?.customerName ?? c?.firstName ?? c?.lastName;
  const phone = c?.phone ?? c?.mobile ?? c?.phoneNumber;
  const addr = c?.address ?? c?.addr ?? c?.shippingAddress;
  const city = c?.city ?? c?.cityName;
  const postal = c?.postalCode ?? c?.zipCode;

  // Prefer name if present
  if (name) {
    const extras = [phone, city].filter(Boolean).join(" • ");
    return extras ? `${String(name)} — ${extras}` : String(name);
  }

  // If no name, try phone or email
  if (phone) return String(phone);
  if (c?.email) return String(c.email);

  // Otherwise serialize to short JSON (avoid huge dumps)
  try {
    const keys = Object.keys(c).slice(0, 4);
    const shortObj: Record<string, any> = {};
    keys.forEach(k => (shortObj[k] = c[k]));
    return JSON.stringify(shortObj);
  } catch {
    return "Customer";
  }
}

export default function DeliveredVsReturnedSingle({
  apiUrlRatio = "https://cod-ecommerce-two.vercel.app/api/admin/getDeliveredVsReturnedRatio",
  apiUrlOrders = "https://cod-ecommerce-two.vercel.app/api/admin/orders",
  token,
}: Props) {
  // orderRange controls only the orders table
  const [orderRange, setOrderRange] = useState<RangeKey>("all");

  // ratio data (cards) shown for overall data. They do not change when user changes orderRange.
  const [ratioData, setRatioData] = useState<RatioApiData | null>(null);
  const [ratioLoading, setRatioLoading] = useState(false);
  const [ratioError, setRatioError] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderItem[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const authHeader = useMemo(() => {
    const stored = token ?? (typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("authToken"))) ?? null;
    if (!stored) return undefined;
    return stored.toString().startsWith("Bearer ") ? stored.toString() : `Bearer ${stored}`;
  }, [token]);

  // Fetch ratio once or when apiUrlRatio/authHeader change. This intentionally ignores orderRange
  useEffect(() => {
    let mounted = true;

    const fetchRatio = async () => {
      setRatioLoading(true);
      setRatioError(null);
      try {
        const res = await axios.get<{ message?: string; data?: RatioApiData }>(apiUrlRatio, {
          headers: authHeader ? { Authorization: authHeader } : undefined,
        });
        if (!mounted) return;
        setRatioData(res.data?.data ?? null);
      } catch (err: any) {
        if (!mounted) return;
        setRatioError(err?.response?.data?.message ?? err?.message ?? "Failed to fetch ratio");
      } finally {
        if (!mounted) return;
        setRatioLoading(false);
      }
    };

    fetchRatio();

    return () => {
      mounted = false;
    };
  }, [apiUrlRatio, authHeader]);

  // Fetch orders and respect orderRange. This only controls the orders table.
// Replace your fetchOrders useEffect with this
useEffect(() => {
  let mounted = true;

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const { from, to } = getRangeDates(orderRange);

      // Prepare both ISO and YYYY-MM-DD forms to maximize compatibility
      const isoFrom = from ? formatIso(from) : undefined;
      const isoTo = to ? formatIso(to) : undefined;
      const dateFrom = from ? isoFrom!.slice(0, 10) : undefined; // YYYY-MM-DD
      const dateTo = to ? isoTo!.slice(0, 10) : undefined;

      // send many param names so backend that expects another key still works
      const params: any = {};
      if (isoFrom) params.from = isoFrom;
      if (isoTo) params.to = isoTo;
      if (dateFrom) params.fromDate = dateFrom;
      if (dateTo) params.toDate = dateTo;
      if (dateFrom) params.start = dateFrom;
      if (dateTo) params.end = dateTo;
      // helpful: include a human-readable note for debugging (remove in prod)
      params._debug = "delivered-returned-filter";

      console.debug("Fetching orders with params:", params);

      const res = await axios.get<any>(apiUrlOrders, {
        headers: authHeader ? { Authorization: authHeader } : undefined,
        params,
        validateStatus: () => true,
      });

      console.debug("Orders API raw response:", res.status, res.data);

      // Normalize response to an array
      let arr: any[] = [];
      if (Array.isArray(res.data)) {
        arr = res.data;
      } else if (Array.isArray(res.data?.data)) {
        arr = res.data.data;
      } else if (Array.isArray(res.data?.orders)) {
        arr = res.data.orders;
      } else if (res.data && typeof res.data === "object") {
        // sometimes API returns { message, data: { orders: [...] } } or { data: { results: [...] } }
        const maybe =
          res.data.data?.orders ??
          res.data.data?.results ??
          res.data.data ??
          res.data.orders ??
          res.data.results ??
          null;
        if (Array.isArray(maybe)) arr = maybe;
        // some backends return an object keyed by id: { "abc": {...}, "def": {...} }
        else if (maybe && typeof maybe === "object") arr = Object.values(maybe);
      }

      // Filter to delivered/returned orders only on client-side (defensive)
      const filtered = arr.filter((o: any) => {
        if (!o) return false;
        const status = (o.status || o.orderStatus || o.state || "").toString().toLowerCase();
        if (status.includes("delivered") || status.includes("returned") || status.includes("return")) return true;
        if (o.isReturned === true || o.isDelivered === true) return true;
        if (o.returned === true || o.delivered === true) return true;
        return false;
      });

      if (!mounted) return;
      setOrders(filtered);
    } catch (err: any) {
      if (!mounted) return;
      console.error("fetchOrders error:", err);
      setOrdersError(err?.response?.data?.message ?? err?.message ?? "Failed to fetch orders");
      setOrders([]);
    } finally {
      if (!mounted) return;
      setOrdersLoading(false);
    }
  };

  fetchOrders();
  return () => {
    mounted = false;
  };
}, [orderRange, apiUrlOrders, authHeader]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Orders overview</h2>
        {/* Note: the filter below only controls the orders table. Cards always show overall ratio data. */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Delivered</CardTitle>
            <CardDescription>Number of delivered orders</CardDescription>
          </CardHeader>
          <CardContent>
            {ratioLoading ? (
              <div className="py-4 text-center">Loading...</div>
            ) : ratioError ? (
              <div className="text-sm text-red-600">{ratioError}</div>
            ) : (
              <div className="text-2xl font-semibold">{ratioData ? ratioData.deliveredOrders : "-"}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Returned</CardTitle>
            <CardDescription>Number of returned orders</CardDescription>
          </CardHeader>
          <CardContent>
            {ratioLoading ? (
              <div className="py-4 text-center">Loading...</div>
            ) : ratioError ? (
              <div className="text-sm text-red-600">{ratioError}</div>
            ) : (
              <div className="text-2xl font-semibold">{ratioData ? ratioData.returnedOrders : "-"}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ratio</CardTitle>
            <CardDescription>Delivered vs Returned</CardDescription>
          </CardHeader>
          <CardContent>
            {ratioLoading ? (
              <div className="py-4 text-center">Loading...</div>
            ) : ratioError ? (
              <div className="text-sm text-red-600">{ratioError}</div>
            ) : (
              <div className="text-2xl font-semibold">{ratioData ? `${ratioData.ratio}%` : "-"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Delivered & Returned Orders</CardTitle>
              <CardDescription>List of orders filtered by selected range</CardDescription>
            </div>

            {/* Filter now only controls the orders table */}
            {/* <div className="flex items-center gap-3">
              <label htmlFor="order-range" className="text-sm text-muted-foreground">
                Filter
              </label>
              <select
                id="order-range"
                value={orderRange}
                onChange={(e) => setOrderRange(e.target.value as RangeKey)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                {RANGE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div> */}
          </CardHeader>

          <CardContent>
            {ordersLoading ? (
              <div className="py-6 text-center">Loading orders...</div>
            ) : ordersError ? (
              <div className="text-sm text-red-600">{ordersError}</div>
            ) : !orders || orders.length === 0 ? (
              <div className="py-4 text-sm text-slate-600">No returned or delivered orders found for selected range.</div>
            ) : (
              <div className="divide-y">
                {orders.map((o, idx) => {
                  const id = o._id || o.id || o.orderId || idx;
                  const rawStatus = o.status || o.orderStatus || o.state || "";
                  const status = typeof rawStatus === "string" || typeof rawStatus === "number" ? String(rawStatus) : (o.isReturned ? "Returned" : o.isDelivered ? "Delivered" : "");
                  const date = o.createdAt || o.date || o.orderDate || "";
                  const customer = o.customer ?? o.user ?? o.username ?? o.email ?? null;
                  const customerDisplay = customerToDisplay(customer);
                  const totalVal = (typeof o.total === "number" && !isNaN(o.total)) ? o.total : (typeof o.grand_total === "number" ? o.grand_total : o.totalAmount ?? o.amount ?? null);
                  const total = totalVal != null ? String(totalVal) : "";

                  return (
                    <div key={String(id)} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {/* <div className="text-sm font-medium truncate">Order: {String(id)}</div> */}
                        <div className="text-xs text-muted-foreground truncate">{customerDisplay}</div>
                        <div className="text-xs text-muted-foreground">{date ? new Date(date).toLocaleString() : ""}</div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-semibold`}>{status || (o.isReturned ? "Returned" : o.isDelivered ? "Delivered" : "")}</div>
                        <div className="text-xs text-muted-foreground">{total ? `Total: ${total}` : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
