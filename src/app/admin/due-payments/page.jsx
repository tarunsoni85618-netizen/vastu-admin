"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ShoppingBag,
  GraduationCap,
  X,
  Phone,
  Mail,
  CalendarDays,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";

function money(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

function dateLabel(val) {
  if (!val) return "—";
  const date = new Date(val);
  return Number.isNaN(date.getTime())
    ? val
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function AdminDuePaymentsPage() {
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState({ totalDue: 0, totalItems: 0, dueOrdersCount: 0, dueEnrollmentsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [collectItem, setCollectItem] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  async function fetchDuePayments() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/due-payments`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success) {
        setItems(result.data || []);
        if (result.totals) setTotals(result.totals);
      }
    } catch (err) {
      console.error("Unable to load due payments:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDuePayments();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [item.refId, item.customerName, item.customerPhone, item.customerEmail, item.title].some((val) =>
          String(val || "").toLowerCase().includes(q)
        );
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, typeFilter]);

  function openCollectModal(item) {
    setCollectItem(item);
    setPaymentAmount(String(item.dueAmount || ""));
    setPaymentMethod("Cash");
    setPaymentNotes("");
  }

  async function handleRecordPayment(e) {
    e.preventDefault();
    if (!collectItem) return;

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setToast("Please enter a valid payment amount.");
      return;
    }

    try {
      setSubmittingPayment(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const endpoint =
        collectItem.type === "order"
          ? `${apiBase}/api/admin/orders/${collectItem._id}/record-payment`
          : `${apiBase}/api/admin/enrollments/${collectItem._id}/record-payment`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amt,
          method: paymentMethod,
          notes: paymentNotes || `Collected by admin in ${paymentMethod}`,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result?.error || "Failed to record payment");
      }

      setToast(`Payment of ₹${amt} recorded successfully.`);
      setCollectItem(null);
      await fetchDuePayments();
    } catch (err) {
      console.error("Payment recording error:", err);
      setToast(err.message || "Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  }

  function exportCSV() {
    const columns = ["Reference ID", "Type", "Customer Name", "Phone", "Email", "Item/Course", "Total Amount", "Paid Amount", "Due Amount", "Payment Status", "Date"];
    const rows = filteredItems.map((it) => [
      it.refId,
      it.type === "order" ? "Product Order" : "Training Enrollment",
      it.customerName,
      it.customerPhone,
      it.customerEmail,
      it.title,
      it.totalAmount,
      it.paidAmount,
      it.dueAmount,
      it.paymentStatus,
      it.date ? new Date(it.date).toLocaleDateString("en-IN") : "",
    ]);
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bsv-due-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Due payments exported to CSV.");
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm text-zinc-100 shadow-xl border border-zinc-800"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            <CreditCard size={14} /> Outstanding Balances
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Due & Partial Payments
          </h1>
          <p className="mt-1 max-w-xl text-xs text-zinc-500 sm:text-sm">
            Track outstanding dues, partial installments, and record payments for orders and training programs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              fetchDuePayments();
              setToast("Due payments refreshed from server.");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <RotateCcw size={15} /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Outstanding Due", val: money(totals.totalDue), icon: AlertCircle },
          { label: "Total Due Records", val: totals.totalItems, icon: CreditCard },
          { label: "Orders with Due", val: totals.dueOrdersCount, icon: ShoppingBag },
          { label: "Trainings with Due", val: totals.dueEnrollmentsCount, icon: GraduationCap },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{stat.label}</span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-800">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {stat.val}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, email, order ID, or training program..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-xs font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Filter:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400"
            >
              <option value="all">All Dues</option>
              <option value="order">Product Orders</option>
              <option value="training">Training Programs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3.5">Reference ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Customer / Student</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Remaining Due</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-zinc-500">
                    Loading due payments...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                    <p className="mt-3 font-serif text-lg font-bold text-zinc-900">No Outstanding Due Payments</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      All customer orders and student training enrollments are fully settled.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="transition hover:bg-zinc-50/75">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-zinc-900">
                      {item.refId}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.type === "order"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {item.type === "order" ? (
                          <>
                            <ShoppingBag size={11} /> Order
                          </>
                        ) : (
                          <>
                            <GraduationCap size={11} /> Training
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-zinc-900">{item.customerName}</div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{item.customerPhone}</span>
                        {item.customerEmail && (
                          <>
                            <span>·</span>
                            <span className="max-w-[140px] truncate">{item.customerEmail}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">{item.title}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-zinc-700">
                      {money(item.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold text-emerald-700">
                      {money(item.paidAmount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-amber-700">
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 border border-amber-200">
                        {money(item.dueAmount)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">
                      {dateLabel(item.date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        onClick={() => openCollectModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-black"
                      >
                        <CreditCard size={13} /> Collect Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect / Record Payment Modal */}
      <AnimatePresence>
        {collectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCollectItem(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-900">{collectItem.refId}</span>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-zinc-900">Record Due Payment</h3>
                  <p className="text-xs text-zinc-500">{collectItem.title}</p>
                </div>
                <button onClick={() => setCollectItem(null)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
                  <X size={18} />
                </button>
              </div>

              {/* Customer and Balance Overview */}
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-zinc-50 p-4 text-center border border-zinc-200">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500">Total Amount</span>
                  <p className="mt-1 font-bold text-zinc-900">{money(collectItem.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500">Already Paid</span>
                  <p className="mt-1 font-bold text-emerald-700">{money(collectItem.paidAmount)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-1 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800">Remaining Due</span>
                  <p className="mt-1 font-bold text-amber-900">{money(collectItem.dueAmount)}</p>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Payment Amount to Collect (₹)
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={collectItem.dueAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-8 pr-4 text-xs font-bold text-zinc-900 outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(collectItem.dueAmount))}
                      className="text-[11px] font-semibold text-zinc-900 underline hover:text-black"
                    >
                      Pay Full Due ({money(collectItem.dueAmount)})
                    </button>
                    {collectItem.dueAmount > 500 && (
                      <>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(String(Math.round(collectItem.dueAmount / 2)))}
                          className="text-[11px] font-semibold text-zinc-900 underline hover:text-black"
                        >
                          Pay Half ({money(Math.round(collectItem.dueAmount / 2))})
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Payment Mode</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {["Cash", "UPI / QR", "Online (PayU)"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`rounded-xl py-2 text-xs font-bold transition ${
                          paymentMethod === m
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Notes / Reference</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Paid in cash at office / UPI txn ID"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setCollectItem(null)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-black disabled:opacity-50"
                  >
                    {submittingPayment ? "Recording..." : `Confirm Payment (${money(paymentAmount || 0)})`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
