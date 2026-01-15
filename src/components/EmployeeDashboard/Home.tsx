"use client";

import React, { useEffect, useState } from "react";
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
import { AddStockDialog } from "./Seller/AddStockDialog";






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

// ----------------- Component -----------------
export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");
const [openAddSeller, setOpenAddSeller] = useState(false);
const [openAddStock, setOpenAddStock] = useState(false);
const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
const [openAssignProduct, setOpenAssignProduct] = useState(false);
const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
const [employeePermissions, setEmployeePermissions] = useState({
  addStock: false,
  manageOrders: false,
  scanOrders: false,
  assignProducts: false,
  assignOrders: false,
  assignPayouts: false,
});

  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  // ----------------- Table Definition -----------------
  const orderColumns: ColumnDef<Order>[] = [
    {
      header: "Seller",
      accessorKey: "seller",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.seller}</div>
      ),
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
      cell: ({ row }) => (
        <div>{row.original.totalAmount.toLocaleString()} DH</div>
      ),
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
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns: orderColumns,
    getCoreRowModel: getCoreRowModel(),
  });

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
         
          ordersRes,
        ] = await Promise.all([
        
          fetch("https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-orders", { headers }),
        ]);

        const [
        
          ordersData,
        ] = await Promise.all([
       
          ordersRes.json(),
        ]);

       

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
      const res = await fetch("https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-sellers", {
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
// Fetch employee permissions from localStorage
useEffect(() => {
  try {
    const emp = JSON.parse(localStorage.getItem("employee") || "{}");
    if (emp?.permissions) setEmployeePermissions(emp.permissions);
  } catch (err) {
    console.error("Failed to parse employee permissions", err);
  }
}, []);

// Fetch delivery agents
useEffect(() => {
  async function fetchAgents() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-delivery-agents",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      const normalized = (data?.data || []).map((a: any) => ({
        id: a._id ?? a.id ?? "",
        name: a.name ?? a.fullName ?? "Unnamed Agent",
      }));

      setAgents(normalized);
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  }
  fetchAgents();
}, []);




  // ----------------- Date Filter Logic -----------------
  const now = new Date();
