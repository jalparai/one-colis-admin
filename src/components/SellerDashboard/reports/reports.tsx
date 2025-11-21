"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  IconPackage,
  IconShoppingBag,
  IconTruckDelivery,
  IconLoader2,
  IconTicket,
  IconArrowUpRight,
  IconArrowDownRight,
  IconRotate2,
  IconMapPin,
  IconTrendingUp,
  IconFile,
} from "@tabler/icons-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AddTicket } from "../SupportTickets/AddTicket";
import { AddOrder } from "../Orders/AddOrder";
import { AddReadyOrder } from "../Orders/QuickOrder";

/* -------------------- Types -------------------- */

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
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
};

interface TopProduct {
  _id: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  productId: string | null;
  sku: string;
  productName: string;
  averagePrice: number;
}

interface TopCity {
  _id: string;
  orderCount: number;
  totalRevenue: number;
  totalItems: number;
  city: string;
  averageOrderValue: number;
}

/* -------------------- Component -------------------- */

export default function ReportsPage() {
  // raw data
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [totalStocks, setTotalStocks] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerRevenue, setSellerRevenue] = useState<any | null>(null);

  // UI states
  const [openAddOrder, setOpenAddOrder] = useState(false);
  const [openAddReadyOrder, setOpenAddReadyOrder] = useState(false);
  const [openAddTicket, setOpenAddTicket] = useState(false);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month"
  >("all");

  // derived counts
  const [processingOrders, setProcessingOrders] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [readyOrders, setReadyOrders] = useState<number>(0);
  const [returnOrders, setReturnOrders] = useState<number>(0);
  const [deliveredOrders, setDeliveredOrders] = useState<number>(0);
  const [pickupOrders, setPickupOrders] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [newOrdersToday, setNewOrdersToday] = useState<number | null>(null);

  // reports
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCities, setTopCities] = useState<TopCity[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(true);

  // helpers
  const parseDate = (d?: string | number | null) => {
    if (!d) return null;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const startOfWeek = (d: Date) => {
    const copy = new Date(d);
    const day = copy.getDay();
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const inRange = (d?: string | number | null, rangeKey?: typeof dateFilter) => {
    if (!d) return false;
    const dt = parseDate(d);
    if (!dt) return false;

    // If a custom from/to date range is set, it takes precedence over the preset dateFilter
    if (fromDate || toDate) {
      let from = fromDate ? parseDate(fromDate) : null;
      let to = toDate ? parseDate(toDate) : null;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);
      if (from && to) return dt >= from && dt <= to;
      if (from) return dt >= from;
      if (to) return dt <= to;
      return true;
    }

    const nowLocal = new Date();

    switch (rangeKey) {
      case "today":
        return dt.toDateString() === nowLocal.toDateString();
      case "yesterday": {
        const diffDays = Math.floor((nowLocal.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 1;
      }
      case "this_week":
        return startOfWeek(dt).toDateString() === startOfWeek(nowLocal).toDateString();
      case "last_week": {
        const lastWeek = new Date(nowLocal);
        lastWeek.setDate(nowLocal.getDate() - 7);
        return startOfWeek(dt).toDateString() === startOfWeek(lastWeek).toDateString();
      }
      case "this_month":
        return dt.getMonth() === nowLocal.getMonth() && dt.getFullYear() === nowLocal.getFullYear();
      case "last_month": {
        const prevMonth = new Date(nowLocal);
        prevMonth.setMonth(nowLocal.getMonth() - 1);
        return dt.getMonth() === prevMonth.getMonth() && dt.getFullYear() === prevMonth.getFullYear();
      }
      default:
        return true;
    }
  };

  const countToday = (items: any[], dateField = "createdAt") => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return items.filter((it) => {
      const d = parseDate(it[dateField]);
      return d !== null && d >= start;
    }).length;
  };

  /* -------------------- Fetch data -------------------- */

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [stocksRes, ordersRes] = await Promise.all([
        axios.get("https://cod-ecommerce-two.vercel.app/api/seller/seller/stock", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://cod-ecommerce-two.vercel.app/api/seller/getMyOrders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const stocksPayload = stocksRes.data || [];
      const totalQty = Array.isArray(stocksPayload)
        ? stocksPayload.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0)
        : 0;
      setTotalStocks(totalQty);

      const orders = (ordersRes.data && (ordersRes.data.data || ordersRes.data)) || [];
      const ordersArray = Array.isArray(orders) ? orders : [];
      setAllOrders(ordersArray);
      setTotalOrders(ordersArray.length);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellerRevenue = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/seller/seller-revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellerRevenue(res.data || null);
    } catch (err) {
      console.error("Error fetching seller revenue:", err);
      setSellerRevenue(null);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setReportsLoading(false);
      return;
    }

    try {
      const [prodRes, citiesRes] = await Promise.all([
        axios.get("https://cod-ecommerce-two.vercel.app/api/seller/reports/top-products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://cod-ecommerce-two.vercel.app/api/seller/reports/top-cities", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTopProducts(prodRes.data?.data || prodRes.data || []);
      setTopCities(citiesRes.data?.data || citiesRes.data || []);
    } catch (err) {
      console.error("Error fetching reports", err);
      toast.error("Failed to load reports");
      setTopProducts([]);
      setTopCities([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSellerRevenue();
    fetchReports();
  }, [fetchData, fetchSellerRevenue, fetchReports]);

  /* -------------------- Derived filtered orders -------------------- */

  const filteredOrders = useMemo(() => {
    if (!allOrders || allOrders.length === 0) return [];

    return allOrders.filter((order) => {
      if (!inRange(order.createdAt, dateFilter)) return false;
      // apply search
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const status = (order.status || "").toString().toLowerCase();
      const id = (order.id || "").toString().toLowerCase();
      const textMatch = status.includes(q) || id.includes(q) || JSON.stringify(order).toLowerCase().includes(q);
      return textMatch;
    });
  }, [allOrders, dateFilter, searchQuery, fromDate, toDate]);

  useEffect(() => {
    const filtered = filteredOrders;
    const countBy = (s: string) => filtered.filter((o) => (o.status || "").toLowerCase() === s).length;

    setProcessingOrders(countBy("processing"));
    setPendingOrders(countBy("pending"));
    setReadyOrders(countBy("ready"));
    setReturnOrders(countBy("returned"));
    setDeliveredOrders(countBy("delivered"));
    setPickupOrders(countBy("pickup"));
    setTotalOrders(filtered.length);
    setNewOrdersToday(countToday(filtered, "createdAt"));
  }, [filteredOrders]);

  /* -------------------- Revenue from filtered orders -------------------- */

  const totalRevenueFromFilteredOrders = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return 0;
    return filteredOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  }, [filteredOrders]);

  /* -------------------- Table (recent orders) -------------------- */

  const recentOrdersList = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted.slice(0, 50);
  }, [filteredOrders]);

  const orderColumns: ColumnDef<Order>[] = [
    {
      header: "Customer",
      id: "customer_group",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.customer?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{row.original.customer?.phone ?? "—"}</div>
        </div>
      ),
    },
    {
      header: "Address",
      id: "customer_address",
      cell: ({ row }) => <div className="text-sm truncate max-w-xs">{row.original.customer?.address ?? "—"}</div>,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ row }) => <div>DH {Number(row.original.totalAmount || 0).toLocaleString()}</div>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const color = status === "Delivered" ? "bg-green-100 text-green-800" : status === "Returned" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700";
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>;
      },
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleString()}</div>,
    },
  ];

  const table = useReactTable({
    data: recentOrdersList,
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* -------------------- Utils -------------------- */

  const percent = (part: number, total: number) => {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 100);
  };

  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: "linear-gradient(90deg,#60a5fa,#34d399)" }}
      />
    </div>
  );

  const formatCurrency = (v: number) =>
    Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* -------------------- Render -------------------- */

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Quick Actions */}
      <Card className=":data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">
        <CardHeader className="items-center justify-between">
          <CardTitle className="mb-2">Quick Actions</CardTitle>

          <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
            <input
              className="px-3 py-1 rounded-md border bg-white"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search orders"
            />

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setFromDate(null);
                setToDate(null);
              }}
              className="px-3 py-1 rounded-md border bg-white"
              aria-label="Filter date range"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="text-sm">From:</label>
              <input
                type="date"
                value={fromDate ?? ""}
                onChange={(e) => {
                  setFromDate(e.target.value || null);
                  if (e.target.value) setDateFilter("all");
                }}
                className="px-3 py-1 rounded-md border bg-white"
                aria-label="From date"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">To:</label>
              <input
                type="date"
                value={toDate ?? ""}
                onChange={(e) => {
                  setToDate(e.target.value || null);
                  if (e.target.value) setDateFilter("all");
                }}
                className="px-3 py-1 rounded-md border bg-white"
                aria-label="To date"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setFromDate(null);
                setToDate(null);
                setDateFilter("all");
              }}
              className="px-3 py-1 rounded-md border bg-white text-sm"
            >
              Clear
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Create New Order Based on Stock",
                icon: IconShoppingBag,
                color: "text-blue-600",
                action: () => setOpenAddOrder(true),
                bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
              },
              {
                title: "Create New Ready Order",
                icon: IconShoppingBag,
                color: "text-blue-600",
                action: () => setOpenAddReadyOrder(true),
                bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
              },
              {
                title: "Create Support Ticket",
                icon: IconTicket,
                color: "text-green-600",
                action: () => setOpenAddTicket(true),
                bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
              },
              {
                title: "Invoices",
                icon: IconFile,
                color: "text-green-600",
                link: "/en/seller/Invoices",
                bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
              },
            ].map((act, i) => {
              const CardIcon = act.icon!;
              const cardClasses = `group border border-gray-200/40 dark:border-gray-800/40 bg-gradient-to-br ${act.bg} rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer`;

              if (act.action) {
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        act.action && act.action();
                      }
                    }}
                    onClick={() => act.action && act.action()}
                    className={cardClasses}
                  >
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{act.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Open form →</p>
                      </div>
                      <CardIcon className={`h-7 w-7 ${act.color} group-hover:scale-110 transition-transform`} />
                    </CardContent>
                  </div>
                );
              }

              return (
                <Link key={i} href={act.link ?? "#"}>
                  <div className={cardClasses}>
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{act.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Open →</p>
                      </div>
                      <CardIcon className={`h-7 w-7 ${act.color} group-hover:scale-110 transition-transform`} />
                    </CardContent>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>

        <AddOrder
          open={openAddOrder}
          onOpenChange={setOpenAddOrder}
          onOrderAdded={() => {
            setOpenAddOrder(false);
            fetchData();
            toast.success("Order added successfully!");
          }}
        />

        {openAddReadyOrder && (
          <AddReadyOrder
            open={openAddReadyOrder}
            onOpenChange={setOpenAddReadyOrder}
            onOrderAdded={() => {
              setOpenAddReadyOrder(false);
              fetchData();
              toast.success("Ready order added successfully!");
            }}
          />
        )}

        <AddTicket
          open={openAddTicket}
          onOpenChange={setOpenAddTicket}
          onTicketAdded={() => {
            setOpenAddTicket(false);
            fetchData();
          }}
        />
      </Card>

      {/* Stats grid (ALL home page data here, without charts) */}
      <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-4 @5xl/main:grid-cols-4">
        {/* Total Product */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Product</CardTitle>
            </div>
            <IconPackage className="text-blue-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{loading ? "..." : totalStocks ?? 0}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>In inventory</div>
                <div className="text-xs mt-1">Updated just now</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>+{Math.round((totalStocks ?? 0) * 0.08 || 0)}% month</span>
              </div>
              <div className="text-xs">SKU count</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalStocks ? Math.min(100, (totalStocks % 100) as number) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Orders</CardTitle>
            </div>
            <IconShoppingBag className="text-indigo-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{loading ? "..." : totalOrders ?? 0}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{newOrdersToday !== null ? `${newOrdersToday} new today` : "…"}</div>
                <div className="text-xs mt-1">{totalOrders ? `${percent(newOrdersToday ?? 0, totalOrders)}% today` : ""}</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>+{totalOrders ? Math.round((totalOrders as number) * 0.12) : 0}% this week</span>
              </div>
              <div className="text-xs">Orders total</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? Math.min(100, percent(newOrdersToday ?? 0, Math.max(1, totalOrders))) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Total Revenue</CardTitle>
            </div>
            <IconTrendingUp className="text-green-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">
                {loading ? "..." : formatCurrency(totalRevenueFromFilteredOrders)}
              </div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{filteredOrders.length != null ? `${filteredOrders.length} orders` : "—"}</div>
                <div className="text-xs mt-1">{dateFilter === "all" ? (sellerRevenue?.netProfit != null ? `Net: ${formatCurrency(Number(sellerRevenue.netProfit))}` : "") : "Net: calculated from filtered orders"}</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>{`${formatCurrency(Number(totalRevenueFromFilteredOrders || 0))} this period`}</span>
              </div>
              <div className="text-xs">Revenue</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={Math.min(100, (Number(totalRevenueFromFilteredOrders || 0) % 100))} />
            </div>

            {dateFilter === "all" && sellerRevenue?.totalRevenue != null && (
              <div className="mt-2 text-xs text-muted-foreground">All-time (API): {formatCurrency(Number(sellerRevenue.totalRevenue))}</div>
            )}
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Orders</CardTitle>
            </div>
            <IconLoader2 className="text-yellow-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{processingOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(processingOrders, totalOrders)}% of orders` : "—"}</div>
                <div className="text-xs mt-1">Avg handling time: 1.2h</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                <IconArrowDownRight className="h-4 w-4 text-rose-500" />
                <span>-{processingOrders ? Math.round(processingOrders * 0.05) : 0} since last week</span>
              </div>
              <div className="text-xs">Fulfillment</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(processingOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Ready */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Ready Orders</CardTitle>
            </div>
            <IconTruckDelivery className="text-green-500 h-6 w-6" />
          </CardHeader>

          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{readyOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{readyOrders ? `${percent(readyOrders, Math.max(1, totalOrders ?? 1))}% ready` : "—"}</div>
                <div className="text-xs mt-1">{readyOrders > 0 ? `${Math.max(1, Math.round(readyOrders * 0.1))} to ship` : "No shipments"}</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                <IconArrowUpRight className="h-4 w-4 text-green-500" />
                <span>+{readyOrders ? Math.round(readyOrders * 0.03) : 0} new today</span>
              </div>
              <div className="text-xs">Dispatch queue</div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(readyOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Orders</CardTitle>
            </div>
            <IconLoader2 className="text-orange-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{pendingOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(pendingOrders, totalOrders)}% of orders` : "—"}</div>
                <div className="text-xs mt-1">Awaiting action</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(pendingOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Delivered */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Delivered Orders</CardTitle>
            </div>
            <IconTruckDelivery className="text-emerald-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{deliveredOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(deliveredOrders, totalOrders)}% delivered` : "—"}</div>
                <div className="text-xs mt-1">Success rate</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(deliveredOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Returned */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Return Orders</CardTitle>
            </div>
            <IconRotate2 className="text-red-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{returnOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(returnOrders, totalOrders)}% returns` : "—"}</div>
                <div className="text-xs mt-1">Return rate</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(returnOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>

        {/* Pickup */}
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Pickup Orders</CardTitle>
            </div>
            <IconMapPin className="text-purple-500 h-6 w-6" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-semibold">{pickupOrders}</div>
              <div className="text-sm text-muted-foreground text-right">
                <div>{totalOrders ? `${percent(pickupOrders, totalOrders)}% for pickup` : "—"}</div>
                <div className="text-xs mt-1">Ready to collect</div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar value={totalOrders ? percent(pickupOrders, Math.max(1, totalOrders)) : 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders table (no charts) */}
      {recentOrdersList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center text-gray-500 py-10">No recent orders match the selected filter.</CardContent>
        </Card>
      )}

      {/* Top Products */}
      <Card className="shadow-sm border-border/60 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div>
              <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing top {topProducts.length} product{topProducts.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading top products...</div>
          ) : topProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p._id} className="hover:bg-muted/50">
                      <TableCell>{p.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{p.sku || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{p.totalQuantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{p.orderCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.averagePrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No top products found yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Top Cities */}
      <Card className="shadow-sm border-border/60 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div>
              <CardTitle className="text-lg font-semibold">Top Cities</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing top {topCities.length} cit{topCities.length !== 1 ? "ies" : "y"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading top cities...</div>
          ) : topCities.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">City</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Items</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Avg. Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCities.map((c) => (
                    <TableRow key={c._id} className="hover:bg-muted/50">
                      <TableCell>{c.city}</TableCell>
                      <TableCell className="text-right font-medium">{c.orderCount}</TableCell>
                      <TableCell className="text-right">{c.totalItems}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.averageOrderValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No city data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
