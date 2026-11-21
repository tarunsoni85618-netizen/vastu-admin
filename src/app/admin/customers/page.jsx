
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users, Search, SlidersHorizontal, Download, Plus, Eye, Pencil,
  Trash2, X, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag,
  IndianRupee, UserRound, Mail, Phone, MapPin, CalendarDays,
  CheckCircle2, Clock3, UserCheck, UserX, RotateCcw, AlertTriangle,
} from "lucide-react";

const STORAGE_KEY = "bsv-admin-customers-demo";
const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3.5 py-3 text-sm text-[#18181b] outline-none transition placeholder:text-[#b0a08c] focus:border-[#18181b] focus:ring-4 focus:ring-[#18181b]/10";

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

function initials(name) {
  return String(name || "Customer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function statusClass(status) {
  return status === "Active"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-600";
}

function Avatar({ name, large = false }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-2xl border border-[#e9d6b5] bg-zinc-100 text-zinc-900 font-bold text-[#85531e] ${
        large ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm"
      }`}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${statusClass(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#27272a]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function CustomerModal({ customer, onClose, onSave, onToggleStatus }) {
  const [form, setForm] = useState(
    customer
      ? { ...customer }
      : {
          name: "",
          email: "",
          phone: "",
          city: "",
          state: "Rajasthan",
          address: "",
          status: "Active",
          notes: "",
          orders: 0,
          spent: 0,
        }
  );
  const [error, setError] = useState("");
  const [tab, setTab] = useState("profile");

  const editing = Boolean(customer);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Customer name and email are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.phone.trim() && !/^[+()\d\s-]{7,20}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#20170f]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-[#ffffff] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e7] bg-gradient-to-r from-[#fff8ea] to-white p-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={form.name || "New Customer"} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#18181b]">
                Customer management
              </p>
              <h2 id="customer-modal-title" className="mt-1 truncate font-serif text-xl font-bold text-[#18181b] sm:text-2xl">
                {editing ? form.name : "Add customer"}
              </h2>
              <p className="mt-1 text-xs text-[#71717a]">
                {editing ? customer.id : "Create a demo customer record"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close popup" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e4e4e7] text-[#52525b] hover:bg-[#f4f4f5]">
            <X size={19} />
          </button>
        </div>

        {editing && (
          <div className="flex gap-2 border-b border-[#e4e4e7] px-5 pt-3 sm:px-7">
            {[
              ["profile", "Profile details"],
              ["activity", "Customer activity"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`border-b-2 px-2 pb-3 pt-1 text-xs font-bold transition ${
                  tab === key
                    ? "border-[#18181b] text-[#18181b]"
                    : "border-transparent text-[#97856f] hover:text-[#18181b]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === "activity" && editing ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#e4e4e7] bg-white p-5">
                <ShoppingBag className="text-[#18181b]" size={22} />
                <p className="mt-4 text-xs text-[#71717a]">Total orders</p>
                <p className="mt-1 text-2xl font-bold text-[#18181b]">{customer.orders}</p>
              </div>
              <div className="rounded-2xl border border-[#e4e4e7] bg-white p-5">
                <IndianRupee className="text-[#18181b]" size={22} />
                <p className="mt-4 text-xs text-[#71717a]">Total spent</p>
                <p className="mt-1 text-2xl font-bold text-[#18181b]">{money(customer.spent)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#e4e4e7] bg-white p-5">
              <h3 className="font-serif text-lg font-bold text-[#18181b]">Account information</h3>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays size={17} className="text-[#18181b]" />
                  <span className="text-[#71717a]">Joined</span>
                  <span className="ml-auto font-semibold text-[#18181b]">{dateLabel(customer.joined)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserRound size={17} className="text-[#18181b]" />
                  <span className="text-[#71717a]">Account status</span>
                  <span className="ml-auto"><StatusBadge status={customer.status} /></span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={17} className="text-[#18181b]" />
                  <span className="text-[#71717a]">Location</span>
                  <span className="ml-auto text-right font-semibold text-[#18181b]">{[customer.city, customer.state].filter(Boolean).join(", ") || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Real Product Orders History */}
            <div className="mt-4 rounded-2xl border border-[#e4e4e7] bg-white p-5">
              <h3 className="font-serif text-base font-bold text-[#18181b]">Product Orders History</h3>
              {Array.isArray(customer.recentOrders) && customer.recentOrders.length > 0 ? (
                <div className="mt-3 divide-y divide-[#f4f4f5]">
                  {customer.recentOrders.map((ord) => (
                    <div key={ord._id || ord.orderNumber} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 text-xs">
                      <div>
                        <div className="font-bold text-[#18181b]">{ord.orderNumber}</div>
                        <div className="text-[#71717a] mt-0.5">{ord.itemsSummary}</div>
                        <div className="text-[10px] text-[#a1a1aa] mt-0.5">{dateLabel(ord.date ? new Date(ord.date).toISOString().slice(0, 10) : "")}</div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                        <span className="font-bold text-[#18181b] text-sm">{money(ord.total)}</span>
                        <div className="flex gap-1">
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-700 capitalize">{ord.status}</span>
                          <span className={`rounded-md px-2 py-0.5 font-semibold capitalize ${ord.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#71717a]">No product orders placed by this customer yet.</p>
              )}
            </div>

            {/* Real Consultations History */}
            <div className="mt-4 rounded-2xl border border-[#e4e4e7] bg-white p-5">
              <h3 className="font-serif text-base font-bold text-[#18181b]">Consultations & Appointments</h3>
              {Array.isArray(customer.recentConsultations) && customer.recentConsultations.length > 0 ? (
                <div className="mt-3 divide-y divide-[#f4f4f5]">
                  {customer.recentConsultations.map((c) => (
                    <div key={c._id || c.reference} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 text-xs">
                      <div>
                        <div className="font-bold text-[#18181b]">{c.reference}</div>
                        <div className="text-[#71717a] mt-0.5">{c.type} {c.mode ? `(${c.mode})` : ""}</div>
                        <div className="text-[10px] text-[#a1a1aa] mt-0.5">{dateLabel(c.date ? new Date(c.date).toISOString().slice(0, 10) : "")}</div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                        <span className="font-bold text-[#18181b] text-sm">{money(c.amount)}</span>
                        <div className="flex gap-1">
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-700 capitalize">{c.status}</span>
                          <span className={`rounded-md px-2 py-0.5 font-semibold capitalize ${c.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {c.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#71717a]">No consultations booked by this customer yet.</p>
              )}
            </div>
          </div>
        ) : (
          <form id="customer-form" onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={120} required className={inputClass} placeholder="Customer name" />
                </Field>
                <Field label="Email address" required>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={180} required className={inputClass} placeholder="customer@example.com" />
                </Field>
                <Field label="Phone number">
                  <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={20} className={inputClass} placeholder="+91 ..." />
                </Field>
                <Field label="Account status">
                  <select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </Field>
                <Field label="City">
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} maxLength={100} className={inputClass} placeholder="Jaipur" />
                </Field>
                <Field label="State">
                  <input value={form.state} onChange={(e) => update("state", e.target.value)} maxLength={100} className={inputClass} placeholder="Rajasthan" />
                </Field>
              </div>

              <Field label="Address">
                <textarea rows={2} maxLength={500} value={form.address} onChange={(e) => update("address", e.target.value)} className={`${inputClass} resize-y`} placeholder="Delivery address" />
              </Field>

              <Field label="Internal notes">
                <textarea rows={3} maxLength={1000} value={form.notes} onChange={(e) => update("notes", e.target.value)} className={`${inputClass} resize-y`} placeholder="Notes for your team (not visible to customers)" />
              </Field>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e4e7] bg-white px-5 py-4 sm:px-7">
              <p className="hidden text-xs text-[#71717a] sm:block">* Required fields</p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={onClose} className="rounded-xl border border-[#e4e4e7] px-4 py-3 text-sm font-semibold text-[#6f5c47] hover:bg-[#f4f4f5]">
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black px-5 py-3 text-sm font-bold text-white shadow-md hover:brightness-110">
                  <CheckCircle2 size={17} />
                  {editing ? "Save changes" : "Add customer"}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.section>
    </motion.div>
  );
}

function DeleteModal({ customer, onClose, onConfirm }) {
  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#20170f]/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md rounded-3xl border border-[#e4e4e7] bg-[#ffffff] p-6 shadow-2xl"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={24} />
        </div>
        <h3 className="mt-5 font-serif text-2xl font-bold text-[#18181b]">Delete customer?</h3>
        <p className="mt-2 text-sm leading-6 text-[#7e6a53]">
          Remove <strong>{customer.name}</strong> from the demo customer list? This does not delete a real customer account.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[#e4e4e7] px-4 py-3 text-sm font-semibold text-[#6f5c47] hover:bg-[#f4f4f5]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700">Delete customer</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [cityFilter, setCityFilter] = useState("All cities");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [toast, setToast] = useState("");

  async function fetchCustomers() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/customers?limit=100`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        const mapped = result.data.map((u) => {
          const addr = u.addresses?.[0] || {};
          const fullAddress = [addr.line1, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ") || u.address || "—";
          return {
            id: u.id || `CUS-${String(u._id).slice(-6).toUpperCase()}`,
            _id: u._id,
            name: u.name || "Customer",
            email: u.email || "—",
            phone: u.phone || "—",
            city: addr.city || u.city || "—",
            state: addr.state || u.state || "—",
            address: fullAddress,
            joined: u.joined ? new Date(u.joined).toISOString().slice(0, 10) : (u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ""),
            status: u.isActive !== false ? "Active" : "Inactive",
            orders: u.ordersCount || 0,
            spent: u.totalSpent || 0,
            notes: u.notes || "",
            recentOrders: u.recentOrders || [],
            recentConsultations: u.recentConsultations || [],
          };
        });
        setCustomers(mapped);
      }
    } catch (err) {
      console.error("Unable to load customers:", err);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.status === "Active").length,
    inactive: customers.filter((c) => c.status === "Inactive").length,
    spent: customers.reduce((sum, c) => sum + (Number(c.spent) || 0), 0),
  }), [customers]);

  const cities = useMemo(
    () => [...new Set(customers.map((c) => c.city).filter(Boolean))].sort(),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    let result = customers.filter((customer) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || [
        customer.id, customer.name, customer.email, customer.phone,
        customer.city, customer.state,
      ].some((value) => String(value || "").toLowerCase().includes(q));

      return (
        matchesSearch &&
        (statusFilter === "All statuses" || customer.status === statusFilter) &&
        (cityFilter === "All cities" || customer.city === cityFilter)
      );
    });

    result = [...result];

    if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "spent") result.sort((a, b) => b.spent - a.spent);
    else if (sortBy === "orders") result.sort((a, b) => b.orders - a.orders);
    else result.sort((a, b) => String(b.joined).localeCompare(String(a.joined)));

    return result;
  }, [customers, search, statusFilter, cityFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersActive = Boolean(search || statusFilter !== "All statuses" || cityFilter !== "All cities");

  function clearFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setCityFilter("All cities");
    setSortBy("newest");
    setPage(1);
  }

  async function saveCustomer(form) {
    const duplicate = customers.some(
      (c) => c.email.toLowerCase() === form.email.toLowerCase() && c.id !== selectedCustomer?.id
    );

    if (duplicate) {
      setToast("That email address is already in the customer list.");
      return;
    }

    if (selectedCustomer) {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
        await fetch(`${apiBase}/api/admin/customers/${selectedCustomer._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        });
      } catch (err) {
        console.error(err);
      }
      setCustomers((current) => current.map((c) =>
        c.id === selectedCustomer.id ? { ...c, ...form } : c
      ));
      setToast("Customer details updated.");
    } else {
      const id = `CUS-${Date.now().toString().slice(-7)}`;
      setCustomers((current) => [
        {
          ...form,
          id,
          joined: new Date().toISOString().slice(0, 10),
          orders: 0,
          spent: 0,
        },
        ...current,
      ]);
      setPage(1);
      setToast("Customer added successfully.");
    }

    setSelectedCustomer(null);
  }

  async function confirmDelete() {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      await fetch(`${apiBase}/api/admin/customers/${deleteCustomer._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setCustomers((current) => current.filter((c) => c.id !== deleteCustomer.id));
      setDeleteCustomer(null);
      setToast("Customer deleted successfully.");
    } catch (err) {
      console.error(err);
      setToast("Could not delete customer.");
    }
  }

  function toggleStatus(customer) {
    const status = customer.status === "Active" ? "Inactive" : "Active";
    setCustomers((current) => current.map((c) =>
      c.id === customer.id ? { ...c, status } : c
    ));
    setToast(`${customer.name} marked ${status.toLowerCase()}.`);
  }

  function exportCSV() {
    const columns = ["Customer ID", "Name", "Email", "Phone", "City", "State", "Joined", "Status", "Orders", "Total Spent", "Address", "Notes"];
    const rows = filteredCustomers.map((c) => [
      c.id, c.name, c.email, c.phone, c.city, c.state,
      c.joined, c.status, c.orders, c.spent, c.address, c.notes,
    ]);
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bsv-store-customers.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Customer CSV exported.");
  }

  function refreshCustomers() {
    fetchCustomers();
    setToast("Customers refreshed from server.");
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#18181b]">
            <Users size={15} /> Store management
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181b] sm:text-4xl">Customers</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71717a]">
            Manage customer profiles, contact information, activity, and account status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refreshCustomers} className="inline-flex items-center gap-2 rounded-xl border border-[#e4e4e7] bg-white px-4 py-3 text-sm font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]">
            <RotateCcw size={16} /> Refresh
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl border border-[#e4e4e7] bg-white px-4 py-3 text-sm font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setSelectedCustomer({ newCustomer: true })} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black px-4 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5">
            <Plus size={18} /> Add customer
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total customers", value: stats.total, icon: Users, color: "bg-[#f4f4f5] text-[#18181b]" },
          { label: "Active customers", value: stats.active, icon: UserCheck, color: "bg-emerald-50 text-emerald-700" },
          { label: "Inactive customers", value: stats.inactive, icon: UserX, color: "bg-slate-100 text-slate-600" },
          { label: "Total customer spend", value: money(stats.spent), icon: IndianRupee, color: "bg-amber-50 text-amber-700" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }} className="rounded-2xl border border-[#e4e4e7] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${stat.color}`}><Icon size={19} /></div>
                <span className="text-[10px] font-semibold text-zinc-400">Live</span>
              </div>
              <p className="mt-4 text-xs font-medium text-[#71717a] sm:text-sm">{stat.label}</p>
              <p className="mt-1 break-words text-xl font-bold text-[#18181b] sm:text-2xl">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm">
        <div className="border-b border-[#e4e4e7] p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#18181b]">All customers</h2>
              <p className="mt-1 text-xs text-[#71717a]">{filteredCustomers.length} matching customer{filteredCustomers.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3 sm:w-72">
                <Search size={17} className="shrink-0 text-[#a1a1aa]" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Name, email, phone, city..." className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#a1a1aa]" />
                {search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}
              </label>
              <button onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold ${showFilters || filtersActive ? "border-[#cba96e] bg-[#faf2e3] text-[#18181b]" : "border-[#e4e4e7] text-[#3f3f46] hover:bg-[#f4f4f5]"}`}>
                <SlidersHorizontal size={16} /> Filters <ChevronDown size={14} className={`transition ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-5 grid gap-3 border-t border-[#e4e4e7] pt-5 sm:grid-cols-3">
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">Account status</span>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
                      <option>All statuses</option><option>Active</option><option>Inactive</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">City</span>
                    <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1); }} className={inputClass}>
                      <option>All cities</option>{cities.map((city) => <option key={city}>{city}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">Sort by</span>
                    <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className={inputClass}>
                      <option value="newest">Newest customers</option>
                      <option value="name">Name: A–Z</option>
                      <option value="spent">Highest total spend</option>
                      <option value="orders">Most orders</option>
                    </select>
                  </label>
                  {filtersActive && <button onClick={clearFilters} className="text-left text-xs font-bold text-[#18181b] hover:underline sm:col-span-3">Clear all filters</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!ready ? (
          <div className="space-y-3 p-6">{[1, 2, 3, 4].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-[#f8f3e9]" />)}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f4f4f5] text-[#18181b]"><Search size={25} /></div>
            <h3 className="mt-4 font-serif text-xl font-bold text-[#18181b]">No customers found</h3>
            <p className="mt-2 text-sm text-[#71717a]">Try a different search or clear the filters.</p>
            <button onClick={clearFilters} className="mt-5 rounded-xl border border-[#d4d4d8] px-5 py-3 text-sm font-bold text-[#18181b] hover:bg-[#f4f4f5]">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="bg-[#fcfaf6] text-[10px] uppercase tracking-[0.13em] text-[#71717a]">
                    <th className="px-5 py-4 font-bold">Customer</th>
                    <th className="px-4 py-4 font-bold">Location</th>
                    <th className="px-4 py-4 font-bold">Joined</th>
                    <th className="px-4 py-4 font-bold">Orders</th>
                    <th className="px-4 py-4 font-bold">Total spend</th>
                    <th className="px-4 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {visibleCustomers.map((customer, i) => (
                    <motion.tr key={customer.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }} className="transition hover:bg-[#fafafa]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={customer.name} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#18181b]">{customer.name}</p>
                            <p className="mt-1 text-[11px] text-[#71717a]">{customer.email}</p>
                            <p className="mt-1 text-[10px] text-[#a1a1aa]">{customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-[#6f5c47]">{customer.city || "—"}</p>
                        <p className="mt-1 text-[10px] text-[#71717a]">{customer.state || ""}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#52525b]">{dateLabel(customer.joined)}</td>
                      <td className="px-4 py-4 text-sm font-bold text-[#18181b]">{customer.orders}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-[#18181b]">{money(customer.spent)}</td>
                      <td className="px-4 py-4"><button type="button" title="Click to toggle customer status" onClick={() => toggleStatus(customer)}><StatusBadge status={customer.status} /></button></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button title="View customer" aria-label={`View ${customer.name}`} onClick={() => setSelectedCustomer(customer)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e4e7] text-[#18181b] hover:bg-[#faf2e3]"><Eye size={15} /></button>
                          <button title="Edit customer" aria-label={`Edit ${customer.name}`} onClick={() => setSelectedCustomer(customer)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e4e7] text-[#18181b] hover:bg-[#faf2e3]"><Pencil size={15} /></button>
                          <button title="Delete customer" aria-label={`Delete ${customer.name}`} onClick={() => setDeleteCustomer(customer)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#f0dada] text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 lg:hidden">
              {visibleCustomers.map((customer, i) => (
                <motion.article key={customer.id} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl border border-[#e4e4e7] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={customer.name} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold text-[#18181b]">{customer.name}</p>
                      <p className="mt-1 break-all text-[11px] text-[#71717a]">{customer.email}</p>
                      <p className="mt-1 text-[10px] text-[#a1a1aa]">{customer.id}</p>
                    </div>
                    <button type="button" onClick={() => toggleStatus(customer)}><StatusBadge status={customer.status} /></button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#fdf9f1] p-3">
                    <div><p className="text-[10px] text-[#71717a]">Orders</p><p className="mt-1 text-sm font-bold text-[#18181b]">{customer.orders}</p></div>
                    <div><p className="text-[10px] text-[#71717a]">Total spend</p><p className="mt-1 text-sm font-bold text-[#18181b]">{money(customer.spent)}</p></div>
                    <div><p className="text-[10px] text-[#71717a]">Location</p><p className="mt-1 text-xs font-semibold text-[#18181b]">{customer.city || "—"}</p></div>
                    <div><p className="text-[10px] text-[#71717a]">Joined</p><p className="mt-1 text-xs font-semibold text-[#18181b]">{dateLabel(customer.joined)}</p></div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-[#e4e4e7] pt-3">
                    <button onClick={() => setSelectedCustomer(customer)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] py-2.5 text-xs font-bold text-[#18181b] hover:bg-[#faf2e3]"><Eye size={14} /> View / Edit</button>
                    <button onClick={() => setDeleteCustomer(customer)} aria-label={`Delete ${customer.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-[#f0dada] text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#e4e4e7] bg-[#ffffff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-[#71717a]">Showing <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)}</strong> of <strong>{filteredCustomers.length}</strong> customers</p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e4e7] px-3 text-xs font-semibold text-[#6f5c47] hover:bg-[#f4f4f5] disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
                <span className="min-w-16 text-center text-xs font-semibold text-[#6f5c47]">Page {currentPage} / {totalPages}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e4e7] px-3 text-xs font-semibold text-[#6f5c47] hover:bg-[#f4f4f5] disabled:opacity-40">Next <ChevronRight size={15} /></button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-4 py-3 text-xs leading-5 text-[#71717a]">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#18181b]" />
        <p><strong className="text-zinc-900">Live Production Mode:</strong> Records are connected and synchronized with MongoDB.</p>
      </div>

      <AnimatePresence>
        {selectedCustomer && (
          <CustomerModal
            key={selectedCustomer.id || "new-customer"}
            customer={selectedCustomer.newCustomer ? null : selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onSave={saveCustomer}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteCustomer && (
          <DeleteModal
            key={deleteCustomer.id}
            customer={deleteCustomer}
            onClose={() => setDeleteCustomer(null)}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} role="status" className="fixed bottom-5 right-4 z-[150] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#d9c49f] bg-[#ffffff] px-4 py-3.5 text-sm font-semibold text-[#18181b] shadow-xl sm:bottom-7 sm:right-7">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={17} /></span>
            <span>{toast}</span>
            <button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
