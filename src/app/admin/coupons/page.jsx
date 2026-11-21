"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tag,
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Percent,
  IndianRupee,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-xs text-[#18181b] outline-none transition focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]/20";

function money(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

function formatDate(val) {
  if (!val) return "No expiry";
  const d = new Date(val);
  return isNaN(d.getTime())
    ? String(val)
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  async function fetchCoupons() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/coupons`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data)) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function copyCode(code) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    }
  }

  async function handleToggleStatus(coupon) {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/coupons/${coupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !coupon.isActive } : c))
        );
        setToast(`Coupon ${coupon.code} is now ${!coupon.isActive ? "Active" : "Inactive"}`);
      } else {
        throw new Error(data.error || "Failed to toggle status");
      }
    } catch (err) {
      setToast(err.message || "Could not update coupon");
    }
  }

  async function handleDelete(coupon) {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/coupons/${coupon._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
        setToast(`Coupon ${coupon.code} deleted successfully`);
        setDeletingCoupon(null);
      } else {
        throw new Error(data.error || "Failed to delete coupon");
      }
    } catch (err) {
      setToast(err.message || "Could not delete coupon");
    }
  }

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);

      const matchesType =
        typeFilter === "all" || c.discountType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, search, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter((c) => c.isActive).length,
      usedCount: coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0),
      percentageCount: coupons.filter((c) => c.discountType === "percentage").length,
    };
  }, [coupons]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-800">
              <Tag size={16} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
              Store Promotions
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#18181b] sm:text-3xl">
            Coupons & Discounts
          </h1>
          <p className="mt-0.5 text-xs text-[#71717a]">
            Manage promotional coupon codes, percentage discounts, flat offers, and minimum order limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCoupons}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#18181b] shadow-sm hover:bg-zinc-50 transition"
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-black transition"
          >
            <Plus size={16} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#e4e4e7] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717a]">Total Coupons</p>
          <p className="mt-1.5 text-2xl font-bold text-[#18181b]">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Active Coupons</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-900">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-[#e4e4e7] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717a]">Total Redemptions</p>
          <p className="mt-1.5 text-2xl font-bold text-[#18181b]">{stats.usedCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">% Off Campaigns</p>
          <p className="mt-1.5 text-2xl font-bold text-amber-900">{stats.percentageCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-[#e4e4e7] bg-white p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupon code or description..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-9 pr-3.5 py-2 text-xs outline-none focus:border-zinc-900 focus:bg-white"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e4e4e7] bg-[#fafafa] font-bold uppercase tracking-wider text-[#71717a]">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-4 py-3.5">Discount Offer</th>
                <th className="px-4 py-3.5">Min Order</th>
                <th className="px-4 py-3.5">Redemptions</th>
                <th className="px-4 py-3.5">Validity</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    Loading promotional coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    No coupons found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = c.endDate && new Date(c.endDate) < new Date();
                  const isLimitReached = c.usageLimit > 0 && c.usedCount >= c.usageLimit;

                  return (
                    <tr key={c._id} className="hover:bg-zinc-50/80 transition">
                      {/* Code */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(c.code)}
                            title="Copy code"
                            className="text-zinc-400 hover:text-zinc-700"
                          >
                            {copiedCode === c.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {c.description && (
                          <p className="mt-1 text-[11px] text-zinc-500 max-w-xs line-clamp-1">
                            {c.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Offer */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-zinc-900">
                          {c.discountType === "flat" ? (
                            <span className="text-emerald-700 font-extrabold">₹{c.discountValue} FLAT OFF</span>
                          ) : (
                            <span className="text-amber-800 font-extrabold">{c.discountValue}% OFF</span>
                          )}
                        </div>
                        {c.maxDiscountAmount > 0 && (
                          <p className="text-[10px] text-zinc-500">
                            Up to ₹{c.maxDiscountAmount.toLocaleString("en-IN")}
                          </p>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="px-4 py-4 text-zinc-700 font-semibold">
                        {c.minOrderAmount > 0 ? money(c.minOrderAmount) : "No minimum"}
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-4">
                        <span className="font-bold text-zinc-900">{c.usedCount || 0}</span>
                        <span className="text-zinc-400"> / {c.usageLimit > 0 ? c.usageLimit : "∞"}</span>
                        {isLimitReached && (
                          <span className="block text-[9px] font-bold text-red-600 uppercase">Limit reached</span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="px-4 py-4 text-zinc-600">
                        <div>{c.endDate ? formatDate(c.endDate) : "Never expires"}</div>
                        {isExpired && (
                          <span className="inline-block mt-0.5 rounded bg-red-50 text-red-700 font-bold text-[9px] px-1.5 py-0.5">
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset transition ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100"
                              : "bg-zinc-100 text-zinc-600 ring-zinc-300 hover:bg-zinc-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-emerald-600" : "bg-zinc-400"}`} />
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingCoupon(c)}
                            title="Edit coupon"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingCoupon(c)}
                            title="Delete coupon"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {(createModalOpen || editingCoupon) && (
          <CouponFormModal
            coupon={editingCoupon}
            onClose={() => {
              setCreateModalOpen(false);
              setEditingCoupon(null);
            }}
            onSaved={(saved, isNew) => {
              if (isNew) {
                setCoupons((prev) => [saved, ...prev]);
                setToast(`Coupon ${saved.code} created successfully!`);
              } else {
                setCoupons((prev) => prev.map((c) => (c._id === saved._id ? saved : c)));
                setToast(`Coupon ${saved.code} updated successfully!`);
              }
              setCreateModalOpen(false);
              setEditingCoupon(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <Trash2 size={22} />
              </div>
              <h3 className="mt-3 font-serif text-lg font-bold text-zinc-900">
                Delete Coupon?
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Are you sure you want to permanently delete coupon{" "}
                <span className="font-bold text-zinc-900 font-mono">{deletingCoupon.code}</span>?
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingCoupon(null)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingCoupon)}
                  className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-5 right-4 z-50 flex items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-xs font-semibold text-zinc-900 shadow-xl"
          >
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{toast}</span>
            <button onClick={() => setToast("")}>
              <X size={14} className="text-zinc-400 hover:text-zinc-700" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CouponFormModal({ coupon, onClose, onSaved }) {
  const isEditing = Boolean(coupon);
  const [code, setCode] = useState(coupon?.code || "");
  const [description, setDescription] = useState(coupon?.description || "");
  const [discountType, setDiscountType] = useState(coupon?.discountType || "percentage");
  const [discountValue, setDiscountValue] = useState(coupon?.discountValue ?? "");
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.minOrderAmount ?? 0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(coupon?.maxDiscountAmount ?? 0);
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit ?? 0);
  const [startDate, setStartDate] = useState(
    coupon?.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    coupon?.endDate ? new Date(coupon.endDate).toISOString().slice(0, 10) : ""
  );
  const [isActive, setIsActive] = useState(coupon?.isActive !== false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Coupon code is required");
      return;
    }
    if (discountValue === "" || Number(discountValue) < 0) {
      setError("Please specify a valid discount value");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
        maxDiscountAmount: Math.max(0, Number(maxDiscountAmount) || 0),
        usageLimit: Math.max(0, Number(usageLimit) || 0),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive,
      };

      const url = isEditing
        ? `${apiBase}/api/admin/coupons/${coupon._id}`
        : `${apiBase}/api/admin/coupons`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save coupon");
      }

      onSaved(data.data, !isEditing);
    } catch (err) {
      setError(err.message || "Something went wrong saving the coupon");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-800">
              <Tag size={16} />
            </div>
            <h3 className="font-serif text-lg font-bold text-zinc-900">
              {isEditing ? `Edit Coupon: ${coupon.code}` : "Create New Coupon"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Coupon Code */}
          <div>
            <label className="block text-xs font-bold text-zinc-700">Coupon Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. VASTU10, DIWALI2026, SHUBH200"
              required
              className={`${inputClass} font-mono uppercase font-bold text-sm`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700">Description / Promotion Note</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10% instant off on all orders above ₹1,999"
              className={inputClass}
            />
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className={inputClass}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">
                {discountType === "percentage" ? "Percentage Value (%)" : "Flat Amount (₹)"} *
              </label>
              <input
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g. 15" : "e.g. 250"}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700">Min. Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0 for no minimum"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Max Discount Cap (₹)</label>
              <input
                type="number"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="0 for unlimited"
                className={inputClass}
              />
            </div>
          </div>

          {/* Usage Limit & Validity Dates */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-zinc-700">Usage Limit</label>
              <input
                type="number"
                min="0"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="0 for unlimited"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700">Expiry Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 p-3">
            <div>
              <p className="text-xs font-bold text-zinc-900">Enable Coupon</p>
              <p className="text-[10px] text-zinc-500">Allow customers to use this promo code at checkout</p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-zinc-900"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-black transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
