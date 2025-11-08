"use client";

import * as React from "react";
import axios from "axios";
import {
  type ColumnDef,
  type RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ✅ Types
export type Order = {
  id?: string
  _id?: string
  seller: string
  sellerEmail: string
  items: {
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  itemsTotal: number
  totalAmount: number
  status: string
  notes: string
  createdAt: string
  updatedAt: string
}
type Agent = {
  id: string
  name: string
  email: string
  // ...existing fields may exist on server (_id etc.)
}
function getStoredUser(): any | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" && parsed.user ? parsed.user : parsed
  } catch (e) {
    return null
  }
}

function hasAnyPermission(permissionsObj: any, keys: string[]) {
  if (!permissionsObj || typeof permissionsObj !== "object") return false
  return keys.some((k) => {
    const v = permissionsObj[k]
    if (typeof v === "string") return v.toLowerCase() === "true"
    return Boolean(v)
  })
}

// ✅ Extend TableMeta to allow refresh
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    refresh?: () => void
  }
}


// ✅ Columns (actions removed)
// Replace the previous getOrderColumns() actions column with this updated function
const getOrderColumns = (): ColumnDef<Order>[] => {
  return [
    { accessorKey: "seller", header: "Seller" },
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
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => <div>${row.getValue("totalAmount")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "";
        const color =
          status.toLowerCase() === "pending"
            ? "bg-yellow-50 text-yellow-700"
            : status.toLowerCase() === "confirmed"
            ? "bg-indigo-50 text-indigo-700"
            : status.toLowerCase() === "delivered"
            ? "bg-green-50 text-green-700"
            : "bg-gray-50 text-gray-700";
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${color}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => <div>{new Date(row.getValue("createdAt") as string).toLocaleDateString()}</div>,
    },
    {
      id: "actions",
      header: "Actions/Assign",
      cell: ({ row, table }) => {
        const [deleteOpen, setDeleteOpen] = React.useState(false);
        const [assignOpen, setAssignOpen] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [agents, setAgents] = React.useState<Agent[]>([]);
        const [selectedAgent, setSelectedAgent] = React.useState("");
        const [filteredAgents, setFilteredAgents] = React.useState<Agent[]>([]);

        // permissions (only permission check here)
        const storedUser = getStoredUser();
        const permissions = storedUser?.permissions ?? {};
        const hasAssignPermission = hasAnyPermission(permissions, ["assignPickups"]);

        // row status (normalized)
        const rowStatus = (row.original.status ?? "").toString().trim().toLowerCase();

        // final gate: only allow assign when permission exists AND status is "pickup"
        const allowAssign = hasAssignPermission && rowStatus === "pickup_requested";

        React.useEffect(() => {
          if (!assignOpen) return;

          if (!allowAssign) {
            // Defensive: should not happen because menu disables, but guard anyway
            toast.error("You cannot assign this order — only pickups can be assigned.");
            setAssignOpen(false);
            return;
          }

          const fetchAgents = async () => {
            try {
              const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
              const res = await axios.get("https://cod-ecommerce-two.vercel.app/api/admin/get-delivery-agents", {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true,
              });

              const raw = Array.isArray(res.data?.data) ? res.data.data : [];
              const normalized: Agent[] = raw
                .map((a: any) => ({
                  id: a?.id ?? a?._id,
                  name: a?.name ?? "",
                  email: a?.email ?? "",
                }))
                .filter((a: Agent, i: number, arr: Agent[]) => Boolean(a.id) && i === arr.findIndex((x) => x.id === a.id));

              setAgents(normalized);
              setFilteredAgents(normalized);
            } catch (err) {
              console.error("❌ Failed to fetch agents", err);
              toast.error("Could not load agents");
            }
          };

          fetchAgents();
        }, [assignOpen, allowAssign]);

        const handleDelete = async () => {
          try {
            setLoading(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const orderId = row?.original?._id ?? row?.original?.id;
            if (!orderId) {
              toast.error("Order ID missing.");
              return;
            }

            const res = await axios.delete(
              `https://cod-ecommerce-two.vercel.app/api/admin/delete-order/${orderId}`,
              { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            );

            if (res.status >= 200 && res.status < 300) {
              toast.success("Order deleted");
              setDeleteOpen(false);
              table.options.meta?.refresh?.();
            } else {
              console.error("Delete failed", res.status, res.data);
              toast.error(res.data?.message ?? `Delete failed (${res.status})`);
            }
          } catch (err) {
            console.error("❌ Failed to delete order", err);
            toast.error("Failed to delete order");
          } finally {
            setLoading(false);
          }
        };

        const handleAssign = async () => {
          if (!selectedAgent) {
            toast.error("Please select an agent first");
            return;
          }

          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
          if (!token) {
            toast.error("Not authenticated. Please login again.");
            return;
          }

          const orderId = row?.original?._id ?? row?.original?.id;
          if (!orderId) {
            toast.error("Order ID missing.");
            return;
          }

          try {
            setLoading(true);
            const res = await axios.post(
              `https://cod-ecommerce-two.vercel.app/api/admin/assign/pickups/${selectedAgent}`,
              { orderIds: [orderId] },
              { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            );

            if (res.status >= 200 && res.status < 300) {
              toast.success("Pickup assigned successfully");
              setAssignOpen(false);
              setSelectedAgent("");
              table.options.meta?.refresh?.();
            } else {
              console.error("Assign failed", res.status, res.data);
              toast.error(res.data?.message ?? `Assign failed (${res.status})`);
            }
          } catch (err: any) {
            console.error("Failed to assign pickup", err.response?.data || err.message);
            toast.error("Could not assign pickup. Please try again.");
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
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                {/* Assign item: only actionable when allowAssign === true */}
                {allowAssign ? (
                  <DropdownMenuItem onClick={() => setAssignOpen(true)}>Assign Pickup to Agent</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      toast.error(
                        hasAssignPermission
                          ? "Only orders with status 'pickup' can be assigned."
                          : "You don't have permission to assign pickups."
                      )
                    }
                    className="opacity-50 cursor-not-allowed"
                  >
                    Assign Pickup to Agent
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Modal */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The order will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
                    {loading ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Assign Modal */}
            <AlertDialog open={assignOpen} onOpenChange={setAssignOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Assign Order</AlertDialogTitle>
                  <AlertDialogDescription>Select an agent to assign this order.</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="my-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {selectedAgent ? agents.find((a) => a.id === selectedAgent)?.name : "Select Agent..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[300px] p-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Search agent..."
                          className="border px-2 py-1 rounded-md text-sm"
                          onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            const filtered = agents.filter(
                              (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
                            );
                            setFilteredAgents(filtered);
                          }}
                        />

                        <div className="max-h-48 overflow-y-auto">
                          {(filteredAgents.length ? filteredAgents : agents).map((agent) => (
                            <div
                              key={agent.id}
                              className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 ${
                                selectedAgent === agent.id ? "bg-gray-100" : ""
                              }`}
                              onClick={() => setSelectedAgent(agent.id)}
                            >
                              {agent.name} ({agent.email})
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAssign}
                    disabled={loading || !selectedAgent || agents.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Assigning..." : "Assign"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];
};


// ✅ Main Component
export function EmployeeOrdersTable() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<
    "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth"
  >("all");

  // fetch orders and filter out pickup_requested
  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://cod-ecommerce-two.vercel.app/api/employee/employee/get-all-orders",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allOrders: Order[] = res.data?.data || [];

      // filter out any orders with status "pickup_requested" (case-insensitive)
      const visible = allOrders.filter(
        (o) => (o.status ?? "").toLowerCase()
      );

      setOrders(visible);
      setFilteredOrders(visible);
    } catch (err) {
      console.error("Fetch orders failed", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // local filtering (search + date), operates on already filtered `orders`
  React.useEffect(() => {
    let filtered = [...orders];

    if (search.trim()) {
      filtered = filtered.filter((o) => (o.sellerEmail || "").toLowerCase().includes(search.toLowerCase()));
    }

    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    filtered = filtered.filter((order) => {
      const created = new Date(order.createdAt);
      switch (dateFilter) {
        case "today":
          return created >= startOfToday && created < endOfToday;
        case "yesterday": {
          const startOfYesterday = new Date(startOfToday.getTime() - oneDay);
          return created >= startOfYesterday && created < startOfToday;
        }
        case "thisWeek": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return created >= startOfWeek && created <= today;
        }
        case "lastWeek": {
          const startLastWeek = new Date(today);
          startLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endLastWeek = new Date(startLastWeek);
          endLastWeek.setDate(startLastWeek.getDate() + 6);
          return created >= startLastWeek && created <= endLastWeek;
        }
        case "thisMonth":
          return created.getMonth() === today.getMonth() && created.getFullYear() === today.getFullYear();
        case "lastMonth": {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          return created.getMonth() === lastMonth.getMonth() && created.getFullYear() === lastMonth.getFullYear();
        }
        default:
          return true;
      }
    });

    setFilteredOrders(filtered);
  }, [search, dateFilter, orders]);

  const table = useReactTable({
    data: filteredOrders,
    columns: getOrderColumns(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
    meta: { refresh: fetchOrders },
  });

  if (loading) return <p className="p-4">Loading orders...</p>;

  return (
    <div className="w-full space-y-4">
      {/* Filters Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-3 py-1 w-64"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["all", "today", "yesterday", "thisWeek", "lastWeek", "thisMonth", "lastMonth"].map(
              (option) => (
                <DropdownMenuItem key={option} onClick={() => setDateFilter(option as any)}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="text-center py-4">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center py-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>

        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}
