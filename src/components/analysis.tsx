"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AddSeller } from "./Seller/Add-seller";
import { AddStockDialog } from "./Seller/AddStockDialog";
import { SellerSelectDropdown } from "./SellerSelectDropdown";

// ----------------- Interfaces -----------------
interface DeliveredData {
  deliveredOrders: number;
  returnedOrders: number;
}

interface AvgDelivery {
  orders: number;
  city: string;
  avgDeliveryHours: number;
}

interface TopSeller {
  sellerName: string;
  revenue: number;
  orders: number;
}

interface CityPerformance {
  city: string;
  delivered: number;
  returned: number;
}

interface CityFee {
  city: string;
  fee: number;
}

interface DashboardMetrics {
  delivered: DeliveredData;
  avgDeliveryTime: AvgDelivery[];
  topSellers: TopSeller[];
  cityPerformance: CityPerformance[];
  cityFees: CityFee[];
}

interface DashboardMetricCard {
  title: string;
  value: string;
  trend: "up" | "down";
  link: string;
}

export type Order = {
  id: string;
  seller: string;
  sellerEmail: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  itemsTotal: number;
  totalAmount: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
interface CollectedPendingData {
  totalOrders: number;
  collected: { count: number; percentage: string };
  pending: { count: number; percentage: string };
  ratio: { collectedToPending: string };
}
// ----------------- Component -----------------
export default function Analysis() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // date filter presets + custom range
  const [dateFilter, setDateFilter] = useState<
    | "all"
    | "today"
    | "yesterday"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "lastMonth"
    | "custom"
  >("all");
  const [customStart, setCustomStart] = useState<string | null>(null); // YYYY-MM-DD
  const [customEnd, setCustomEnd] = useState<string | null>(null); // YYYY-MM-DD

  const [openAddSeller, setOpenAddSeller] = useState(false);
  const [openAddStock, setOpenAddStock] = useState(false);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [sellerInput, setSellerInput] = useState<string>(
    () => sellers.find((s) => s.id === selectedSeller)?.name ?? ""
  );
  useEffect(() => {
    setSellerInput(sellers.find((s) => s.id === selectedSeller)?.name ?? "");
  }, [sellers, selectedSeller]);

  function resolveSellerIdFromName(name: string) {
    const cleaned = name.trim().toLowerCase();
    if (!cleaned) return null;

    // 1) exact match
    const exact = sellers.find((s) => s.name.toLowerCase() === cleaned);
    if (exact) return exact.id;

    // 2) startsWith match
    const starts = sellers.find((s) => s.name.toLowerCase().startsWith(cleaned));
    if (starts) return starts.id;

    // 3) contains match (fallback)
    const contains = sellers.find((s) => s.name.toLowerCase().includes(cleaned));
    if (contains) return contains.id;

    return null;
  }

  const params = useParams();
  const router = useRouter();
  const locale = (params as any)?.locale ?? "en";
  const { t } = useTranslation("common");
  // add near other useState(...) lines inside the Analysis component
  const [collectedPending, setCollectedPending] = useState<CollectedPendingData | null>(null);
  const [ordersView, setOrdersView] = useState<"all" | "pending">("all");

  // ---------- Date helpers ----------
  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // computeRange returns { start, end } strings for presets (YYYY-MM-DD)
  const computeRange = (
    filter:
      | "all"
      | "today"
      | "yesterday"
      | "thisWeek"
      | "lastWeek"
      | "thisMonth"
      | "lastMonth"
  ) => {
    const now = new Date();
    const today = formatDate(now);

    switch (filter) {
      case "today":
        return { start: today, end: today };
      case "yesterday": {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        return { start: formatDate(y), end: formatDate(y) };
      }
      case "thisWeek": {
        // Monday as week start
        const dayIndex = (now.getDay() + 6) % 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayIndex);
        return { start: formatDate(monday), end: today };
      }
      case "lastWeek": {
        const dayIndex = (now.getDay() + 6) % 7;
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - dayIndex - 1); // previous Sunday
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        return { start: formatDate(lastWeekStart), end: formatDate(lastWeekEnd) };
      }
      case "thisMonth": {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: formatDate(startMonth), end: today };
      }
      case "lastMonth": {
        const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLast = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: formatDate(startLast), end: formatDate(endLast) };
      }
      default:
        return {};
    }
  };

  // Build params helper - accepts dateFilter and optional customStart/customEnd
  const buildParams = (filterArg?: typeof dateFilter, customS?: string | null, customE?: string | null) => {
    const params: Record<string, string> = {};
    if (!filterArg || filterArg === "all") {
      params.range = "all";
      return params;
    }

    if (filterArg === "custom") {
      // use provided custom dates if any
      if (customS) {
        params.startDate = customS;
        params.start = customS;
        params.from = customS;
      }
      if (customE) {
        params.endDate = customE;
        params.end = customE;
        params.to = customE;
      }
      params.range = "custom";
      return params;
    }

    const range = computeRange(filterArg);
    if (range.start) {
      params.startDate = range.start;
      params.start = range.start;
      params.from = range.start;
    }
    if (range.end) {
      params.endDate = range.end;
      params.end = range.end;
      params.to = range.end;
    }
    params.range = filterArg;
    return params;
  };

  const appendParamsToUrl = (url: string, paramsObj: Record<string, string>) => {
    const p = new URLSearchParams(paramsObj);
    const qs = p.toString();
    return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
  };

  // ----------------- Table Definition -----------------
  const orderColumns: ColumnDef<Order>[] = [
    {
      header: t("table.seller"),
      accessorKey: "seller",
      cell: ({ row }) => <div className="font-medium">{row.original.seller}</div>,
    },
    {
      header: t("table.email"),
      accessorKey: "sellerEmail",
      cell: ({ row }) => <div className="text-gray-600">{row.original.sellerEmail}</div>,
    },
    {
      header: t("table.totalAmount"),
      accessorKey: "totalAmount",
      cell: ({ row }) => <div> DH {row.original.totalAmount?.toLocaleString?.()}</div>,
    },
    {
      header: t("table.status"),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const color =
          status === "Delivered"
            ? "bg-green-100 text-green-800"
            : status === "Returned"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-700";
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
            {status}
          </span>
        );
      },
    },
    {
      header: t("table.created"),
      accessorKey: "createdAt",
      cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>,
    },
  ];

  // ----------------- Fetch Data (respects dateFilter and customStart/customEnd) -----------------
  // now refetches when date filter / custom range / selected seller changes so charts update
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Build shared params for date range & seller
        const params = buildParams(dateFilter, customStart, customEnd);
        if (selectedSeller) params.sellerId = selectedSeller;

        // endpoints
        const base = "https://cod-ecommerce-two.vercel.app/api/admin";
        const deliveredUrl = appendParamsToUrl(`${base}/getDeliveredVsReturnedRatio`, params);
        const avgDeliveryUrl = appendParamsToUrl(`${base}/getAverageDeliveryTime`, params);
        const topSellersUrl = appendParamsToUrl(`${base}/getTopSellers`, params);
        const cityPerfUrl = appendParamsToUrl(`${base}/city-performance`, params);
        const cityFeesUrl = appendParamsToUrl(`${base}/city-fees`, params);
        // orders: limit recent orders to 50, sort desc
        const ordersParams = { ...params, limit: "50", sort: "desc" as string };
        const ordersUrl = appendParamsToUrl(`${base}/orders`, ordersParams);

        // request all in parallel
        const [
          deliveredRes,
          avgDeliveryRes,
          topSellersRes,
          cityPerformanceRes,
          cityFeesRes,
          ordersRes,
        ] = await Promise.all([
          fetch(deliveredUrl, { headers }),
          fetch(avgDeliveryUrl, { headers }),
          fetch(topSellersUrl, { headers }),
          fetch(cityPerfUrl, { headers }),
          fetch(cityFeesUrl, { headers }),
          fetch(ordersUrl, { headers }),
        ]);

        // parse safely and gracefully
        const [
          deliveredJson,
          avgDeliveryJson,
          topSellersJson,
          cityPerfJson,
          cityFeesJson,
          ordersJson,
        ] = await Promise.all([
          deliveredRes.ok ? deliveredRes.json().catch(() => ({})) : Promise.resolve({}),
          avgDeliveryRes.ok ? avgDeliveryRes.json().catch(() => ({})) : Promise.resolve({}),
          topSellersRes.ok ? topSellersRes.json().catch(() => ({})) : Promise.resolve({}),
          cityPerformanceRes.ok ? cityPerformanceRes.json().catch(() => ({})) : Promise.resolve({}),
          cityFeesRes.ok ? cityFeesRes.json().catch(() => ({})) : Promise.resolve({}),
          ordersRes.ok ? ordersRes.json().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        if (!mounted) return;

        // Normalize shapes (try common locations)
        const deliveredData = deliveredJson?.data ?? deliveredJson ?? { deliveredOrders: 0, returnedOrders: 0 };
        const avgDeliveryData = Array.isArray(avgDeliveryJson?.data) ? avgDeliveryJson.data : Array.isArray(avgDeliveryJson) ? avgDeliveryJson : avgDeliveryJson?.result ?? [];
        const topSellersData = Array.isArray(topSellersJson?.data) ? topSellersJson.data : Array.isArray(topSellersJson) ? topSellersJson : topSellersJson?.result ?? [];
        const cityPerfData = Array.isArray(cityPerfJson?.analytics) ? cityPerfJson.analytics : Array.isArray(cityPerfJson?.data) ? cityPerfJson.data : Array.isArray(cityPerfJson) ? cityPerfJson : [];
        const cityFeesData = Array.isArray(cityFeesJson?.data) ? cityFeesJson.data : Array.isArray(cityFeesJson) ? cityFeesJson : [];

        const ordersData = ordersJson?.data ?? ordersJson ?? [];

        setMetrics({
          delivered: deliveredData,
          avgDeliveryTime: avgDeliveryData,
          topSellers: topSellersData,
          cityPerformance: cityPerfData,
          cityFees: cityFeesData,
        });

        // orders - server-limited to recent (limit param). We'll still allow client-side filter as fallback.
        setOrders(Array.isArray(ordersData) ? ordersData : []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [dateFilter, customStart, customEnd, selectedSeller]); // re-run when filter or seller changes

  // fetch sellers once (no date param)
  useEffect(() => {
    async function fetchSellers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("https://cod-ecommerce-two.vercel.app/api/admin/sellers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        const normalized = (data?.data || []).map((s: any) => ({
          id: s._id ?? s.id ?? s._uid ?? "",
          name: s.name ?? s.fullName ?? s.sellerName ?? "Unnamed Seller",
        }));

        setSellers(normalized);
      } catch (err) {
        console.error("Error fetching sellers:", err);
      }
    }
    fetchSellers();
  }, []);

  // collected/pending should also respect date filter (refetch when dateFilter changes)
  useEffect(() => {
    const fetchCollectedPending = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const params = buildParams(dateFilter, customStart, customEnd);
        const url = appendParamsToUrl(
          "https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending",
          params
        );
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setCollectedPending(json?.data ?? null);
      } catch (err) {
        console.error("Collected vs Pending fetch failed:", err);
      }
    };

    fetchCollectedPending();
  }, [dateFilter, customStart, customEnd]);

  // ----------------- Date Filter Logic (client-side helpers retained) -----------------
  const now = useMemo(() => new Date(), [dateFilter, customStart, customEnd]); // updates when filter/custom range changes

  const sameWeek = (d1: Date, d2: Date) => {
    const startOfWeek = (d: Date) => {
      const copy = new Date(d);
      const day = copy.getDay(); // 0 (Sun) - 6
      copy.setDate(copy.getDate() - day); // start of week (Sunday)
      copy.setHours(0, 0, 0, 0);
      return copy;
    };
    const w1 = startOfWeek(d1).toDateString();
    const w2 = startOfWeek(d2).toDateString();
    return w1 === w2 && d1.getFullYear() === d2.getFullYear();
  };

  // filteredOrders computed from orders + dateFilter (client-side fallback)
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const nowLocal = new Date();
    return orders.filter((order) => {
      const created = new Date(order.createdAt);

      // If using custom range, apply it client-side as well
      if (dateFilter === "custom") {
        const from = customStart ? new Date(customStart + "T00:00:00") : null;
        const to = customEnd ? new Date(customEnd + "T23:59:59") : null;
        if (from && created < from) return false;
        if (to && created > to) return false;
        return true;
      }

      const diffDays = Math.floor((nowLocal.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case "today":
          return created.toDateString() === nowLocal.toDateString();
        case "yesterday":
          return diffDays === 1;
        case "thisWeek":
          return sameWeek(created, nowLocal);
        case "lastWeek": {
          const lastWeek = new Date(nowLocal);
          lastWeek.setDate(nowLocal.getDate() - 7);
          return sameWeek(created, lastWeek);
        }
        case "thisMonth":
          return (
            created.getMonth() === nowLocal.getMonth() &&
            created.getFullYear() === nowLocal.getFullYear()
          );
        case "lastMonth": {
          const prevMonth = new Date(nowLocal);
          prevMonth.setMonth(nowLocal.getMonth() - 1);
          return (
            created.getMonth() === prevMonth.getMonth() &&
            created.getFullYear() === prevMonth.getFullYear()
          );
        }
        default:
          return true;
      }
    });
  }, [orders, dateFilter, customStart, customEnd]);

  // filteredPendingOrders derived from filteredOrders
  const filteredPendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => {
      const status = (o.status ?? "").toString().toLowerCase();
      return status.includes("pend") || status.includes("collection");
    });
  }, [filteredOrders]);

  // ----------------- Calculations (use filteredOrders where meaningful) -----------------
  const totalSellerRevenueAllTime = metrics?.topSellers.reduce((sum, s) => sum + s.revenue, 0) ?? 0;
  const totalServiceRevenueAllTime = metrics?.cityPerformance.reduce((sum, c) => {
    const feeObj = metrics?.cityFees.find((f) => f.city === c.city);
    const deliveryFee = feeObj ? feeObj.fee : 0;
    return sum + deliveryFee * c.delivered;
  }, 0) ?? 0;

  const netProfitAllTime = totalSellerRevenueAllTime - totalServiceRevenueAllTime;
  const totalOrdersFromMetrics = (metrics?.delivered?.deliveredOrders || 0) + (metrics?.delivered?.returnedOrders || 0);

  const returnRateAllTime =
    totalOrdersFromMetrics > 0
      ? ((metrics!.delivered.returnedOrders / totalOrdersFromMetrics) * 100).toFixed(1)
      : "0";

  const deliveryRateAllTime =
    totalOrdersFromMetrics > 0
      ? ((metrics!.delivered.deliveredOrders / totalOrdersFromMetrics) * 100).toFixed(1)
      : "0";

  const avgDeliveryHoursAllTime =
    metrics && metrics.avgDeliveryTime.length > 0
      ? Math.round(metrics.avgDeliveryTime.reduce((a, b) => a + b.avgDeliveryHours, 0) / metrics.avgDeliveryTime.length)
      : 0;

  // use filteredOrders counts for Order cards
  const allOrdersCount = filteredOrders.length;
  const pendingCount = filteredPendingOrders.length;
  const pendingRate = allOrdersCount > 0 ? (pendingCount / allOrdersCount) * 100 : 0;

  // compute seller revenue from filtered orders
  const sellerRevenueFiltered = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  // estimate service revenue for filtered range by scaling the fetched total service revenue
  const serviceRevenueFiltered = useMemo(() => {
    const totalOrdersCountAll = orders.length;
    if (totalOrdersCountAll > 0) {
      const totalService = totalServiceRevenueAllTime ?? 0;
      return (filteredOrders.length / totalOrdersCountAll) * totalService;
    }
    if (totalOrdersFromMetrics > 0) {
      return (filteredOrders.length / totalOrdersFromMetrics) * totalServiceRevenueAllTime;
    }
    return totalServiceRevenueAllTime;
  }, [filteredOrders, orders.length, totalServiceRevenueAllTime, totalOrdersFromMetrics]);

  const netProfitFiltered = sellerRevenueFiltered - serviceRevenueFiltered;

  // compute return/delivery rates from filteredOrders when possible
  const { returnRateFiltered, deliveryRateFiltered } = useMemo(() => {
    if (filteredOrders.length === 0) {
      return { returnRateFiltered: returnRateAllTime, deliveryRateFiltered: deliveryRateAllTime };
    }

    const returned = filteredOrders.filter((o) => /return/i.test(o.status)).length;
    const delivered = filteredOrders.filter((o) => /deliv/i.test(o.status)).length;

    const rr = ((returned / filteredOrders.length) * 100).toFixed(1);
    const dr = ((delivered / filteredOrders.length) * 100).toFixed(1);
    return { returnRateFiltered: rr, deliveryRateFiltered: dr };
  }, [filteredOrders, returnRateAllTime, deliveryRateAllTime]);

  const avgDeliveryHours = avgDeliveryHoursAllTime;

  // lightweight ref to hold stats.totalRevenue fetched in the other effect (we'll keep same logic for fetching stats below)
  const [statsState, setStatsState] = useState({ totalRevenue: 0, loading: true });

  useEffect(() => {
    let mounted = true;

    async function fetchRevenue() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          if (mounted) setStatsState({ totalRevenue: totalServiceRevenueAllTime ?? 0, loading: false });
          return;
        }

        // Append date params so service revenue query can be scoped if server supports it
        const params = buildParams(dateFilter, customStart, customEnd);
        const url = appendParamsToUrl(`/api/admin/service-revenue?group=total`, params);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const text = await res.text();
        let data = null;
        try {
          if (res.headers.get("content-type")?.includes("application/json")) {
            data = JSON.parse(text);
          } else {
            // keep a concise console warning but don't break parsing
            console.warn("service-revenue returned non-JSON (status:", res.status, ")");
          }
        } catch (e) {
          console.error("JSON parse failed for service-revenue:", e, text);
        }

        if (!res.ok) {
          if (mounted) setStatsState({ totalRevenue: totalServiceRevenueAllTime ?? 0, loading: false });
          return;
        }

        const apiRevenue = typeof data?.totalRevenue === "number" ? data.totalRevenue : null;
        if (mounted) {
          setStatsState({ totalRevenue: apiRevenue ?? totalServiceRevenueAllTime ?? 0, loading: false });
        }
      } catch (err) {
        console.error("Failed to fetch service revenue (client):", err);
        if (mounted) setStatsState({ totalRevenue: totalServiceRevenueAllTime ?? 0, loading: false });
      }
    }

    fetchRevenue();
    return () => {
      mounted = false;
    };
  }, [dateFilter, customStart, customEnd, totalServiceRevenueAllTime]);

  // ----------------- Dashboard cards now use filtered calculations -----------------
  const formatDH = (amount: number) =>
    `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} DH`;

  const dashboardMetrics: DashboardMetricCard[] = [
    {
      title: t("metrics.allOrders"),
      value: `${allOrdersCount}`,
      trend: "up",
      link: `/${locale}/admin/Order`,
    },
    {
      title: t("metrics.pendingOrders"),
      value: `${pendingCount} (${pendingRate.toFixed(1)}%)`,
      trend: pendingRate < 20 ? "up" : "down",
      link: `/${locale}/admin/Collection-pending`,
    },
    {
      title: t("metrics.totalSellerRevenue"),
      value: formatDH(sellerRevenueFiltered),
      trend: "up",
      link: `/${locale}/admin/Top-Sellers`,
    },
    {
      title: t("metrics.netProfitSeller"),
      value: formatDH(netProfitFiltered),
      trend: netProfitFiltered > 0 ? "up" : "down",
      link: `/${locale}/admin/Seller`,
    },
    {
      title: t("metrics.averageDeliveryTime"),
      value: `${avgDeliveryHours}h`,
      trend: avgDeliveryHours < 48 ? "up" : "down",
      link: `/${locale}/admin/Delivery-Returned`,
    },
    {
      title: t("metrics.returnRate"),
      value: `${returnRateFiltered}%`,
      trend: parseFloat(returnRateFiltered) < 20 ? "up" : "down",
      link: `/${locale}/admin/Order`,
    },
    {
      title: t("metrics.deliveryRate"),
      value: `${deliveryRateFiltered}%`,
      trend: parseFloat(deliveryRateFiltered) > 70 ? "up" : "down",
      link: `/${locale}/admin/Order`,
    },
    {
      title: t("metrics.totalServiceRevenue"),
      value: formatDH(serviceRevenueFiltered),
      trend: "up",
      link: `/${locale}/admin/Order`,
    },
  ];

  const isPositive = (tmetric: "up" | "down") => tmetric === "up";

  const topSellersChartData = metrics?.topSellers
    .slice(0, 5)
    .map((seller) => ({
      name:
        seller.sellerName.length > 15
          ? seller.sellerName.substring(0, 15) + "..."
          : seller.sellerName,
      revenue: seller.revenue,
    })) ?? [];

  const deliveryReturnChartData = metrics?.cityPerformance.map((city) => ({
    city: city.city,
    Delivered: city.delivered,
    Returned: city.returned,
  })) ?? [];

  // ----------------- Table (use filteredOrders) -----------------
  const table = useReactTable({
    data: filteredOrders,
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ----------------- RECENT ORDERS HOOKS (MUST BE DECLARED BEFORE ANY EARLY RETURN) -----------------
  const RECENT_COUNT = 10; // change to 3, 5, etc.
  const recentOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    // ensure newest first — if your server already returns newest-first you can remove the sort
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, RECENT_COUNT);
  }, [orders]);

  const recentTable = useReactTable({
    data: recentOrders,
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ----------------- UI -----------------
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {t("ui.loadingDashboard")}
      </div>
    );

  if (error || !metrics)
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <p>{error || t("ui.failedToLoadMetrics")}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white lg:px-5 p-0">
      <div className="">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {t("quickActions.title")}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              title: t("quickActions.actions.addSeller"),
              icon: IconTrendingUp,
              color: "text-blue-600",
              bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
              actionType: "dialog",
            },
            {
              title: t("quickActions.actions.addStock"),
              icon: IconTrendingUp,
              color: "text-green-600",
              bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
              actionType: "dialog",
            },
            {
              title: t("quickActions.actions.manageOrders"),
              icon: IconTrendingDown,
              color: "text-amber-600",
              bg: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10",
              link: `/${locale}/admin/Order`,
            },
            {
              title: t("quickActions.actions.reportsAnalytics"),
              icon: IconTrendingDown,
              color: "text-purple-600",
              bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10",
              link: `/${locale}/admin/Collection-pending`,
            },
            {
              title: t("quickActions.actions.returnedDelivered"),
              icon: IconTrendingUp,
              color: "text-red-600",
              bg: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10",
              link: `/${locale}/admin/Delivered-Returned`,
            },
          ].map((action, i) => (
            <Card
              key={i}
              className={`group border border-gray-200/40 dark:border-gray-800/40 bg-gradient-to-br ${action.bg} rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer`}
              onClick={() => {
                if (action.title === "Add Stock") setOpenAddStock(true);
                else if (action.actionType === "dialog") setOpenAddSeller(true);
                else if (action.link) router.push(action.link);
              }}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {action.actionType === "dialog" ? t("quickActions.openDialog") : t("quickActions.clickToManage")}
                  </p>
                </div>
                <action.icon
                  className={`h-7 w-7 ${action.color} group-hover:scale-110 transition-transform`}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {openAddSeller && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white flex items-center justify-center dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setOpenAddSeller(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold"
              >
                &times;
              </button>

              <AddSeller
                onSellerAdded={() => {
                  setOpenAddSeller(false);
                  toast.success(t("quickActions.sellerAdded"));
                }}
                onCancel={() => setOpenAddSeller(false)}
              />
            </div>
          </div>
        )}

        {openAddStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 relative">
              <button
                onClick={() => setOpenAddStock(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold"
              >
                &times;
              </button>

              <SellerSelectDropdown
                sellers={sellers}
                selectedSellerId={selectedSeller}
                onSellerChange={setSelectedSeller}
                placeholder={t("ui.selectSeller")}
              />

              {selectedSeller && (
                <AddStockDialog
                  sellerId={selectedSeller}
                  open={openAddStock}
                  onOpenChange={(open) => {
                    if (!open) {
                      setOpenAddStock(false);
                      setSelectedSeller(null);
                    }
                  }}
                  onStockAdded={() => {
                    setOpenAddStock(false);
                    setSelectedSeller(null);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 space-y-8">
        {/* Date filter controls */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t("filter.title")}</h3>

          <div className="flex items-center gap-2">
            <Select
              value={dateFilter}
              onValueChange={(v) =>
                setDateFilter(
                  v as
                    | "all"
                    | "today"
                    | "yesterday"
                    | "thisWeek"
                    | "lastWeek"
                    | "thisMonth"
                    | "lastMonth"
                    | "custom"
                )
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("filter.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                <SelectItem value="today">{t("filter.today")}</SelectItem>
                <SelectItem value="yesterday">{t("filter.yesterday")}</SelectItem>
                <SelectItem value="thisWeek">{t("filter.thisWeek")}</SelectItem>
                <SelectItem value="lastWeek">{t("filter.lastWeek")}</SelectItem>
                <SelectItem value="thisMonth">{t("filter.thisMonth")}</SelectItem>
                <SelectItem value="lastMonth">{t("filter.lastMonth")}</SelectItem>
                <SelectItem value="custom">{t("filter.custom") ?? "Custom Range"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom range inputs (shown when dateFilter === 'custom') */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={customStart ?? ""}
                  onChange={(e) => setCustomStart(e.target.value || null)}
                  className="px-2 py-1 rounded-md border bg-white"
                />
                <span className="text-sm">—</span>
                <input
                  type="date"
                  value={customEnd ?? ""}
                  onChange={(e) => setCustomEnd(e.target.value || null)}
                  className="px-2 py-1 rounded-md border bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // apply custom range by triggering useEffect (customStart/customEnd are deps)
                    // ensure basic validation
                    if (!customStart && !customEnd) {
                      toast.error("Select start and/or end date.");
                      return;
                    }
                    if (customStart && customEnd && new Date(customStart) > new Date(customEnd)) {
                      toast.error("Start date cannot be after end date.");
                      return;
                    }
                    // set dateFilter to 'custom' (already is) and effect will fetch
                    setDateFilter("custom");
                    toast.success("Applied custom date range");
                  }}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCustomStart(null);
                    setCustomEnd(null);
                    setDateFilter("all");
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
          {dashboardMetrics.map((metric, i) => {
            const TrendIcon = isPositive(metric.trend) ? IconTrendingUp : IconTrendingDown;
            return (
              <Card
                key={i}
                className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-md border border-gray-200/50 dark:border-gray-800/50"
                data-slot="card"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div>
                    <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {metric.title}
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold mt-1 text-gray-900 dark:text-gray-100">
                      {metric.value}
                    </CardTitle>
                  </div>

                  <div
                    className={`rounded-full p-2 ${isPositive(metric.trend) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                  >
                    <TrendIcon className="h-5 w-5" />
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-primary/80 text-sm font-medium cursor-pointer"
                    onClick={() => router.push(metric.link)}
                  >
                    {t("ui.viewDetails")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-5 grid-cols-1">
          {/* Top Sellers Chart */}
          {topSellersChartData.length > 0 && (
            <Card className="shadow-sm border rounded-2xl">
              <CardHeader>
                <CardTitle style={{ color: "#2BC3F1" }}>{t("charts.topSellersTitle")}</CardTitle>
                <CardDescription style={{ color: "#E0B660" }}>{t("charts.topSellersDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSellersChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#2BC3F1" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#E0B660" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="#2BC3F1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Delivery vs Return Chart */}
          {deliveryReturnChartData.length > 0 && (
            <Card className="shadow-sm border rounded-2xl">
              <CardHeader>
                <CardTitle style={{ color: "#E0B660" }}>{t("charts.deliveryReturnTitle")}</CardTitle>
                <CardDescription style={{ color: "#2BC3F1" }}>{t("charts.deliveryReturnDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deliveryReturnChartData}>
                      <XAxis dataKey="city" tick={{ fontSize: 12, fill: "#E0B660" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#E0B660" }} />
                      <Legend />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="Delivered" fill="#E0B660" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Returned" fill="#E0B660" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Orders */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
            Recent Orders
          </h3>

          {recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                {recentTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {recentTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-gray-500 py-10">
              No recent orders for the selected range.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
