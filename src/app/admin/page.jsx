"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  CalendarDays,
  ArrowUpRight,
  TrendingUp,
  Clock3,
  Package,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const statusStyles = {
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Processing: "bg-blue-50 text-blue-700 border border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Shipped: "bg-violet-50 text-violet-700 border border-violet-200",
  New: "bg-amber-50 text-amber-700 border border-amber-200",
  Contacted: "bg-blue-50 text-blue-700 border border-blue-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Resolved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function AdminDashboard() {
  const [data, setData] = useState({
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      pendingEnquiries: 0,
    },
    salesData: [],
    topProducts: [],
    recentOrders: [],
    recentConsultations: [],
    recentTickets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
        const res = await fetch(`${apiBase}/api/admin/stats`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await res.json();
        if (result?.success) {
          setData(result);
        }
      } catch (err) {
        console.error("Unable to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = [
    {
      label: "Total Revenue",
      value: data.stats.totalRevenue,
      prefix: "₹",
      note: "From live orders & enrollments",
      icon: IndianRupee,
    },
    {
      label: "Total Orders",
      value: data.stats.totalOrders,
      prefix: "",
      note: "Live order count",
      icon: ShoppingBag,
    },
    {
      label: "Total Customers",
      value: data.stats.totalCustomers,
      prefix: "",
      note: "Registered users in MongoDB",
      icon: Users,
    },
    {
      label: "Pending Enquiries",
      value: data.stats.pendingEnquiries,
      prefix: "",
      note: "Requires attention",
      icon: CalendarDays,
    },
  ];

  const salesData = data.salesData.length > 0 ? data.salesData : [
    { month: "May", revenue: 0, orders: 0 },
    { month: "Jun", revenue: 0, orders: 0 },
    { month: "Jul", revenue: 0, orders: 0 },
    { month: "Aug", revenue: 0, orders: 0 },
    { month: "Sep", revenue: 0, orders: 0 },
    { month: "Oct", revenue: 0, orders: 0 },
  ];
  const maxRevenue = Math.max(...salesData.map((item) => item.revenue), 1000);

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Store overview
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Live operational statistics, store metrics, and customer activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-sm sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Live Data ·</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -3 }}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 transition group-hover:bg-zinc-900 group-hover:text-white">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                  Live
                </div>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-zinc-900 sm:text-[28px]">
                {stat.prefix || ""}
                {Number(stat.value).toLocaleString("en-IN")}
              </h2>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 border-t border-zinc-100 pt-3">
                <Clock3 size={13} className="text-zinc-400" />
                <span className="font-medium">{stat.note}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sales chart and top products */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-zinc-900">
                Sales Performance
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Monthly revenue performance from live store transactions
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-800 border border-zinc-200">
              <TrendingUp size={14} />
              <span>Revenue Trend</span>
            </div>
          </div>

          <div className="mt-8 flex items-end gap-3 sm:gap-5">
            {salesData.map((item, index) => (
              <div
                key={item.month + index}
                className="flex min-w-0 flex-1 flex-col items-center"
              >
                <span className="mb-2 hidden text-[10px] font-medium text-zinc-500 sm:block">
                  ₹{(item.revenue / 1000).toFixed(1)}k
                </span>
                <div className="flex h-44 w-full items-end overflow-hidden rounded-t-lg bg-zinc-100 sm:h-52">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max(4, (item.revenue / maxRevenue) * 100)}%`,
                    }}
                    transition={{
                      duration: 0.75,
                      delay: index * 0.08,
                      ease: "easeOut",
                    }}
                    className={`w-full rounded-t-lg ${
                      index === salesData.length - 1
                        ? "bg-zinc-900"
                        : "bg-zinc-400"
                    }`}
                  />
                </div>
                <span className="mt-3 text-[11px] font-semibold text-zinc-700">
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4">
            <span className="text-xs text-zinc-500">
              Total revenue in period
            </span>
            <span className="text-base font-bold text-zinc-900">
              {formatINR(
                salesData.reduce((sum, item) => sum + item.revenue, 0)
              )}
            </span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-zinc-900">
                Top Products
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Best-selling items by revenue
              </p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
              <Package size={18} />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-400">
                No product purchases recorded yet.
              </p>
            ) : (
              data.topProducts.map((product, index) => {
                const maxSold = Math.max(...data.topProducts.map((p) => p.sold), 1);

                return (
                  <div key={product.name + index}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {product.sold} units sold
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-zinc-900">
                        {formatINR(product.revenue)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(product.sold / maxSold) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.25 + index * 0.1 }}
                        className="h-full rounded-full bg-zinc-900"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>
      </div>

      {/* Recent orders */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-5 sm:px-7">
          <div>
            <h2 className="font-serif text-xl font-bold text-zinc-900">
              Recent Orders
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Latest transactions recorded in database
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-zinc-900 transition hover:underline"
          >
            View all orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <th className="px-6 py-3.5 font-semibold">Order ID</th>
                <th className="px-6 py-3.5 font-semibold">Customer</th>
                <th className="px-6 py-3.5 font-semibold">Product</th>
                <th className="px-6 py-3.5 font-semibold">Date</th>
                <th className="px-6 py-3.5 font-semibold">Amount</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-zinc-50/75"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-zinc-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="whitespace-nowrap text-xs font-semibold text-zinc-900">
                        {order.customer}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {order.email}
                      </p>
                    </td>
                    <td className="max-w-[220px] truncate px-6 py-4 text-xs text-zinc-700">
                      {order.product}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-zinc-500">
                      {order.date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-zinc-900">
                      {formatINR(order.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          statusStyles[order.status] ||
                          "bg-zinc-100 text-zinc-700 border border-zinc-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Consultations and Tickets Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Consultations */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-zinc-900">
                  Consultations
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Recent Vastu appointments
                </p>
              </div>
            </div>
            <Link
              href="/admin/consultations"
              className="text-xs font-bold text-zinc-900 hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentConsultations.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">
                No consultations booked yet.
              </p>
            ) : (
              data.recentConsultations.slice(0, 3).map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-zinc-900">
                      {enquiry.id}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        statusStyles[enquiry.status] ||
                        "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {enquiry.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-zinc-900">
                    {enquiry.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {enquiry.service}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-400">
                    {enquiry.date}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Tickets & Inquiries */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-zinc-900">
                  Support Tickets
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Recent inquiries & contacts
                </p>
              </div>
            </div>
            <Link
              href="/admin/tickets"
              className="text-xs font-bold text-zinc-900 hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentTickets.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">
                No support tickets received yet.
              </p>
            ) : (
              data.recentTickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-zinc-900">
                      {ticket.id}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        statusStyles[ticket.status] ||
                        "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-zinc-900">
                    {ticket.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {ticket.service}
                  </p>
                  <p className="mt-2 text-[10px] text-zinc-400">
                    {ticket.date}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