const filteredOrders = React.useMemo(() => {
  if (!orders || orders.length === 0) return [];

  const now = new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  // Monday-based week start
  const startOfWeekMonday = (d: Date) => {
    const copy = new Date(d);
    const dayIndex = (copy.getDay() + 6) % 7; // Monday = 0
    copy.setDate(copy.getDate() - dayIndex);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  return orders.filter((order) => {
    if (!order.createdAt) return false;
    const created = new Date(order.createdAt);

    // custom handling for each filter type
    switch (dateFilter) {
      case "today": {
        const s = startOfDay(now);
        const e = endOfDay(now);
        return created >= s && created <= e;
      }

        case "yesterday": {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          const s = startOfDay(y);
          const e = endOfDay(y);
          return created >= s && created <= e;
        }

      case "thisWeek": {
        const weekStart = startOfWeekMonday(now);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return created >= weekStart && created <= weekEnd;
      }

      case "lastWeek": {
        const thisWeekStart = startOfWeekMonday(now);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(thisWeekStart.getDate() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return created >= lastWeekStart && created <= lastWeekEnd;
      }

      case "thisMonth": {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return created >= startMonth && created <= endMonth;
      }

      case "lastMonth": {
        const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const endLast = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return created >= startLast && created <= endLast;
      }

      default:
        return true;
    }
  });
}, [orders, dateFilter]);

  // ----------------- Calculations -----------------
  // ----------------- Conditional UI -----------------
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );

 

  const isPositive = (t: "up" | "down") => t === "up";



  // ----------------- UI -----------------
  return (
    <div className="min-h-screen bg-white lg:px-5 p-0">
      {/* 🚀 Quick Actions Section */}
{/* 🚀 Quick Actions Section */}
<div className="">
  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
    Quick Actions
  </h2>

  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
{[
  // Show only if employee has addStock permission
  ...(employeePermissions.addStock
    ? [
        {
          title: "Add Stock",
          icon: IconTrendingUp,
          color: "text-green-600",
          bg: "from-green-50 to-green-100",
          actionType: "dialog",
        },
      ]
    : []),

  // Show only if employee has manageOrders permission
  ...(employeePermissions.manageOrders
    ? [
        {
          title: "Manage Orders",
          icon: IconTrendingDown,
          color: "text-amber-600",
          bg: "from-amber-50 to-amber-100",
          link: `/${locale}/employee/Orders`,
        },
      ]
    : []),

].map((action, i) => (
  <Card
    key={i}
    className={`group border border-gray-200 bg-gradient-to-br ${action.bg} rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer`}
    onClick={() => {
      if (action.title === "Add Stock") setOpenAddStock(true);
      else if (action.actionType === "dialog") setOpenAddSeller(true);
      else if (action.actionType === "assignProduct") setOpenAssignProduct(true);
      else if (action.link) router.push(action.link);
    }}
  >
    <CardContent className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-semibold text-gray-800">{action.title}</p>
        <p className="text-xs text-gray-500">
          {action.actionType === "assignProduct"
            ? "Assign to delivery agent →"
            : "Click to manage →"}
        </p>
      </div>
      <action.icon
        className={`h-7 w-7 ${action.color} group-hover:scale-110 transition-transform`}
      />
    </CardContent>
  </Card>
))}

  </div>

  {/* --- Add Seller Dialog --- */}
{/* --- Add Seller Dialog --- */}
{openAddSeller && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white flex items-center justify-center dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 relative">
      {/* Close button */}
      <button
        onClick={() => setOpenAddSeller(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold"
      >
        &times;
      </button>

    
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

      {/* Seller Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Select Seller
        </label>
        <select
          className="w-full border rounded-md p-2"
          value={selectedSeller || ""}
          onChange={(e) => setSelectedSeller(e.target.value)}
        >
          <option value="" disabled>
            -- Select a seller --
          </option>
{sellers.map((s, idx) => (
  // use s.id (normalized above) and a stable key
  <option key={s.id || idx} value={s.id}>
    {s.name}
  </option>
))}


        </select>
      </div>

      {/* Only show AddStockDialog if a seller is selected */}
{selectedSeller && (
  <AddStockDialog
    sellerId={selectedSeller}
    open={openAddStock}                // <-- use openAddStock
    onOpenChange={(open) => {
      if (!open) {
        setOpenAddStock(false);
        setSelectedSeller(null);
      }
    }}
    onStockAdded={() => {
      // toast.success("Stock added successfully!");
      setOpenAddStock(false);
      setSelectedSeller(null);
    }}
  />
)}

    </div>
  </div>
)}


</div>

{openAssignProduct && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 relative">
      {/* Close button */}
      <button
        onClick={() => setOpenAssignProduct(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold"
      >
        &times;
      </button>

      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Assign Product to Delivery Agent
      </h2>

      {/* Agent Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Select Agent
        </label>
        <select
          className="w-full border rounded-md p-2"
          value={selectedAgent || ""}
          onChange={(e) => setSelectedAgent(e.target.value)}
        >
          <option value="" disabled>
            -- Select a delivery agent --
          </option>
          {agents.map((a, idx) => (
            <option key={a.id || idx} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Product Name
        </label>
        <input
          type="text"
          placeholder="Enter product name"
          className="w-full border rounded-md p-2"
          id="productName"
        />
      </div>

      {/* Assign Button */}
      <div className="flex justify-end">
        <Button
          disabled={!selectedAgent}
          onClick={() => {
            const product = (document.getElementById("productName") as HTMLInputElement)?.value;
            if (!product) return toast.error("Please enter a product name");

            toast.success(`Assigned "${product}" to agent successfully!`);
            setOpenAssignProduct(false);
            setSelectedAgent(null);
          }}
        >
          Assign Product
        </Button>
      </div>
    </div>
  </div>
)}

      <div className="mx-auto max-w-7xl mt-5 space-y-8">
        {/* Metric Cards */}
  

<div className="grid lg:grid-cols-2 gap-5 grid-cols-1 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-sm">

      
    
</div>
        {/* Orders Table */}
        {orders.length > 0 && (
          <Card className="shadow-sm border rounded-2xl">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Filter orders by date range</CardDescription>
              </div>
              <Select
                value={dateFilter}
                onValueChange={(v) => setDateFilter(v as typeof dateFilter)}
              >
                <SelectTrigger className="w-[180px]">
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
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {filteredOrders.length ? (
                      filteredOrders.slice(0, 5).map((order, index) => (
                        <TableRow key={index}>
                          {table.getAllColumns().map((col) => (
                            <TableCell key={col.id}>
                              {flexRender(
                                col.columnDef.cell,
                                { row: { original: order } } as any
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    
    </div>
  );
}
