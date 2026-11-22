"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  IndianRupee,
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  Truck,
  Package,
  CreditCard,
  MapPin,
  CalendarDays,
  UserRound,
  RotateCcw,
  AlertTriangle,
  FileText,
} from "lucide-react";
import OrderGstInvoiceModal from "@/components/admin/OrderGstInvoiceModal";

const STORAGE_KEY = "bsv-admin-orders-demo";
const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-xs text-[#18181b] outline-none transition focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]/20";

const orderStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
const paymentStatuses = ["Pending", "Paid", "Partial", "Failed", "Refunded"];

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function StatusBadge({ status }) {
  const s = String(status || "Pending").toLowerCase();
  let cls = "bg-amber-50 text-amber-700 ring-amber-200";
  if (s === "paid" || s === "delivered" || s === "confirmed" || s === "active") {
    cls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (s === "partial" || s === "shipped" || s === "processing") {
    cls = "bg-blue-50 text-blue-700 ring-blue-200";
  } else if (s === "failed" || s === "cancelled") {
    cls = "bg-red-50 text-red-700 ring-red-200";
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Pending"}
    </span>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [paymentFilter, setPaymentFilter] = useState("All payments");
  const [dateFilter, setDateFilter] = useState("All dates");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState("");

  async function fetchOrders() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/orders?limit=100`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        const mapped = result.data.map((o) => {
          const addr =  o.customerSnapshot || {};
          const fullAddress = [addr.address || addr.line1, addr.landmark || addr.line2, addr.city, addr.state, addr.pincode || addr.postalCode]
            .filter(Boolean)
            .join(", ") || addr.addressLine1 || "—";
          return {
            id: o.orderNumber || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
            _id: o._id,
            customer: o.customerSnapshot?.name || addr.name || addr.fullName || "Customer",
            email: o.customerSnapshot?.email || addr.email || "—",
            phone: o.customerSnapshot?.phone || addr.phone || "—",
            date: o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : "",
            status: (o.status || "pending").charAt(0).toUpperCase() + (o.status || "pending").slice(1),
            paymentStatus: (o.paymentStatus || "pending").charAt(0).toUpperCase() + (o.paymentStatus || "pending").slice(1),
            paymentMethod: o.paymentProvider ? (o.paymentProvider === "cod" ? "Cash on Delivery" : "Online Payment") : "Online Payment",
            subtotal: Number(o.subtotal || o.total || 0),
            shipping: Number(o.shipping || 0),
            discount: Number(o.discount || 0),
            coupon: o.coupon || "",
            total: Number(o.total || 0),
            paidAmount: Number(o.paidAmount || (o.paymentStatus === "paid" ? o.total : 0)),
            dueAmount: Number(o.dueAmount || (o.paymentStatus === "paid" ? 0 : o.total)),
            address: fullAddress,
            shippingAddress: addr,
            paymentReference: o.paymentReference || "",
            trackingNumber: o.trackingNumber || "",
            notes: o.trackingNumber ? `Tracking: ${o.trackingNumber}` : (o.notes || ""),
            buyerGstin: o.buyerGstin || o.customerSnapshot?.buyerGstin || addr.buyerGstin || "",
            taxableAmount: Number(o.taxableAmount !== undefined ? o.taxableAmount : (o.subtotal || o.total || 0)),
            gstRate: Number(o.gstRate || 18),
            gstAmount: Number(o.gstAmount || 0),
            deliveredAt: o.deliveredAt || null,
            items: Array.isArray(o.items)
              ? o.items.map((it) => ({
                  name: it.title || it.name || "Product Item",
                  sku: it.sku || "—",
                  price: Number(it.price || it.unitPrice || 0),
                  quantity: Number(it.quantity || 1),
                  image: it.image || it.imageUrl || "",
                }))
              : [],
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Unable to load orders:", err);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) =>
        ["Pending", "Processing"].includes(o.status),
      ).length,
      shipped: orders.filter((o) => o.status === "Shipped").length,
      revenue: orders
        .filter((o) => o.paymentStatus === "Paid")
        .reduce((sum, o) => sum + Number(o.total || 0), 0),
    }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let result = orders.filter((order) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [
          order.id,
          order.customer,
          order.email,
          order.phone,
          ...(order.items || []).map((item) => item.name),
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q),
        );

      const matchesStatus =
        statusFilter === "All statuses" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "All payments" ||
        order.paymentStatus === paymentFilter;

      const daysAgo = (todayDate, orderDate) =>
        Math.floor(
          (new Date(`${todayDate}T12:00:00`) -
            new Date(`${orderDate}T12:00:00`)) /
            86400000,
        );

      const age = daysAgo(today, order.date);
      const matchesDate =
        dateFilter === "All dates" ||
        (dateFilter === "Last 7 days" && age >= 0 && age <= 7) ||
        (dateFilter === "Last 30 days" && age >= 0 && age <= 30);

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });

    result = [...result];
    if (sortBy === "oldest")
      result.sort((a, b) => a.date.localeCompare(b.date));
    else if (sortBy === "amount-high") result.sort((a, b) => b.total - a.total);
    else if (sortBy === "amount-low") result.sort((a, b) => a.total - b.total);
    else result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [orders, search, statusFilter, paymentFilter, dateFilter, sortBy]);

  console.log(filteredOrders)

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const filtersActive = Boolean(
    search ||
    statusFilter !== "All statuses" ||
    paymentFilter !== "All payments" ||
    dateFilter !== "All dates",
  );
 

  function clearFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setPaymentFilter("All payments");
    setDateFilter("All dates");
    setSortBy("newest");
    setPage(1);
  }

  async function saveOrder(updated) {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/orders/${updated._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: updated.status.toLowerCase(),
          paymentStatus: updated.paymentStatus.toLowerCase(),
          trackingNumber: updated.notes || "",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update order");
      setOrders((current) =>
        current.map((o) => (o.id === updated.id ? updated : o)),
      );
      setSelectedOrder(null);
      setToast(`Order ${updated.id} updated successfully.`);
    } catch (err) {
      console.error("Unable to update order:", err);
      setToast(err.message || "Could not update order.");
    }
  }

  async function confirmDelete() {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/orders/${deleteOrder._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to delete order");
      setOrders((current) => current.filter((o) => o.id !== deleteOrder.id));
      setDeleteOrder(null);
      setToast("Order deleted successfully.");
    } catch (err) {
      console.error("Unable to delete order:", err);
      setToast(err.message || "Could not delete order.");
    }
  }

  function exportCSV() {
    const columns = [
      "Order ID",
      "Customer",
      "Email",
      "Date",
      "Items",
      "Subtotal",
      "Shipping",
      "Total",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Address",
    ];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.customer,
      o.email,
      o.date,
      (o.items || []).map((i) => `${i.name} x${i.quantity}`).join("; "),
      o.subtotal,
      o.shipping,
      o.total,
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      o.address,
    ]);
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "bsv-store-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("CSV export prepared.");
  }

  function refreshOrders() {
    fetchOrders();
    setToast("Orders refreshed from server.");
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#18181b]">
            <ShoppingBag size={15} /> Store management
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181b] sm:text-4xl">
            Orders
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71717a]">
            Review purchases, track fulfilment, and manage payment statuses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCreateOrderOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black px-4 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
          >
            <Plus size={17} /> Place Order
          </button>
          <button
            onClick={refreshOrders}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e4e4e7] bg-white px-4 py-3 text-sm font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]"
          >
            <RotateCcw size={16} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black px-4 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5"
          >
            <Download size={17} /> Export CSV
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total orders",
            value: stats.total,
            icon: ShoppingBag,
            color: "bg-[#f4f4f5] text-[#18181b]",
          },
          {
            label: "Pending / processing",
            value: stats.pending,
            icon: Clock3,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Shipped orders",
            value: stats.shipped,
            icon: Truck,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "Paid order value",
            value: money(stats.revenue),
            icon: IndianRupee,
            color: "bg-emerald-50 text-emerald-700",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-[#e4e4e7] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${stat.color}`}
                >
                  <Icon size={19} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-400">Live</span>
              </div>
              <p className="mt-4 text-xs font-medium text-[#71717a] sm:text-sm">
                {stat.label}
              </p>
              <p className="mt-1 break-words text-xl font-bold text-[#18181b] sm:text-2xl">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm">
        <div className="border-b border-[#e4e4e7] p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#18181b]">
                All orders
              </h2>
              <p className="mt-1 text-xs text-[#71717a]">
                {filteredOrders.length} matching order
                {filteredOrders.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3 sm:w-72">
                <Search size={17} className="shrink-0 text-[#a1a1aa]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Order ID, customer, product..."
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#a1a1aa]"
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <button
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold ${showFilters || filtersActive ? "border-[#cba96e] bg-[#faf2e3] text-[#18181b]" : "border-[#e4e4e7] text-[#3f3f46] hover:bg-[#f4f4f5]"}`}
              >
                <SlidersHorizontal size={16} /> Filters{" "}
                <ChevronDown
                  size={14}
                  className={`transition ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 grid gap-3 border-t border-[#e4e4e7] pt-5 sm:grid-cols-2 xl:grid-cols-4">
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">
                      Order status
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option>All statuses</option>
                      {orderStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">
                      Payment status
                    </span>
                    <select
                      value={paymentFilter}
                      onChange={(e) => {
                        setPaymentFilter(e.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option>All payments</option>
                      {paymentStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">
                      Order date
                    </span>
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option>All dates</option>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">
                      Sort by
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="amount-high">Highest amount</option>
                      <option value="amount-low">Lowest amount</option>
                    </select>
                  </label>
                  {filtersActive && (
                    <button
                      onClick={clearFilters}
                      className="text-left text-xs font-bold text-[#18181b] hover:underline sm:col-span-2 xl:col-span-4"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!ready ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 animate-pulse rounded-xl bg-[#f8f3e9]"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f4f4f5] text-[#18181b]">
              <Search size={25} />
            </div>
            <h3 className="mt-4 font-serif text-xl font-bold text-[#18181b]">
              No orders found
            </h3>
            <p className="mt-2 text-sm text-[#71717a]">
              Try another search or clear your filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-[#d4d4d8] px-5 py-3 text-sm font-bold text-[#18181b] hover:bg-[#f4f4f5]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="bg-[#fcfaf6] text-[10px] uppercase tracking-[0.13em] text-[#71717a]">
                    <th className="px-5 py-4 font-bold">Order</th>
                    <th className="px-4 py-4 font-bold">Customer</th>
                    <th className="px-4 py-4 font-bold">Date</th>
                    <th className="px-4 py-4 font-bold">Total</th>
                    <th className="px-4 py-4 font-bold">Payment</th>
                    <th className="px-4 py-4 font-bold">Order status</th>
                    <th className="px-5 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {visibleOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="transition hover:bg-[#fafafa]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-[#18181b]">
                          {order.id}
                        </p>
                        <p className="mt-1 text-[10px] text-[#71717a]">
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-bold text-[#18181b]">
                          {order?.shippingAddress?.fullName}
                        </p>
                        <p className="mt-1 text-[10px] text-[#71717a]">
                          {order.email}
                        </p>
                        {order.buyerGstin && (
                          <span className="mt-1 inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-800 border border-blue-200">
                            GST: {order.buyerGstin}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#52525b]">
                        {dateLabel(order.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-[#18181b]">
                        <div>{money(order.total)}</div>
                        {order.dueAmount > 0 && (
                          <div className="mt-0.5 text-[10px] font-bold text-amber-700">
                            Due: {money(order.dueAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={order.paymentStatus} />
                        <p className="mt-1 text-[10px] text-[#71717a]">
                          {order.paymentMethod}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          {String(order.status).toLowerCase() === "delivered" && (
                            <button
                              title="Download GST Invoice"
                              aria-label={`Download Invoice for ${order.id}`}
                              onClick={() => setInvoiceOrder(order)}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition"
                            >
                              <Download size={15} />
                            </button>
                          )}
                          <button
                            title="View and update order"
                            aria-label={`View ${order.id}`}
                            onClick={() => setSelectedOrder(order)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e4e7] text-[#18181b] hover:bg-[#faf2e3]"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            title="Delete order"
                            aria-label={`Delete ${order.id}`}
                            onClick={() => setDeleteOrder(order)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#f0dada] text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 lg:hidden">
              {visibleOrders.map((order, i) => (
                <motion.article
                  key={order.id}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl border border-[#e4e4e7] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#18181b]">
                        {order.id}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#18181b]">
                        {order.customer}
                      </p>
                      <p className="mt-1 text-[10px] text-[#71717a]">
                        {dateLabel(order.date)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#18181b]">
                      {money(order.total)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                  <p className="mt-3 text-xs text-[#71717a]">
                    {order.items.length} item
                    {order.items.length === 1 ? "" : "s"} ·{" "}
                    {order.paymentMethod}
                  </p>
                  <div className="mt-4 flex gap-2 border-t border-[#e4e4e7] pt-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] py-2.5 text-xs font-bold text-[#18181b] hover:bg-[#faf2e3]"
                    >
                      <Eye size={14} /> View / Update
                    </button>
                    <button
                      onClick={() => setDeleteOrder(order)}
                      aria-label={`Delete ${order.id}`}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[#f0dada] text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#e4e4e7] bg-[#ffffff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-[#71717a]">
                Showing{" "}
                <strong>
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}
                </strong>{" "}
                of <strong>{filteredOrders.length}</strong> orders
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e4e7] px-3 text-xs font-semibold text-[#6f5c47] hover:bg-[#f4f4f5] disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span className="min-w-16 text-center text-xs font-semibold text-[#6f5c47]">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e4e7] px-3 text-xs font-semibold text-[#6f5c47] hover:bg-[#f4f4f5] disabled:opacity-40"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-4 py-3 text-xs leading-5 text-[#71717a]">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#18181b]" />
        <p>
          <strong className="text-zinc-900">Live Production Mode:</strong> Records are connected and synchronized with MongoDB.</p>
      </div>

      <AnimatePresence>
        {createOrderOpen && (
          <CreateOrderModal
            onClose={() => setCreateOrderOpen(false)}
            onCreated={(msg) => {
              setCreateOrderOpen(false);
              setToast(msg);
              fetchOrders();
            }}
          />
        )}

        {selectedOrder && (
          <OrderModal
            key={selectedOrder.id}
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onSave={saveOrder}
            onDownloadInvoice={(ord) => setInvoiceOrder(ord)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteOrder && (
          <DeleteModal
            key={deleteOrder.id}
            order={deleteOrder}
            onClose={() => setDeleteOrder(null)}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>

      <OrderGstInvoiceModal
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            role="status"
            className="fixed bottom-5 right-4 z-[150] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#d9c49f] bg-[#ffffff] px-4 py-3.5 text-sm font-semibold text-[#18181b] shadow-xl sm:bottom-7 sm:right-7"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={17} />
            </span>
            <span>{toast}</span>
            <button
              onClick={() => setToast("")}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function CreateOrderModal({ onClose, onCreated }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = (Number(price) || 0) * (Number(quantity) || 1);
  const paid = Math.max(0, Number(paidAmount) || 0);
  const due = Math.max(0, total - paid);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Customer name and phone number are required.");
      return;
    }
    if (total <= 0) {
      setError("Please specify a valid product price.");
      return;
    }
    if (paid > total) {
      setError("Paid amount cannot exceed total order price.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          address: address.trim(),
          items: [
            {
              name: productName.trim() || "Vastu Consultation / Product",
              price: Number(price),
              quantity: Number(quantity) || 1,
              lineTotal: total,
            },
          ],
          total,
          paidAmount: paid,
          paymentMethod,
          notes: notes.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to create order");
      onCreated(`Order ${result.data?.orderNumber || "placed"} created successfully. ${due > 0 ? "Remaining due: ₹" + due : ""}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#e4e4e7] bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between border-b border-[#e4e4e7] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#18181b]">Admin Assisted Order</span>
            <h3 className="mt-1 font-serif text-2xl font-bold text-[#18181b]">Place New Order</h3>
            <p className="text-xs text-[#71717a]">Place an order for an offline / direct client with partial payment support.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#71717a] hover:bg-[#e4e4e7]">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Customer details */}
          <div className="rounded-2xl bg-[#f4f4f5] p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#52525b]">Customer Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-medium text-[#18181b] outline-none focus:border-[#18181b]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit Mobile"
                  className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-medium text-[#18181b] outline-none focus:border-[#18181b]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Email (optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-medium text-[#18181b] outline-none focus:border-[#18181b]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Delivery Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State, Address"
                  className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-medium text-[#18181b] outline-none focus:border-[#18181b]"
                />
              </div>
            </div>
          </div>

          {/* Product and Price */}
          <div className="rounded-2xl border border-[#e4e4e7] p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#52525b]">Product / Service Details</h4>
            <div>
              <label className="text-[11px] font-bold text-[#52525b]">Item / Service Title *</label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Copper Swastik / Residential Consultation / Pyramid"
                className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-medium text-[#18181b] outline-none focus:border-[#18181b]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Unit Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="₹ Amount"
                  className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-bold text-[#18181b] outline-none focus:border-[#18181b]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-bold text-[#18181b] outline-none focus:border-[#18181b]"
                />
              </div>
            </div>
          </div>

          {/* Partial Payment Calculation */}
          <div className="rounded-2xl bg-[#f4f4f5] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#52525b]">
              <span>ORDER TOTAL:</span>
              <span className="text-base text-[#18181b]">₹{total.toLocaleString("en-IN")}</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#52525b]">
                Amount Paid Today (₹) <span className="text-amber-700 font-normal">(Partial or Full)</span>
              </label>
              <input
                type="number"
                min="0"
                max={total}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Enter amount paid (e.g. 600 of 1000)"
                className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-bold text-[#18181b] outline-none focus:border-[#18181b]"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaidAmount(String(total))}
                  className="text-[11px] font-semibold text-[#18181b] underline"
                >
                  Paid Full (₹{total})
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setPaidAmount("0")}
                  className="text-[11px] font-semibold text-[#18181b] underline"
                >
                  Unpaid / Full Due
                </button>
              </div>
            </div>

            {due > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-amber-100/80 p-2.5 text-xs font-bold text-amber-900">
                <span>REMAINING DUE BALANCE:</span>
                <span className="text-sm font-extrabold text-amber-950">₹{due.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#52525b]">Payment Mode</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {["Cash", "UPI / QR", "Online Payment"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-xl py-2 text-xs font-bold transition ${
                      paymentMethod === m
                        ? "bg-[#18181b] text-white shadow-sm"
                        : "border border-[#e4e4e7] bg-white text-[#6d5b46]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#52525b]">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order instructions / transaction notes"
                className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs text-[#18181b] outline-none focus:border-[#18181b]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e4e4e7] px-4 py-2 text-xs font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-zinc-900 hover:bg-black px-5 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? "Placing Order..." : "Confirm & Place Order"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OrderModal({ order, onClose, onSave, onDownloadInvoice }) {
  const isDelivered = String(order.status || "").toLowerCase() === "delivered";
  const isPaidOnline =
    (order.paymentStatus === "Paid" || order.paymentStatus === "paid") &&
    (order.paymentMethod?.toLowerCase().includes("online") ||
      order.paymentProvider !== "cod" ||
      Boolean(order.paymentReference || order.txnid));

  const [status, setStatus] = useState(order.status || "Pending");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || "Pending");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || order.notes || "");

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...order,
      status: isDelivered ? "Delivered" : status,
      paymentStatus: isPaidOnline ? (order.paymentStatus || "Paid") : paymentStatus,
      notes: trackingNumber,
      trackingNumber,
    });
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const discountVal = Number(order.discount || 0);
  const couponCode = order.coupon || "";
  const subtotalVal = Number(order.subtotal || order.total || 0);
  const shippingVal = Number(order.shipping || 0);
  const totalVal = Number(order.total || 0);
  const paidVal = Number(order.paidAmount || (order.paymentStatus === "Paid" ? totalVal : 0));
  const dueVal = Number(order.dueAmount || Math.max(0, totalVal - paidVal));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-[#e4e4e7] bg-[#ffffff] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f1e5d5] bg-gradient-to-r from-[#f4f4f5] to-[#ffffff] p-5 sm:px-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#18181b]">
              Full Order Details
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h3 className="font-serif text-xl font-bold text-[#18181b]">
                {order.id}
              </h3>
              <StatusBadge status={status} />
              <StatusBadge status={paymentStatus} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* Ordered Products Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e6532] mb-2.5">
              Ordered Products ({items.length} item{items.length === 1 ? "" : "s"})
            </h4>
            <div className="divide-y divide-[#f2e7d7] rounded-2xl border border-[#ebdcc7] bg-white overflow-hidden">
              {items.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8c7a67]">
                  No items specified for this order.
                </div>
              ) : (
                items.map((item, idx) => {
                  const itemImg = item.image || item.imageUrl || "";
                  const itemPrice = Number(item.price || item.unitPrice || 0);
                  const itemQty = Number(item.quantity || 1);
                  const lineTotal = itemPrice * itemQty;

                  return (
                    <div key={idx} className="flex items-center gap-3.5 p-3.5">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="h-14 w-14 rounded-xl border border-[#ede1ce] object-cover shrink-0"
                        />
                      ) : (
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#f7eedc] text-xl text-[#9b6324]">
                          <Package size={22} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-[#18181b] truncate">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#806d59]">
                          Unit Price: ₹{itemPrice.toLocaleString("en-IN")} × {itemQty}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-[#352212] shrink-0">
                        ₹{lineTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Price Breakdown: Subtotal, Discount, Coupon, Shipping, Total */}
          <div className="rounded-2xl border border-[#ebdcc7] bg-[#f4f4f5] p-4 text-xs space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-[#8e6532] text-[11px] border-b border-[#ebdcc7] pb-1.5">
              Financial Breakdown
            </h4>
            <div className="flex justify-between text-[#6f5e4c]">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-[#18181b]">₹{subtotalVal.toLocaleString("en-IN")}</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between items-center text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span>Discount Savings:</span>
                  {couponCode && (
                    <span className="rounded bg-emerald-200/70 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-900">
                      🏷️ {couponCode}
                    </span>
                  )}
                </span>
                <span>-₹{discountVal.toLocaleString("en-IN")}</span>
              </div>
            )}

            {couponCode && discountVal === 0 && (
              <div className="flex justify-between items-center text-[#7e5c2d]">
                <span>Coupon Applied:</span>
                <span className="font-mono font-bold bg-[#ead6b6] px-2 py-0.5 rounded text-[11px]">
                  {couponCode}
                </span>
              </div>
            )}

            <div className="flex justify-between text-[#6f5e4c]">
              <span>Shipping Charges:</span>
              <span className="font-semibold text-[#18181b]">
                {shippingVal > 0 ? `₹${shippingVal.toLocaleString("en-IN")}` : "FREE"}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold text-[#352212] border-t border-[#ebdcc7] pt-2">
              <span>Grand Total:</span>
              <span>₹{totalVal.toLocaleString("en-IN")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-[#ebdcc7]">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
                <span className="block text-[10px] font-bold uppercase">Paid Amount</span>
                <span className="text-sm font-extrabold">₹{paidVal.toLocaleString("en-IN")}</span>
              </div>
              <div className={`rounded-xl p-2 ${dueVal > 0 ? "bg-amber-100/80 text-amber-900" : "bg-gray-100 text-gray-700"}`}>
                <span className="block text-[10px] font-bold uppercase">Due Balance</span>
                <span className="text-sm font-extrabold">₹{dueVal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-[#ebdcc7] bg-white p-4 space-y-1.5">
              <h5 className="font-bold text-[#8e6532] uppercase text-[10px]">
                Customer Details
              </h5>
              <p className="font-bold text-sm text-[#18181b]">{order.customer}</p>
              <p className="text-[#6f5e4c]">📞 {order.phone || "—"}</p>
              <p className="text-[#6f5e4c]">✉️ {order.email || "—"}</p>
              <p className="text-[#6f5e4c]">💳 Mode: <span className="font-semibold">{order.paymentMethod}</span></p>
              {order.paymentReference && (
                <p className="text-[#7f6f5d] text-[11px]">Ref: <span className="font-mono">{order.paymentReference}</span></p>
              )}
              {order.buyerGstin && (
                <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-2 text-blue-900">
                  <span className="block font-bold text-[10px] uppercase tracking-wider text-blue-800">
                    Buyer Business GSTIN:
                  </span>
                  <span className="font-mono font-extrabold text-xs">{order.buyerGstin}</span>
                  <p className="mt-0.5 text-[10px] text-blue-700">Eligible for 18% Input Tax Credit</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#ebdcc7] bg-white p-4 space-y-1.5">
              <h5 className="font-bold text-[#8e6532] uppercase text-[10px]">
                Shipping Address
              </h5>
              <p className="text-[#18181b] leading-relaxed">
                {order.address || "No address provided"}
              </p>
            </div>
          </div>

          {/* Official GST Invoice Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#fdfaf3] border border-[#ebdcc7]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5eddd] text-[#8e6532] shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#18181b]">Official GST Tax Invoice</p>
                <p className="text-[11px] text-[#71717a]">
                  {isDelivered
                    ? "Order is delivered — full B2B/B2C GST tax invoice is generated."
                    : "Tax invoice unlocks automatically once order status is marked Delivered."}
                </p>
              </div>
            </div>

            {isDelivered ? (
              <button
                type="button"
                onClick={() => onDownloadInvoice(order)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:scale-105"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
                Locked until Delivery
              </span>
            )}
          </div>

          {/* Fulfillment Controls */}
          <form id="order-update-form" onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-[#f1e5d5]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold uppercase tracking-wider text-[#8e6532] text-[11px]">
                Update Order Status & Dispatch
              </h4>
              {isDelivered && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Delivered (Status Permanently Locked)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Fulfillment Status</label>
                <select
                  value={status}
                  disabled={isDelivered}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`mt-1 w-full rounded-xl border border-[#e4e4e7] px-3 py-2 text-xs font-semibold ${
                    isDelivered ? "bg-zinc-100 text-zinc-500 cursor-not-allowed" : "bg-white text-[#18181b]"
                  }`}
                >
                  {["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {isDelivered && (
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Order has been delivered. Status cannot be modified.
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#52525b]">Payment Status</label>
                {isPaidOnline ? (
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Paid Online (Locked)
                    </span>
                    <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-900">
                      Verified
                    </span>
                  </div>
                ) : (
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs font-semibold text-[#18181b]"
                  >
                    {["Pending", "Paid", "Partial", "Failed"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                {isPaidOnline && (
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Online payments cannot be modified.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#52525b]">Tracking Number / Dispatch Notes</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. DTDC-987654321 / Handed over to courier"
                className="mt-1 w-full rounded-xl border border-[#e4e4e7] bg-white px-3 py-2 text-xs text-[#18181b] outline-none focus:border-[#18181b]"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#f1e5d5] bg-[#f4f4f5] p-4 px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e4e4e7] px-4 py-2 text-xs font-semibold text-[#3f3f46] hover:bg-[#ffffff]"
          >
            Close
          </button>
          <button
            type="submit"
            form="order-update-form"
            className="rounded-xl bg-zinc-900 hover:bg-black px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
          >
            Save Order Updates
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteModal({ order, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-3xl border border-[#e4e4e7] bg-[#ffffff] p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <Trash2 size={22} />
        </div>
        <h3 className="mt-3 font-serif text-lg font-bold text-[#18181b]">
          Delete Order?
        </h3>
        <p className="mt-1 text-xs text-[#52525b]">
          Are you sure you want to delete order <span className="font-bold">{order.id}</span>? This action cannot be undone.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e4e4e7] py-2 text-xs font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
