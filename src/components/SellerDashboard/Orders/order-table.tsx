"use client";

import * as React from "react";
import axios from "axios";
import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, DownloadIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddOrder } from "./AddOrder";
import { EditOrder } from "./EditOrder";
// use internal Checkbox wrapper (matches usage)
import { Checkbox } from "@/components/ui/checkbox";
import { AddReadyOrder } from "./QuickOrder";
import { ImportReadyOrdersButton } from "@/components/ui/import-ready-orders";

// ---------- Types ----------
// items now use productId instead of sku
export type Order = {
  _id: string;
  orderId: string;
  seller: string;
  items: {
    productId?: string | null;
    productName: string;
    unitPrice: number;
    quantity: number;
    total?: number;
  }[];
  totalAmount: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  orderDate?: string;
  // added customer
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
};

// Status options (include the API's expected string for pickup)
const statuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "ready",
  "confirmed",
  "returned",
  "collected",
  "pickup_request",
];

// Columns
export const getColumns = (
  onStatusUpdate: (id: string, status: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onUpdated: () => void
): ColumnDef<Order>[] => [
    {
      accessorKey: "orderId",
      header: "#Order ID and Tracking Number",
      cell: ({ row }) => {
        const orderId = row.original.orderId;
        return <div className="font-mono text-xs text-muted-foreground">{orderId}</div>;
      },
    },
    // Customer columns
    {
      header: "Customer",
      id: "customer_group",
      // a compact customer cell that shows name + phone on two lines
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
      cell: ({ row }) => (
        <div className="text-sm truncate max-w-xs">{row.original.customer?.address ?? "—"}</div>
      ),
    },
    {
      header: "City",
      id: "customer_city",
      cell: ({ row }) => <div>{row.original.customer?.city ?? "—"}</div>,
    },
    {
      header: "Postal",
      id: "customer_postal",
      cell: ({ row }) => <div>{row.original.customer?.postalCode ?? "—"}</div>,
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <ul className="list-none pl-4">
            {items.map((item, idx) => (
              <li key={item.productId ?? item.productName ?? idx}>{item.productName}</li>
            ))}
          </ul>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <ul className="list-none pl-4">
            {items.map((item, idx) => (
              <li key={(item.productId ?? item.productName ?? idx) + "-q"}>{item.quantity}</li>
            ))}
          </ul>
        );
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
     <ul className="list-none pl-4">
  {items.map((item, idx) => (
    <li key={`${item.productId ?? item.productName ?? idx}-p`}>
      ${item.unitPrice}
    </li>
  ))}
</ul>

        );
      }
      },
    
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>${row.getValue("totalAmount")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        const statusClasses: Record<string, string> = {
          pending: "bg-yellow-100 text-yellow-700",
          processing: "bg-blue-100 text-blue-700",
          shipped: "bg-indigo-100 text-indigo-700",
          delivered: "bg-green-100 text-green-700",
          cancelled: "bg-red-100 text-red-700",
          ready: "bg-emerald-100 text-emerald-700",
          confirmed: "bg-cyan-100 text-cyan-700",
          pickup_request: "bg-orange-100 text-orange-700",
          returned: "bg-pink-100 text-pink-700",
          collected: "bg-purple-100 text-purple-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${statusClasses[status] || "bg-gray-100 text-gray-700"
              }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => <div>{row.getValue("notes") || "—"}</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Registered Date",
      cell: ({ row }) => {
        const dateStr = row.getValue("createdAt") as string;
        return <div>{new Date(dateStr).toLocaleDateString()}</div>;
      },
      filterFn: (row, columnId, filterValue: { from?: string; to?: string }) => {
        const date = new Date(row.getValue(columnId) as string);
        const from = filterValue?.from ? new Date(filterValue.from + "T00:00:00") : null;
        const to = filterValue?.to ? new Date(filterValue.to + "T23:59:59") : null;
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      },
    },
    {
      header: "Export Label",
      id: "export",
      cell: ({ row }) => {
        const order = row.original;

        const handleExport = async () => {
          try {
            const res = await axios.get(
              `https://cod-ecommerce-two.vercel.app/api/seller/orders/${order._id}/shipping-label`,
              {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                responseType: "blob",
              }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `shipping-label-${order._id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (err: any) {
            console.error("Error exporting PDF:", err);
            alert(err.response?.data?.message || "Error downloading PDF");
          }
        };

        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title="Export Shipping Label"
            className="cursor-pointer"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
        );
      },
    },
    {
      header: "Action",
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        const [statusOpen, setStatusOpen] = React.useState(false);
        const [deleteOpen, setDeleteOpen] = React.useState(false);
        const [selectedStatus, setSelectedStatus] = React.useState(order.status);
        const [loading, setLoading] = React.useState(false);
        const [pickupLoading, setPickupLoading] = React.useState(false);
        const [editOpen, setEditOpen] = useState(false);
        const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

        const isReady = order.status === "ready";
        // NEW: disable edit also when status is 'collected' or 'shipped'
        const editDisabled = isReady || order.status === "collected" || order.status === "shipped";

        const handleUpdate = async () => {
          setLoading(true);
          await onStatusUpdate(order._id, selectedStatus);
          setLoading(false);
          setStatusOpen(false);
        };

        const handleDelete = async () => {
          setLoading(true);
          await onDelete(order._id);
          setLoading(false);
          setDeleteOpen(false);
        };

        const handlePickupRequest = async () => {
          try {
            setPickupLoading(true);
            const res = await axios.post(
              `https://cod-ecommerce-two.vercel.app/api/seller/orders/${order._id}/request-pickup`,
              {},
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            alert(res.data.message || "Pickup requested successfully");
            // Use the API's expected status string
            await onStatusUpdate(order._id, "pickup_request");
            onUpdated();
          } catch (err: any) {
            alert(err.response?.data?.message || "Error requesting pickup");
          } finally {
            setPickupLoading(false);
          }
        };

        const handlePrintLabel = async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Missing authentication token");

            const endpoint = `https://cod-ecommerce-two.vercel.app/api/seller/orders/${order._id}/label`;

            const res = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "text/html" });
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
          } catch (err: any) {
            console.error("Print Label Error:", err);
            if (err.response?.data instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => alert(reader.result as string);
              reader.readAsText(err.response.data);
            } else {
              alert(err.message || "Error opening label");
            }
          } finally {
            setLoading(false);
          }
        };

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                {/* Edit Order - now disabled for ready, collected or shipped statuses */}
                <DropdownMenuItem
                  disabled={editDisabled}
                  onClick={() => {
                    if (editDisabled) return;
                    setSelectedOrder(order);
                    setEditOpen(true);
                  }}
                >
                  Edit Order
                </DropdownMenuItem>

                {isReady && (
                  <DropdownMenuItem onClick={handlePrintLabel}>Print Label</DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className={isReady ? "text-gray-400" : "text-red-600"}
                  disabled={isReady}
                  onClick={() => !isReady && setDeleteOpen(true)}
                >
                  {isReady ? "Delete Disabled" : "Delete Order"}
                </DropdownMenuItem>

                {isReady && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={pickupLoading}
                      onClick={handlePickupRequest}
                    >
                      {pickupLoading ? "Requesting..." : "Pickup Request"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedOrder && (
              <EditOrder
                order={selectedOrder}
                open={editOpen}
                onClose={() => {
                  setEditOpen(false);
                  setSelectedOrder(null);
                }}
                onUpdated={onUpdated}
              />
            )}

            {/* Update Status Dialog */}
            <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Order Status</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Select
                    value={selectedStatus}
                    onValueChange={(val) => setSelectedStatus(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStatusOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete Order with {order.items.map((i) => i.productName).join(", ")}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];

// ---------- OrderTable component ----------
export function OrderTable() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [openAddOrder, setOpenAddOrder] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/seller/getMyOrders",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const raw = res.data?.data || [];
      // Normalize incoming items so each item has productId, productName, quantity, unitPrice, total
      const normalized = raw.map((o: any) => {
        const itemsRaw = Array.isArray(o.items) ? o.items : [];
        const items = itemsRaw.map((it: any) => {
          const productId = it.productId ?? it.product?._id ?? it._id ?? null;
          const productName = it.productName ?? it.product?.name ?? it.name ?? "";
          const quantity = Number(it.quantity ?? it.qty ?? 0);
          const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
          const total = Number(it.total ?? it.totalPrice ?? unitPrice * quantity);
          return { productId, productName, quantity, unitPrice, total };
        });

        const totalAmount =
          o.totalAmount ??
          o.total ??
          items.reduce((s: number, it: any) => s + (it.total ?? it.unitPrice * it.quantity), 0);

        // Preserve the backend DB id (o._id) as the canonical _id used in endpoints.
        // Keep orderId separate (tracking number / customer-visible id).
        const dbId = o._id ?? o.id ?? (o.order && o.order._id) ?? null;

        const orderId =
          o.orderId ?? o.orderID ?? o.order_number ?? o.orderNo ?? o.orderCode ?? o.order?.id ?? o._id ?? "";

        // normalize customer (accept both nested object or flat fields)
        const customer = (o.customer && typeof o.customer === "object")
          ? {
            name: o.customer.name ?? o.customer.customerName ?? o.customer.fullName ?? undefined,
            phone: o.customer.phone ?? o.customer.mobile ?? undefined,
            address: o.customer.address ?? o.customer.addr ?? undefined,
            city: o.customer.city ?? undefined,
            postalCode: o.customer.postalCode ?? o.customer.postal ?? undefined,
          }
          : {
            name: o.customerName ?? o.customer_name ?? o.customer_fullName ?? undefined,
            phone: o.customerPhone ?? o.customer_phone ?? undefined,
            address: o.customerAddress ?? undefined,
            city: o.customerCity ?? undefined,
            postalCode: o.customerPostal ?? undefined,
          };

        return {
          _id: dbId ?? orderId, // prefer real DB id; fallback to orderId when DB id missing
          orderId,
          seller: o.seller ?? o.sellerName ?? "",
          items,
          totalAmount,
          notes: o.notes ?? "",
          status: o.status ?? "",
          createdAt: o.createdAt ?? o.orderDate ?? new Date().toISOString(),
          updatedAt: o.updatedAt,
          customer: (customer && Object.values(customer).some(Boolean)) ? customer : undefined,
        } as Order;
      });

      setOrders(normalized);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update status API
  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.patch(
        `https://cod-ecommerce-two.vercel.app/api/seller/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete API
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `https://cod-ecommerce-two.vercel.app/api/seller/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  const filteredData = React.useMemo(() => {
    if (dateFilter === "all") return orders;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const oDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

      switch (dateFilter) {
        case "today":
          return oDate.getTime() === today.getTime();

        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          return oDate.getTime() === yesterday.getTime();
        }

        case "thisWeek": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return oDate >= startOfWeek && oDate <= endOfWeek;
        }

        case "lastWeek": {
          const startOfLastWeek = new Date(today);
          startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endOfLastWeek = new Date(startOfLastWeek);
          endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
          return oDate >= startOfLastWeek && oDate <= endOfLastWeek;
        }

        case "thisMonth": {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return oDate >= startOfMonth && oDate <= endOfMonth;
        }

        case "lastMonth": {
          const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          return oDate >= startOfLastMonth && oDate <= endOfLastMonth;
        }

        default:
          return true;
      }
    });
  }, [orders, dateFilter]);

  // Use filteredData here
  const table = useReactTable({
    data: filteredData,
    columns: getColumns(handleStatusUpdate, handleDelete, fetchOrders),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 100 },
    },
  });

  if (loading) {
    return <p className="p-4">Loading orders...</p>;
  }

  function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    // common keys your app might use
    const keys = ["authToken", "token", "accessToken", "jwt", "sessionToken"];
    for (const k of keys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v) return v;
    }

    // cookie (non-httpOnly)
    const cookieMatch = document.cookie.match(
      /(?:^|; )(?:authToken|token|accessToken|jwt|sessionToken)=([^;]+)/,
    );
    if (cookieMatch) return decodeURIComponent(cookieMatch[1]);

    return null;
  }



  const exportEndpoints = [
    { label: "Export Order", url: "https://cod-ecommerce-two.vercel.app/api/seller/orders/export-excel" },
  ];

  // improved handler

  const handleExport = async (url: string): Promise<void> => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      let credentials: RequestCredentials | undefined = undefined;

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        // no credentials needed for token-based auth
      } else {
        // no token — try cookie-based auth: ask browser to include cookies
        credentials = "include"; // IMPORTANT: server must support CORS with credentials
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials,
      });

      if (!response.ok) {
        // get backend error text to help debugging
        const errorText = await response.text().catch(() => "(no body)");
        throw new Error(`Export failed: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      const cd = response.headers.get("content-disposition");
      let filename = "export.xlsx";
      if (cd) {
        const match = cd.match(/filename\*?=(?:UTF-8'')?[\"']?([^;\"']+)[\"']?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1]);
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("handleExport error:", err);
      // show UI feedback here if you want
    }
  };

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {dateFilter === "all"
                ? "All Orders"
                : dateFilter === "today"
                  ? "Today"
                  : dateFilter === "yesterday"
                    ? "Yesterday"
                    : dateFilter === "thisWeek"
                      ? "This Week"
                      : dateFilter === "lastWeek"
                        ? "Last Week"
                        : dateFilter === "thisMonth"
                          ? "This Month"
                          : "Last Month"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDateFilter("all")}>
              All Orders
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("today")}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("thisWeek")}>
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("lastWeek")}>
              Last Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("thisMonth")}>
              This Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("lastMonth")}>
              Last Month
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2 items-center">
          <label>From:</label>
          <Input
            type="date"
            onChange={(e) =>
              table.getColumn("createdAt")?.setFilterValue({
                ...(table.getColumn("createdAt")?.getFilterValue() as any),
                from: e.target.value,
              })
            }
          />
          <label>To:</label>
          <Input
            type="date"
            onChange={(e) =>
              table.getColumn("createdAt")?.setFilterValue({
                ...(table.getColumn("createdAt")?.getFilterValue() as any),
                to: e.target.value,
              })
            }
          />
        </div>

        <ImportReadyOrdersButton
          endpoint="https://cod-ecommerce-two.vercel.app/api/seller/orders-ready/bulk"
          label="Import Ready Orders"
          onSuccess={fetchOrders}
        />

        <ImportReadyOrdersButton
          endpoint="https://cod-ecommerce-two.vercel.app/api/seller/bulk-orders-based-on-excel"
          label="Import Orders Based on Stock"
          onSuccess={fetchOrders}
        />

        {exportEndpoints.map((item) => (
          <Button
            key={item.label}
            variant="outline"
            className=""
            onClick={() => handleExport(item.url)}
          >
            {item.label} Excel
          </Button>
        ))}


        <div className="flex gap-2">
          <Button onClick={() => setOpenAddOrder(true)}>+ Add Order Based on Stock</Button>
        </div>

        <AddOrder
          open={openAddOrder}
          onOpenChange={setOpenAddOrder}
          onOrderAdded={fetchOrders}
        />
        <AddReadyOrder onOrderAdded={fetchOrders} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getRowModel().rows.length} items
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
