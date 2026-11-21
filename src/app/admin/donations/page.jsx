"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  IndianRupee,
  Phone,
  Mail,
  UserRound,
  FileText,
  CalendarDays,
  Sparkles,
  Eye,
  X,
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

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonations: 0, paidCount: 0, totalRaised: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [viewDonation, setViewDonation] = useState(null);

  async function fetchDonations() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/donations`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success) {
        setDonations(result.data || []);
        if (result.stats) setStats(result.stats);
      }
    } catch (err) {
      console.error("Unable to load donations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [d.donationId, d.donorName, d.donorPhone, d.donorEmail, d.pan, d.message].some((val) =>
          String(val || "").toLowerCase().includes(q)
        );
      const matchesStatus = statusFilter === "all" || d.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [donations, search, statusFilter]);

  function exportCSV() {
    const columns = ["Donation ID", "Donor Name", "Phone", "Email", "Amount", "Status", "PAN", "Message", "Date"];
    const rows = filteredDonations.map((d) => [
      d.donationId,
      d.donorName,
      d.donorPhone,
      d.donorEmail,
      d.amount,
      d.paymentStatus,
      d.pan || "",
      d.message || "",
      d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "",
    ]);
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "choti-khushi-ngo-donations.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Donations exported to CSV.");
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
            <Heart size={14} className="text-rose-500" /> Social Initiative
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Choti Khushi NGO - Bird Feeding
          </h1>
          <p className="mt-1 max-w-xl text-xs text-zinc-500 sm:text-sm">
            Live donor records, tax receipts, and contributions for bird welfare & grain feeding.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              fetchDonations();
              setToast("Donations refreshed from server.");
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
          { label: "Total Funds Raised", val: money(stats.totalRaised), icon: IndianRupee },
          { label: "Successful Donations", val: stats.paidCount, icon: Heart },
          { label: "Total Donor Entries", val: stats.totalDonations, icon: Sparkles },
          { label: "NGO Mission", val: "Feeding Birds & Care", icon: Heart, isText: true },
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
              <p className={`mt-3 font-bold tracking-tight text-zinc-900 ${stat.isText ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"}`}>
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
              placeholder="Search by donor name, phone, email, PAN, or receipt ID..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-xs font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-zinc-400"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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
                <th className="px-5 py-3.5">Receipt ID</th>
                <th className="px-5 py-3.5">Donor Name</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                    Loading donations...
                  </td>
                </tr>
              ) : filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Heart size={36} className="mx-auto text-zinc-300" />
                    <p className="mt-3 font-serif text-lg font-bold text-zinc-900">No Donations Found</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      When donors contribute to Choti Khushi NGO, records will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDonations.map((item) => (
                  <tr key={item._id} className="transition hover:bg-zinc-50/75">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-zinc-900">
                      {item.donationId}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-zinc-900">{item.donorName}</div>
                      {item.pan && <div className="text-[11px] font-mono text-zinc-500">PAN: {item.pan}</div>}
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-600">
                      <div className="font-medium text-zinc-800">{item.donorPhone}</div>
                      {item.donorEmail && <div className="text-zinc-500">{item.donorEmail}</div>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-zinc-900">
                      {money(item.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.paymentStatus === "pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {item.paymentStatus === "paid" ? "Paid" : item.paymentStatus === "pending" ? "Pending" : "Failed"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">
                      {dateLabel(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        onClick={() => setViewDonation(item)}
                        className="rounded-lg border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-100"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {viewDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewDonation(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-900">{viewDonation.donationId}</span>
                  <h3 className="mt-1 font-serif text-xl font-bold text-zinc-900">Donation Details</h3>
                  <p className="text-xs text-zinc-500">Choti Khushi NGO - Feeding Work for Birds</p>
                </div>
                <button onClick={() => setViewDonation(null)} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl bg-zinc-50 p-4 text-xs border border-zinc-200">
                <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                  <span className="font-semibold text-zinc-500">Donor Name:</span>
                  <span className="font-bold text-zinc-900">{viewDonation.donorName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                  <span className="font-semibold text-zinc-500">Phone Number:</span>
                  <span className="font-bold text-zinc-900">{viewDonation.donorPhone}</span>
                </div>
                {viewDonation.donorEmail && (
                  <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                    <span className="font-semibold text-zinc-500">Email:</span>
                    <span className="font-bold text-zinc-900">{viewDonation.donorEmail}</span>
                  </div>
                )}
                {viewDonation.pan && (
                  <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                    <span className="font-semibold text-zinc-500">PAN Number:</span>
                    <span className="font-mono font-bold text-zinc-900">{viewDonation.pan}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                  <span className="font-semibold text-zinc-500">Amount Donated:</span>
                  <span className="text-base font-extrabold text-emerald-700">{money(viewDonation.amount)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                  <span className="font-semibold text-zinc-500">Payment Status:</span>
                  <span className="font-bold text-zinc-900 uppercase">{viewDonation.paymentStatus}</span>
                </div>
                {viewDonation.txnid && (
                  <div className="flex justify-between border-b border-zinc-200/80 pb-2">
                    <span className="font-semibold text-zinc-500">Transaction Ref:</span>
                    <span className="font-mono text-[10px] text-zinc-700">{viewDonation.txnid}</span>
                  </div>
                )}
                {viewDonation.message && (
                  <div className="pt-1">
                    <span className="font-semibold text-zinc-500">Donor Message / Prayer:</span>
                    <p className="mt-1 italic text-zinc-800">{viewDonation.message}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewDonation(null)}
                  className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
