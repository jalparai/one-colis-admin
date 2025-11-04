"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const [dateFilter, setDateFilter] = useState<
    | "all"
    | "today"
    | "yesterday"
    | "thisWeek"
    | "lastWeek"
    | "thisMonth"
    | "lastMonth"
  >("all");
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
  const locale = params.locale as string;
  // add near other useState(...) lines inside the Analysis component
  const [collectedPending, setCollectedPending] = useState<
    CollectedPendingData | null
  >(null);
  const [ordersView, setOrdersView] = useState<"all" | "pending">("all");

  // ----------------- Table Definition -----------------
  const orderColumns: ColumnDef<Order>[] = [
    {
      header: "Seller",
      accessorKey: "seller",
      cell: ({ row }) => <div className="font-medium">{row.original.seller}</div>,
    },
    {
      header: "Email",
      accessorKey: "sellerEmail",
      cell: ({ row }) => (
        <div className="text-gray-600">{row.original.sellerEmail}</div>
      ),
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => <div> DH {row.original.totalAmount.toLocaleString()}</div>,
    },
    {
      header: "Status",
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
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>,
    },
  ];

  // ----------------- Fetch Data -----------------
  useEffect(() => {
    async function fetchData() {
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

        const [
          deliveredRes,
          avgDeliveryRes,
          topSellersRes,
          cityPerformanceRes,
          cityFeesRes,
          ordersRes,
        ] = await Promise.all([
          fetch(
            "https://cod-ecommerce-two.vercel.app/api/admin/getDeliveredVsReturnedRatio",
            { headers }
          ),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getAverageDeliveryTime", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/getTopSellers", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/city-performance", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/city-fees", { headers }),
          fetch("https://cod-ecommerce-two.vercel.app/api/admin/orders", { headers }),
        ]);

        const [
          deliveredData,
          avgDeliveryData,
          topSellersData,
          cityPerformanceData,
          cityFeesData,
          ordersData,
        ] = await Promise.all([
          deliveredRes.json(),
          avgDeliveryRes.json(),
          topSellersRes.json(),
          cityPerformanceRes.json(),
          cityFeesRes.json(),
          ordersRes.json(),
        ]);

        setMetrics({
          delivered: deliveredData?.data ?? { deliveredOrders: 0, returnedOrders: 0 },
          avgDeliveryTime: avgDeliveryData?.data ?? [],
          topSellers: topSellersData?.data ?? [],
          cityPerformance: cityPerformanceData?.analytics ?? [],
          cityFees: cityFeesData?.data ?? [],
        });

        setOrders(ordersData?.data ?? []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchSellers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("https://cod-ecommerce-two.vercel.app/api/admin/sellers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Normalize: prefer _id, fallback to id (depends on your API)
        const normalized = (data?.data || []).map((s: any) => ({
          id: s._id ?? s.id ?? s._uid ?? "",
          name: s.name ?? s.fullName ?? s.sellerName ?? "Unnamed Seller",
        }));

        setSellers(normalized);

        // OPTIONAL: preselect first seller when opening quick action later
        // setSelectedSeller(normalized[0]?.id ?? null);
      } catch (err) {
        console.error("Error fetching sellers:", err);
      }
    }
    fetchSellers();
  }, []);

  useEffect(() => {
    const fetchCollectedPending = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(
          "https://cod-ecommerce-two.vercel.app/api/admin/getCollectedvsPending",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        setCollectedPending(json?.data ?? null);
      } catch (err) {
        console.error("Collected vs Pending fetch failed:", err);
      }
    };

    fetchCollectedPending();
  }, []);

  // ----------------- Date Filter Logic -----------------
  const now = useMemo(() => new Date(), [dateFilter]); // updates when filter changes to re-evaluate relative ranges

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

  // filteredOrders computed from orders + dateFilter
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const nowLocal = new Date();
    return orders.filter((order) => {
      const created = new Date(order.createdAt);
      const diffDays = Math.floor(
        (nowLocal.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );

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
  }, [orders, dateFilter]);

  // pendingOrders derived from filteredOrders
  const filteredPendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => {
      const status = (o.status ?? "").toString().toLowerCase();
      return status.includes("pend") || status.includes("collection");
    });
  }, [filteredOrders]);

  // ----------------- Calculations (use filteredOrders where meaningful) -----------------
  const totalSellerRevenue = metrics?.topSellers.reduce((sum, s) => sum + s.revenue, 0) ?? 0;
  const totalServiceRevenue = metrics?.cityPerformance.reduce((sum, c) => {
    const feeObj = metrics?.cityFees.find((f) => f.city === c.city);
    const deliveryFee = feeObj ? feeObj.fee : 0;
    return sum + deliveryFee * c.delivered;
  }, 0) ?? 0;

  const netProfit = totalSellerRevenue - totalServiceRevenue;
  const totalOrdersFromMetrics =
    (metrics?.delivered?.deliveredOrders || 0) +
    (metrics?.delivered?.returnedOrders || 0);

  const returnRate =
    totalOrdersFromMetrics > 0
      ? ((metrics!.delivered.returnedOrders / totalOrdersFromMetrics) * 100).toFixed(1)
      : "0";

  const deliveryRate =
    totalOrdersFromMetrics > 0
      ? ((metrics!.delivered.deliveredOrders / totalOrdersFromMetrics) * 100).toFixed(1)
      : "0";

  const avgDeliveryHours =
    metrics && metrics.avgDeliveryTime.length > 0
      ? Math.round(
        metrics.avgDeliveryTime.reduce((a, b) => a + b.avgDeliveryHours, 0) /
        metrics.avgDeliveryTime.length
      )
      : 0;

  // use filteredOrders counts for Order cards
  const allOrdersCount = filteredOrders.length;
  const pendingCount = filteredPendingOrders.length;
  const pendingRate = allOrdersCount > 0 ? (pendingCount / allOrdersCount) * 100 : 0;

  const [stats, setStats] = useState({
    totalRevenue: 0,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchRevenue() {
      try {
        const token = localStorage.getItem("token");

        // If you don't have a token, fallback immediately to computed metric
        if (!token) {
          console.warn("No token in localStorage — using computed metrics fallback for service revenue.");
          if (mounted) setStats({ totalRevenue: totalServiceRevenue ?? 0, loading: false });
          return;
        }

        console.log("Fetching service revenue (client)...");
        const res = await fetch(`/api/admin/service-revenue?group=total`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        console.log("service-revenue status:", res.status);
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (e) {
          console.error("service-revenue JSON parse error:", e, "raw:", text);
        }
        console.log("service-revenue response body:", data);

        if (!res.ok) {
          // show a helpful log and fallback
          console.error("service-revenue API returned non-OK:", res.status, data);
          if (mounted) setStats({ totalRevenue: totalServiceRevenue ?? 0, loading: false });
          return;
        }

        const apiRevenue = typeof data?.totalRevenue === "number" ? data.totalRevenue : null;
        if (mounted) {
          setStats({ totalRevenue: apiRevenue ?? totalServiceRevenue ?? 0, loading: false });
        }
      } catch (err) {
        console.error("Failed to fetch service revenue (client):", err);
        if (mounted) setStats({ totalRevenue: totalServiceRevenue ?? 0, loading: false });
      }
    }

    fetchRevenue();

    return () => {
      mounted = false;
    };
  }, [totalServiceRevenue]); // include totalServiceRevenue to update fallback when metrics load



  const dashboardMetrics: DashboardMetricCard[] = [
    {
      title: "All Orders",
      value: `${allOrdersCount}`,
      trend: "up",
      link: `/${locale}/admin/Order`,
    },
    {
      title: "Pending Orders",
      value: `${pendingCount} (${pendingRate.toFixed(1)}%)`,
      trend: pendingRate < 20 ? "up" : "down",
      link: `/${locale}/admin/Collection-pending`,
    },
    {
      title: "Total Seller Revenue",
      value: `$${totalSellerRevenue.toLocaleString()}`,
      trend: "up",
      link: `/${locale}/admin/Top-Sellers`,
    },
    {
      title: "Net Profit (Seller)",
      value: `$${netProfit.toLocaleString()}`,
      trend: netProfit > 0 ? "up" : "down",
      link: `/${locale}/admin/Seller`,
    },
    {
      title: "Average Delivery Time",
      value: `${avgDeliveryHours}h`,
      trend: avgDeliveryHours < 48 ? "up" : "down",
      link: `/${locale}/admin/Delivery-Returned`,
    },
    {
      title: "Return Rate",
      value: `${returnRate}%`,
      trend: parseFloat(returnRate) < 20 ? "up" : "down",
      link: `/${locale}/admin/Order`,
    },
    {
      title: "Delivery Rate",
      value: `${deliveryRate}%`,
      trend: parseFloat(deliveryRate) > 70 ? "up" : "down",
      link: `/${locale}/admin/Order`,
    },
    {
      title: "Total Service Revenue",
      value: `DH 1880`,
      trend: "up",
      link: `/${locale}/admin/Order`,
    }

  ];

  const isPositive = (t: "up" | "down") => t === "up";

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

  // ----------------- UI -----------------
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );

  if (error || !metrics)
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <p>{error || "Failed to load metrics."}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white lg:px-5 p-0">
      <div className="">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Add New Seller",
              icon: IconTrendingUp,
              color: "text-blue-600",
              bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
              actionType: "dialog",
            },
            {
              title: "Add Stock",
              icon: IconTrendingUp,
              color: "text-green-600",
              bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
              actionType: "dialog",
            },
            {
              title: "Manage Orders",
              icon: IconTrendingDown,
              color: "text-amber-600",
              bg: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10",
              link: `/${locale}/admin/Order`,
            },
            {
              title: "Reports & Analytics",
              icon: IconTrendingDown,
              color: "text-purple-600",
              bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10",
              link: `/${locale}/admin/Collection-pending`,
            },
            {
              title: "Returned & Delivered Orders",
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
                    {action.actionType === "dialog" ? "Open seller form →" : "Click to manage →"}
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
                  toast.success("Seller added successfully!");
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
                placeholder="Select a seller..."
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
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Filter by Date</h3>

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
              )
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
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
                    View Details →
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
                <CardTitle style={{ color: "#2BC3F1" }}>Top Sellers Revenue</CardTitle>
                <CardDescription style={{ color: "#E0B660" }}>Revenue performance by top sellers</CardDescription>
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
                <CardTitle style={{ color: "#E0B660" }}>Delivery vs Return Ratio by City</CardTitle>
                <CardDescription style={{ color: "#2BC3F1" }}>Comparison of delivered and returned orders across cities</CardDescription>
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

        {/* Orders table or empty state */}
        {filteredOrders.length > 0 ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
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
              {table.getRowModel().rows.map((row) => (
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
            No orders match the selected date filter.
          </div>
        )}
      </div>


    </div>
  );
}
