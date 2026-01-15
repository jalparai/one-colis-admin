"use client";

import * as React from "react";
import axios from "axios";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowData,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDown, DownloadIcon, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import toast from "react-hot-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AddOrder } from "./AddOrder";
import { ImportReadyOrdersButton } from "@/components/ui/import-ready-orders";
import { AddReadyOrder } from "./AddReadyOrder";
import EditOrder from "./EditOrder";

// ---------- Types ----------
export type Order = {
  id: string;
  seller: string;
  orderId: string;
  sellerEmail?: string;
  items: {
    productId?: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    total?: number;
  }[];
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  itemsTotal?: number;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

type Agent = {
  id: string;
  name: string;
  email?: string;
};

// Extend TableMeta for refresh callback
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void;
  }
}

// ---------- Status options ----------
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
];

// ---------- Columns factory ----------
export const getOrderColumns = (
  onStatusUpdate: (id: string, status: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  onUpdated?: () => void,
  onPrintLabel?: (id: string) => Promise<void>
): ColumnDef<Order>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "orderId",
    header: "# Order ID",
    cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.getValue("orderId") as string}</div>,
  },
  {
    accessorKey: "seller",
    header: "Seller",
    cell: ({ row }) => <div>{row.getValue("seller")}</div>,
  },
  {
    accessorKey: "sellerEmail",
    header: "Email",
    cell: ({ row }) => <div className="lowercase">{row.getValue("sellerEmail")}</div>,
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => (
      <ul className="list-none pl-0">
        {row.original.items.map((item, idx) => (
          <li key={idx}>{item.productName}</li>
        ))}
      </ul>
    ),
  },
  {
    id: "customer_name",
    header: "Customer Name",
    accessorKey: "customer",
    cell: ({ row }) => <div>{row.original.customer?.name ?? "—"}</div>,
  },
  {
    id: "customer_phone",
    header: "Phone",
    accessorKey: "customer",
    cell: ({ row }) => <div className="font-mono text-sm">{row.original.customer?.phone ?? "—"}</div>,
  },
  {
    id: "customer_address",
    header: "Address",
    accessorKey: "customer",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.customer?.address ?? "—"}</div>,
  },
  {
    id: "customer_city",
    header: "City",
    accessorKey: "customer",
    cell: ({ row }) => <div>{row.original.customer?.city ?? "—"}</div>,
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <ul className="list-none pl-0">
        {row.original.items.map((item, idx) => (
          <li key={idx}>{item.quantity}</li>
        ))}
      </ul>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => <div>{row.getValue("totalAmount")} DH</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") ?? "") as string;
      const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
          case "pending":
            return "bg-yellow-50 text-yellow-700";
          case "confirmed":
            return "bg-indigo-50 text-indigo-700";
          case "shipped":
          case "delivered":
            return "bg-green-50 text-green-700";
          case "cancelled":
            return "bg-rose-50 text-rose-700";
          default:
            return "bg-gray-50 text-gray-700";
        }
      };
      return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>{status}</span>;
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <div>{row.getValue("notes") ?? "—"}</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <div>{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</div>,
  },
  {
    id: "print_label",
    header: "Label",
    cell: ({ row }) => {
      const order = row.original;
      const [downloading, setDownloading] = React.useState(false);
      const isReady = order.status === "ready";

      const onClick = async () => {
        if (!onPrintLabel) {
          console.warn("onPrintLabel handler not provided");
          return;
        }
        setDownloading(true);
        try {
          await onPrintLabel(order.id);
        } catch (err) {
          console.error("Print label error:", err);
        } finally {
          setDownloading(false);
        }
      };

      return isReady ? (
        <Button size="sm" onClick={onClick} disabled={downloading}>
          <DownloadIcon />
        </Button>
      ) : (
        <div className="text-sm text-muted-foreground">—</div>
      );
    },
    enableSorting: false,
  },
  {
    header: "Action",
    id: "actions",
    cell: ({ row, table }) => {
      const order = row.original;
      const [statusOpen, setStatusOpen] = React.useState(false);
      const [deleteOpen, setDeleteOpen] = React.useState(false);
      const [selectedStatus, setSelectedStatus] = React.useState<string>(order.status);
      const [loading, setLoading] = React.useState(false);
      const [pickupLoading, setPickupLoading] = React.useState(false);
      const [editOpen, setEditOpen] = React.useState(false);
      const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

      const isReady = order.status === "ready";

      // assign dialog state
      const [assignOpen, setAssignOpen] = React.useState(false);
      const [agents, setAgents] = React.useState<Agent[]>([]);
      const [selectedAgentId, setSelectedAgentId] = React.useState<string>("");
      const [assignLoading, setAssignLoading] = React.useState(false);

      React.useEffect(() => {
        if (!assignOpen) return;
        let cancelled = false;
        const fetchAgents = async () => {
          try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/get-delivery-agents", {
              headers: { Authorization: `Bearer ${token}` },
              validateStatus: () => true,
            });
            const raw = Array.isArray(res.data?.data) ? res.data.data : [];
            const normalized: Agent[] = raw
              .map((a: any) => ({ id: a?.id ?? a?._id, name: a?.name ?? (a?.email ?? "Unnamed"), email: a?.email ?? "" }))
              .filter((a: Agent) => Boolean(a.id));
            if (!cancelled) setAgents(normalized);
          } catch (err) {
            console.error("Failed to fetch agents", err);
            toast.error("Could not load agents");
          }
        };
        fetchAgents();
        return () => {
          cancelled = true;
        };
      }, [assignOpen]);

      const handleAssignToAgent = async () => {
        if (!selectedAgentId) {
          toast.error("Select an agent first");
          return;
        }
        setAssignLoading(true);
        try {
          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          const base = "https://cod-ecommerce-two.vercel.app";
          const res = await axios.post(
            `${base}/api/admin/assign/orders/${selectedAgentId}`,
            { orderIds: [order.id] },
            { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
          );

          if (res.status >= 200 && res.status < 300) {
            try {
              await onStatusUpdate(order.id, "assigned_to_agent");
            } catch (err) {
              toast.success("Assigned to agent — but failed to update status. Refresh to verify.");
              setAssignOpen(false);
              setSelectedAgentId("");
              onUpdated?.();
              table.options.meta?.refresh?.();
              return;
            }

            toast.success("Order assigned to agent and status updated");
            setAssignOpen(false);
            setSelectedAgentId("");
            onUpdated?.();
            table.options.meta?.refresh?.();
          } else {
            const msg = res.data?.message ?? `Assign failed (${res.status})`;
            toast.error(msg);
          }
        } catch (err: any) {
          console.error("Assign error", err);
          toast.error(err?.response?.data?.message ?? "Network error while assigning");
        } finally {
          setAssignLoading(false);
        }
      };

      const handleUpdate = async () => {
        if (!selectedStatus) {
          toast.error("Select a status first");
          return;
        }
        setLoading(true);
        try {
          await onStatusUpdate(order.id, selectedStatus);
          onUpdated?.();
          table.options.meta?.refresh?.();
          toast.success("Status saved");
          setStatusOpen(false);
        } catch (err) {
          toast.error("Could not update status");
        } finally {
          setLoading(false);
        }
      };

      const handleDeleteLocal = async () => {
        setLoading(true);
        try {
          await onDelete(order.id);
          onUpdated?.();
          table.options.meta?.refresh?.();
          setDeleteOpen(false);
        } catch (err) {
          console.error("Delete error:", err);
          toast.error("Could not delete order");
        } finally {
          setLoading(false);
        }
      };

      const handlePickupRequest = async () => {
        try {
          setPickupLoading(true);
          const res = await axios.post(`https://cod-ecommerce-two.vercel.app/api/seller/orders/${order.id}/request-pickup`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
          alert(res.data.message || "Pickup requested successfully");
          await onStatusUpdate(order.id, "pickup_request");
          onUpdated?.();
        } catch (err: any) {
          alert(err.response?.data?.message || "Error requesting pickup");
        } finally {
          setPickupLoading(false);
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

              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrder(order);
                  setEditOpen(true);
                }}
              >
                Edit Order
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setStatusOpen(true)}>Update Status</DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  if (!isReady) {
                    toast.error("Only orders with 'ready' status can be assigned");
                    return;
                  }
                  setAssignOpen(true);
                }}
              >
                Assign to Agent
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setDeleteOpen(true)}>Delete Order</DropdownMenuItem>

              {isReady && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={pickupLoading} onClick={handlePickupRequest}>
                    {pickupLoading ? "Requesting..." : "Pickup Request"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <EditOrder
            order={selectedOrder}
            open={editOpen}
            onOpenChange={(v) => setEditOpen(v)}
            onOrderUpdated={() => {
              onUpdated?.();
              table.options.meta?.refresh?.();
            }}
          />

          {/* Assign Dialog */}
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Order to Agent</DialogTitle>
                <div className="text-sm text-muted-foreground mt-1">Pick a delivery agent to assign this ready order.</div>
              </DialogHeader>

              <div className="py-4">
                <Select value={selectedAgentId} onValueChange={(v) => setSelectedAgentId(String(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={agents.length ? "Select agent" : "No agents available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.length ? (
                      agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} {a.email ? `(${a.email})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-agents" value="__no_agents" disabled>
                        No agents
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={assignLoading}>
                  Cancel
                </Button>
                <Button onClick={handleAssignToAgent} disabled={assignLoading}>
                  {assignLoading ? "Assigning..." : "Assign"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Status Dialog */}
          <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <div className="text-sm text-muted-foreground mt-1">Select the new status for this order.</div>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
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

          {/* Delete confirm */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order with {order.items.map((i) => i.productName).join(", ")}?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteLocal} disabled={loading} className="bg-red-600 hover:bg-red-700">
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

// ---------- OrdersTable component ----------
export function OrdersTable() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");
  const [rangeFilter, setRangeFilter] = React.useState<{ from?: string; to?: string }>({});
  const [cityFilter, setCityFilter] = React.useState("");

  // controlled pagination with default pageSize 50
  const [pagination, setPagination] = React.useState<{ pageIndex: number; pageSize: number }>({
    pageIndex: 0,
    pageSize: 50,
  });

  // --- Bulk action state ---
  const [assignBulkOpen, setAssignBulkOpen] = React.useState(false);
  const [assignBulkLoading, setAssignBulkLoading] = React.useState(false);
  const [selectedAgentIdBulk, setSelectedAgentIdBulk] = React.useState<string>("");
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [deleteBulkOpen, setDeleteBulkOpen] = React.useState(false);
  const [deleteBulkLoading, setDeleteBulkLoading] = React.useState(false);

  const fetchOrders = React.useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = res.data?.data || [];
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

        const customer =
          o.customer && typeof o.customer === "object"
            ? {
                name: o.customer.name ?? o.customer.customerName ?? o.customer.fullName ?? undefined,
                phone: o.customer.phone ?? o.customer.mobile ?? undefined,
                address: o.customer.address ?? o.customer.addr ?? undefined,
                city: o.customer.city ?? undefined,
                postalCode: o.customer.postalCode ?? o.customer.postal ?? undefined,
              }
            : undefined;

        return {
          id: o.id ?? o._id ?? String(Math.random()),
          orderId: o.orderId ?? o.orderID ?? o.order_number ?? o.orderNumber ?? (o._id ? String(o._id) : "") ?? "",
          seller: typeof o.seller === "object" ? o.seller.name ?? o.seller.company ?? o.seller._id : o.seller ?? o.sellerName ?? "",
          sellerEmail: o.sellerEmail ?? o.email ?? (o.seller && typeof o.seller === "object" ? o.seller.email : undefined) ?? "",
          items,
          customer,
          itemsTotal: o.itemsTotal ?? items.reduce((s: number, it: any) => s + (it.total ?? it.unitPrice * it.quantity), 0),
          totalAmount: o.totalAmount ?? o.total ?? items.reduce((s: number, it: any) => s + (it.total ?? it.unitPrice * it.quantity), 0),
          status: o.status ?? "",
          notes: o.notes ?? "",
          createdAt: o.createdAt ?? o.orderDate ?? new Date().toISOString(),
        } as Order;
      });

      setOrders(normalized);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch agents for bulk assign
  React.useEffect(() => {
    if (!assignBulkOpen) return;
    let cancelled = false;
    const fetchAgents = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/get-delivery-agents", {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
        const raw = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalized: Agent[] = raw
          .map((a: any) => ({ id: a?.id ?? a?._id, name: a?.name ?? (a?.email ?? "Unnamed"), email: a?.email ?? "" }))
          .filter((a: Agent) => Boolean(a.id));
        if (!cancelled) setAgents(normalized);
      } catch (err) {
        console.error("Failed to fetch agents", err);
        toast.error("Could not load agents");
      }
    };
    fetchAgents();
    return () => {
      cancelled = true;
    };
  }, [assignBulkOpen]);

  // Status update + delete handlers (admin)
  const handleStatusUpdate = async (id: string, status: string) => {
    if (!id) {
      toast.error("Missing order id");
      return;
    }
    const prev = orders.find((o) => o.id === id);
    if (prev) setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("No auth token found. Please login.");
      if (prev) setOrders((p) => p.map((o) => (o.id === id ? prev : o)));
      return;
    }

    const base = "https://cod-ecommerce-two.vercel.app";
    try {
      const res = await axios.patch(`${base}/api/admin/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) {
        toast.success("Order status updated");
        await fetchOrders();
      } else {
        toast.error("Status update failed");
        if (prev) setOrders((p) => p.map((o) => (o.id === id ? prev : o)));
      }
    } catch (err) {
      console.error("Status update error", err);
      toast.error("Status update failed — check console");
      if (prev) setOrders((p) => p.map((o) => (o.id === id ? prev : o)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error("Missing order id");
      return;
    }
    const prev = orders.find((o) => o.id === id);
    setOrders((p) => p.filter((o) => o.id !== id));

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("No auth token found. Please login.");
      if (prev) setOrders((p) => [prev, ...p]);
      return;
    }

    const base = "https://cod-ecommerce-two.vercel.app";
    try {
      const res = await axios.delete(`${base}/api/admin/delete-order/${id}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) {
        toast.success("Order deleted");
        await fetchOrders();
      } else {
        toast.error("Delete failed");
        if (prev) setOrders((p) => [prev, ...p]);
      }
    } catch (err) {
      console.error("Delete error", err);
      toast.error("Delete failed — check console");
      if (prev) setOrders((p) => [prev, ...p]);
    }
  };

  // Bulk delete
  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (!selectedRows.length) {
      toast.error("No orders selected");
      return;
    }
    const ids = selectedRows.map((r) => r.original.id);
    const prevOrders = orders.slice();
    setOrders((p) => p.filter((o) => !ids.includes(o.id)));
    setDeleteBulkLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast.error("No auth token found. Please login.");
        setOrders(prevOrders);
        return;
      }
      const base = "https://cod-ecommerce-two.vercel.app";
      const promises = ids.map((id) => axios.delete(`${base}/api/admin/delete-order/${id}`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }));
      const results = await Promise.all(promises);
      const failed = results.filter((res) => !(res.status >= 200 && res.status < 300));
      if (failed.length) {
        console.error("Bulk delete failures:", failed);
        toast.error("Some deletes failed — check console");
        await fetchOrders();
      } else {
        toast.success("Selected orders deleted");
        await fetchOrders();
      }
      setDeleteBulkOpen(false);
      table.resetRowSelection();
    } catch (err) {
      console.error("Bulk delete error", err);
      toast.error("Bulk delete failed");
      await fetchOrders();
    } finally {
      setDeleteBulkLoading(false);
    }
  };

  // Bulk assign
  const handleAssignSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (!selectedRows.length) {
      toast.error("No orders selected");
      return;
    }
    const ids = selectedRows.map((r) => r.original.id);
    const notReady = selectedRows.filter((r) => r.original.status !== "ready");
    if (notReady.length) {
      toast.error("Only orders with 'ready' status can be assigned. Deselect others or update their status first.");
      return;
    }
    if (!selectedAgentIdBulk) {
      toast.error("Select an agent first");
      return;
    }
    setAssignBulkLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast.error("No auth token found. Please login.");
        return;
      }
      const base = "https://cod-ecommerce-two.vercel.app";
      const res = await axios.post(`${base}/api/admin/assign/orders/${selectedAgentIdBulk}`, { orderIds: ids }, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) {
        toast.success("Orders assigned to agent");
        await fetchOrders();
        setAssignBulkOpen(false);
        setSelectedAgentIdBulk("");
        table.resetRowSelection();
      } else {
        const msg = res.data?.message ?? `Assign failed (${res.status})`;
        toast.error(msg);
      }
    } catch (err: any) {
      console.error("Assign error", err);
      toast.error(err?.response?.data?.message ?? "Network error while assigning");
    } finally {
      setAssignBulkLoading(false);
    }
  };

  // Date filtering
  const filteredOrders = React.useMemo(() => {
    if (dateFilter === "all") return orders;
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      switch (dateFilter) {
        case "today":
          return createdAt >= startOfDay(now) && createdAt <= endOfDay(now);
        case "yesterday": {
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return createdAt >= startOfDay(y) && createdAt <= endOfDay(y);
        }
        case "thisWeek": {
          const day = now.getDay();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - day);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return createdAt >= weekStart && createdAt <= weekEnd;
        }
        case "lastWeek": {
          const lastWeekStart = new Date(now);
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
          lastWeekStart.setHours(0, 0, 0, 0);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          lastWeekEnd.setHours(23, 59, 59, 999);
          return createdAt >= lastWeekStart && createdAt <= lastWeekEnd;
        }
        case "thisMonth": {
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          return createdAt >= thisMonthStart && createdAt <= thisMonthEnd;
        }
        case "lastMonth": {
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
        }
        default:
          return true;
      }
    });
  }, [orders, dateFilter]);

  // single label download
  const handleDownloadLabel = async (orderId: string) => {
    if (!orderId) {
      toast.error("Missing order id");
      return;
    }
    let loadingToastId: string | undefined;
    try {
      loadingToastId = toast.loading("Downloading label...");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("Missing authentication token");

      const endpoint = `https://cod-ecommerce-two.vercel.app/api/seller/orders/${orderId}/shipping-label`;
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" });

      const contentType = res.headers?.["content-type"] || "application/octet-stream";
      let filename = `shipping-label-${orderId}`;
      const disposition = res.headers?.["content-disposition"];
      if (disposition) {
        const fnStarMatch = disposition.match(/filename\*=UTF-8''([^;]+)/);
        const fnMatch = disposition.match(/filename="?([^";]+)"?/);
        if (fnStarMatch && fnStarMatch[1]) {
          try {
            filename = decodeURIComponent(fnStarMatch[1]);
          } catch {
            filename = fnStarMatch[1];
          }
        } else if (fnMatch && fnMatch[1]) {
          filename = fnMatch[1];
        }
      } else {
        if (contentType.includes("pdf")) filename += ".pdf";
        else if (contentType.includes("html")) filename += ".html";
        else if (contentType.includes("zip")) filename += ".zip";
        else if (contentType.includes("text")) filename += ".txt";
        else filename += ".bin";
      }

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Label downloaded");
    } catch (err: any) {
      console.error("Download label error", err);
      const errData = err?.response?.data;
      if (errData instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => alert(reader.result as string);
        reader.readAsText(errData);
      } else {
        toast.error(err?.response?.data?.message || err?.message || "Error downloading label");
      }
    } finally {
      if (loadingToastId) toast.dismiss(loadingToastId);
    }
  };

  // Bulk label download for selected rows (downloads each ready order label individually)
  const handleDownloadSelectedLabels = async () => {
    const selected = table.getFilteredSelectedRowModel().rows;
    if (!selected.length) {
      toast.error("No rows selected");
      return;
    }
    const ready = selected.filter((r) => r.original.status === "ready");
    const skipped = selected.length - ready.length;
    if (!ready.length) {
      toast.error("No selected orders are in 'ready' status");
      return;
    }

    const loadingId = toast.loading(`Downloading ${ready.length} label(s)...`);
    const successes: string[] = [];
    const failures: { id: string; msg: string }[] = [];

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("Missing authentication token");
      toast.dismiss(loadingId);
      return;
    }

    // download sequentially to avoid spamming server; you can parallelize if desired
    for (const r of ready) {
      const id = r.original.id;
      try {
        const endpoint = `https://cod-ecommerce-two.vercel.app/api/seller/orders/${id}/shipping-label`;
        const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" });
        const contentType = res.headers?.["content-type"] || "application/octet-stream";
        let filename = `shipping-label-${id}`;
        const disposition = res.headers?.["content-disposition"];
        if (disposition) {
          const fnStarMatch = disposition.match(/filename\*=UTF-8''([^;]+)/);
          const fnMatch = disposition.match(/filename="?([^";]+)"?/);
          if (fnStarMatch && fnStarMatch[1]) {
            try {
              filename = decodeURIComponent(fnStarMatch[1]);
            } catch {
              filename = fnStarMatch[1];
            }
          } else if (fnMatch && fnMatch[1]) {
            filename = fnMatch[1];
          }
        } else {
          if (contentType.includes("pdf")) filename += ".pdf";
          else if (contentType.includes("html")) filename += ".html";
          else if (contentType.includes("zip")) filename += ".zip";
          else if (contentType.includes("text")) filename += ".txt";
          else filename += ".bin";
        }

        const blob = new Blob([res.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        successes.push(id);
      } catch (err: any) {
        console.error("Bulk label download error for", id, err);
        failures.push({ id, msg: err?.response?.data?.message ?? err?.message ?? "Error" });
      }
    }

    toast.dismiss(loadingId);
    const parts: string[] = [];
    if (successes.length) parts.push(`${successes.length} downloaded`);
    if (failures.length) parts.push(`${failures.length} failed`);
    if (skipped) parts.push(`${skipped} skipped (not ready)`);
    toast.success(parts.join(", "));
    if (failures.length) {
      console.warn("Bulk label failures:", failures);
    }
  };

  // Apply range + search
  const timeFilteredOrders = React.useMemo(() => {
    return filteredOrders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const from = rangeFilter.from ? new Date(rangeFilter.from) : null;
      const to = rangeFilter.to ? new Date(rangeFilter.to) : null;
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
      return true;
    });
  }, [filteredOrders, rangeFilter]);

  const finalOrders = React.useMemo(() => {
    if (cityFilter && cityFilter.trim()) {
      const q = cityFilter.toLowerCase();
      return timeFilteredOrders.filter((o) => (o.customer?.city ?? "").toLowerCase().includes(q));
    }
    if (!globalFilter.trim()) return timeFilteredOrders;
    const q = globalFilter.toLowerCase();
    return timeFilteredOrders.filter((o) => {
      return (
        (o.seller ?? "").toLowerCase().includes(q) ||
        (o.sellerEmail ?? "").toLowerCase().includes(q) ||
        (o.status ?? "").toLowerCase().includes(q) ||
        (o.notes ?? "").toLowerCase().includes(q) ||
        (o.customer?.name ?? "").toLowerCase().includes(q) ||
        (o.customer?.phone ?? "").toLowerCase().includes(q) ||
        o.items.some((it) => it.productName.toLowerCase().includes(q) || String(it.quantity).includes(q) || String(it.unitPrice).includes(q))
      );
    });
  }, [timeFilteredOrders, globalFilter, cityFilter]);

  const table = useReactTable({
    data: finalOrders,
    columns: getOrderColumns(handleStatusUpdate, handleDelete, fetchOrders, handleDownloadLabel),
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { refresh: fetchOrders },
    initialState: { pagination },
  });

  const exportEndpoints = [{ label: "Export Orders", url: "http://cod-ecommerce-two.vercel.app/api/adminb/bulk/orders/export/excel" }];

  const handleExport = async (url: string): Promise<void> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to export data");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      alert("Error exporting file!");
    }
  };

  if (loading) return <p className="p-4">Loading orders...</p>;

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="flex justify-between items-center py-4 overflow-x-auto scrollbar-hide gap-4">
        <Input placeholder="Filter by city..." value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="max-w-sm" />

        <div className="flex items-center gap-2">
          <label>From:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, from: e.target.value }))} />
          <label>To:</label>
          <Input type="date" onChange={(e) => setRangeFilter((prev) => ({ ...prev, to: e.target.value }))} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Filter: {dateFilter} <ChevronDown /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[{ key: "all", label: "All" }, { key: "today", label: "Today" }, { key: "yesterday", label: "Yesterday" }, { key: "thisWeek", label: "This Week" }, { key: "lastWeek", label: "Last Week" }, { key: "thisMonth", label: "This Month" }, { key: "lastMonth", label: "Last Month" }].map((option) => (
              <DropdownMenuItem key={option.key} onClick={() => setDateFilter(option.key as typeof dateFilter)}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2 items-center">
          {selectedCount > 0 && (
            <>
              <Button onClick={() => setAssignBulkOpen(true)}>Assign Selected ({selectedCount})</Button>
              <Button variant="destructive" onClick={() => setDeleteBulkOpen(true)}>Delete Selected ({selectedCount})</Button>
            </>
          )}

          <Button onClick={handleDownloadSelectedLabels} disabled={selectedCount === 0}>
            Export Labels ({selectedCount})
          </Button>

          <ImportReadyOrdersButton endpoint="https://cod-ecommerce-two.vercel.app/api/admin/ready-order/bulk-upload" label="Import Ready Orders" onSuccess={fetchOrders} />
          <Button onClick={() => window.open("https://1drv.ms/x/c/3c77c4662797e2f6/IQBZ16V_2su7R62uupIfg-qcAf_H1M__8UKwBeGdcXci2k8?e=AzlxPi", "_blank")}>View Excal Example</Button>

          <AddReadyOrder onOrderAdded={fetchOrders} />
          <AddOrder onOrderAdded={fetchOrders} />
        </div>
      </div>

      {exportEndpoints.map((item) => (
        <Button key={item.label} variant="outline" className="mb-3" onClick={() => handleExport(item.url)}>
          {item.label} Excal
        </Button>
      ))}

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-4 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Page {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())} • Showing up to {pagination.pageSize} rows</div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Assign Dialog */}
      <Dialog open={assignBulkOpen} onOpenChange={setAssignBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Selected Orders to Agent</DialogTitle>
            <div className="text-sm text-muted-foreground mt-1">Select a delivery agent to assign the selected ready orders.</div>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedAgentIdBulk} onValueChange={(v) => setSelectedAgentIdBulk(String(v))}>
              <SelectTrigger>
                <SelectValue placeholder={agents.length ? "Select agent" : "No agents available"} />
              </SelectTrigger>
              <SelectContent>
                {agents.length ? (
                  agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} {a.email ? `(${a.email})` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-agents" value="__no_agents" disabled>
                    No agents
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignBulkOpen(false)} disabled={assignBulkLoading}>
              Cancel
            </Button>
            <Button onClick={handleAssignSelected} disabled={assignBulkLoading}>
              {assignBulkLoading ? "Assigning..." : `Assign (${selectedCount})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm */}
      <AlertDialog open={deleteBulkOpen} onOpenChange={setDeleteBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} selected order(s)?</AlertDialogTitle>
            <AlertDialogDescription>This action will delete the selected orders and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBulkLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} disabled={deleteBulkLoading} className="bg-red-600 hover:bg-red-700">
              {deleteBulkLoading ? "Deleting..." : `Delete (${selectedCount})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
