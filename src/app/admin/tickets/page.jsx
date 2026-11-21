"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  Trash2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  UserRound,
  RotateCcw,
  AlertTriangle,
  Send,
  CalendarDays,
  Tag,
} from "lucide-react";

const PAGE_SIZE = 8;
const ticketStatuses = ["All", "New", "In Progress", "Contacted", "Resolved", "Closed"];

const statusColors = {
  New: "bg-amber-50 text-amber-700 border-amber-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-purple-50 text-purple-700 border-purple-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [viewTicket, setViewTicket] = useState(null);
  const [deleteTicket, setDeleteTicket] = useState(null);
  const [toast, setToast] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function fetchTickets() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/tickets`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        setTickets(result.data);
      }
    } catch (err) {
      console.error("Unable to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      newTickets: tickets.filter((t) => t.status === "New").length,
      inProgress: tickets.filter((t) => ["In Progress", "Contacted"].includes(t.status)).length,
      resolved: tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let result = tickets.filter((ticket) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [ticket.ticketId, ticket.name, ticket.email, ticket.phone, ticket.service, ticket.message].some(
          (v) => String(v || "").toLowerCase().includes(q)
        );

      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result = [...result];
    if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [tickets, search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleTickets = filteredTickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function updateStatus(ticketId, newStatus, notes = "") {
    try {
      setUpdatingStatus(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, notes }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update ticket");

      setTickets((current) =>
        current.map((t) => (t._id === ticketId ? { ...t, status: newStatus, notes } : t))
      );
      if (viewTicket?._id === ticketId) {
        setViewTicket((prev) => ({ ...prev, status: newStatus, notes }));
      }
      setToast(`Ticket status updated to ${newStatus}.`);
    } catch (err) {
      console.error("Status update error:", err);
      setToast(err.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function confirmDelete() {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/tickets/${deleteTicket._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to delete ticket");

      setTickets((current) => current.filter((t) => t._id !== deleteTicket._id));
      setDeleteTicket(null);
      if (viewTicket?._id === deleteTicket._id) setViewTicket(null);
      setToast("Ticket deleted successfully.");
    } catch (err) {
      console.error("Delete ticket error:", err);
      setToast(err.message || "Could not delete ticket.");
    }
  }

  function exportCSV() {
    const columns = ["Ticket ID", "Customer Name", "Phone", "Email", "Service / Subject", "Status", "Date", "Message", "Notes"];
    const rows = filteredTickets.map((t) => [
      t.ticketId || "",
      t.name || "",
      t.phone || "",
      t.email || "",
      t.service || "",
      t.status || "New",
      t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "",
      t.message || "",
      t.notes || "",
    ]);

    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bsv-tickets-inquiries.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Tickets exported to CSV.");
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
            className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-[#18181b] px-4 py-3 text-sm text-[#f5ebd8] shadow-xl"
          >
            <CheckCircle2 size={16} className="text-[#e2b067]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#18181b]">
            <MessageSquare size={15} /> Support & Inquiries
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181b] sm:text-4xl">
            Tickets & Inquiries
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71717a]">
            Track customer queries, contact form submissions, and support requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              fetchTickets();
              setToast("Tickets refreshed from server.");
            }}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Tickets", val: stats.total, icon: MessageSquare, color: "text-[#18181b]" },
          { label: "New / Unread", val: stats.newTickets, icon: Clock, color: "text-amber-700" },
          { label: "In Progress", val: stats.inProgress, icon: Send, color: "text-blue-700" },
          { label: "Resolved", val: stats.resolved, icon: CheckCircle2, color: "text-emerald-700" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#71717a]">{item.label}</span>
                <Icon size={18} className={item.color} />
              </div>
              <p className={`mt-3 text-2xl font-bold sm:text-3xl ${item.color}`}>{item.val}</p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#e4e4e7] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a89885]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ticket ID, customer name, phone, or message..."
              className="w-full rounded-xl border border-[#e4e4e7] bg-[#fafafa] py-2.5 pl-10 pr-4 text-sm text-[#18181b] outline-none transition placeholder:text-[#a89885] focus:border-[#18181b] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#71717a]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-[#e4e4e7] bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#18181b] outline-none"
              >
                {ticketStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#71717a]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-[#e4e4e7] bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#18181b] outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-[#e4e4e7] bg-[#fafafa] text-[11px] font-bold uppercase tracking-wider text-[#71717a]">
                <th className="px-5 py-4">Ticket ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Subject / Service</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#71717a]">
                    Loading tickets from database...
                  </td>
                </tr>
              ) : visibleTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <MessageSquare size={36} className="mx-auto text-[#cbb89e]" />
                    <p className="mt-3 font-serif text-lg font-bold text-[#18181b]">No tickets found</p>
                    <p className="mt-1 text-xs text-[#71717a]">
                      {search || statusFilter !== "All"
                        ? "No enquiries match your current filters."
                        : "When customers submit contact enquiries, they will appear here in real time."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleTickets.map((t) => (
                  <tr key={t._id} className="transition hover:bg-[#f4f4f5]">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-[#18181b]">
                      {t.ticketId || `TCK-${String(t._id).slice(-6).toUpperCase()}`}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-[#18181b]">{t.name}</div>
                      <div className="flex items-center gap-2 text-xs text-[#71717a]">
                        <span>{t.phone}</span>
                        {t.email && (
                          <>
                            <span>·</span>
                            <span>{t.email}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-4 text-sm text-[#18181b]">
                      <span className="font-semibold">{t.service || "General Inquiry"}</span>
                      {t.message && (
                        <p className="truncate text-xs text-[#71717a]">{t.message}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-[#71717a]">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          statusColors[t.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {t.status || "New"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewTicket(t)}
                          className="rounded-lg p-2 text-[#7d6b54] hover:bg-[#f2e7d3]"
                          title="View Details"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteTicket(t)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete Ticket"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e4e4e7] px-5 py-4 text-xs text-[#71717a]">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#e4e4e7] p-2 hover:bg-[#fafafa] disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-[#e4e4e7] p-2 hover:bg-[#fafafa] disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View & Update Ticket Modal */}
      <AnimatePresence>
        {viewTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewTicket(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#e4e4e7] bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between border-b border-[#e4e4e7] pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-[#18181b]">
                    {viewTicket.ticketId || `TCK-${String(viewTicket._id).slice(-6).toUpperCase()}`}
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-[#18181b]">
                    {viewTicket.service || "Customer Inquiry"}
                  </h3>
                  <p className="text-xs text-[#71717a]">
                    Received on {new Date(viewTicket.createdAt || Date.now()).toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => setViewTicket(null)}
                  className="rounded-xl p-2 text-[#71717a] hover:bg-[#e4e4e7]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Customer Info */}
              <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-[#f4f4f5] p-4 text-xs">
                <div>
                  <span className="font-semibold text-[#71717a]">Customer Name</span>
                  <p className="mt-1 font-bold text-[#18181b]">{viewTicket.name}</p>
                </div>
                <div>
                  <span className="font-semibold text-[#71717a]">Phone Number</span>
                  <p className="mt-1 font-bold text-[#18181b]">
                    <a href={`tel:${viewTicket.phone}`} className="text-[#18181b] hover:underline">
                      {viewTicket.phone}
                    </a>
                  </p>
                </div>
                {viewTicket.email && (
                  <div className="col-span-2">
                    <span className="font-semibold text-[#71717a]">Email Address</span>
                    <p className="mt-1 font-bold text-[#18181b]">
                      <a href={`mailto:${viewTicket.email}`} className="text-[#18181b] hover:underline">
                        {viewTicket.email}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="mt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#71717a]">
                  Inquiry Message
                </span>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-[#e4e4e7] bg-[#ffffff] p-4 text-sm leading-relaxed text-[#18181b]">
                  {viewTicket.message || "No additional message provided."}
                </div>
              </div>

              {/* Status Update Control */}
              <div className="mt-6 border-t border-[#e4e4e7] pt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#71717a]">
                  Update Status
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["New", "In Progress", "Contacted", "Resolved", "Closed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => updateStatus(viewTicket._id, st, viewTicket.notes)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        viewTicket.status === st
                          ? "bg-[#18181b] text-white shadow-md"
                          : "border border-[#e4e4e7] bg-[#f4f4f5] text-[#6d5b46] hover:bg-[#f2e7d3]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewTicket(null)}
                  className="rounded-xl border border-[#e4e4e7] bg-white px-5 py-2.5 text-sm font-semibold text-[#574632] hover:bg-[#f4f4f5]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTicket(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-[#e4e4e7] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#18181b]">Delete Ticket</h3>
              </div>
              <p className="mt-3 text-sm text-[#52525b]">
                Are you sure you want to delete ticket{" "}
                <span className="font-mono font-bold text-[#18181b]">{deleteTicket.ticketId}</span> for{" "}
                <span className="font-bold text-[#18181b]">{deleteTicket.name}</span>? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTicket(null)}
                  className="rounded-xl border border-[#e4e4e7] px-4 py-2.5 text-xs font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
