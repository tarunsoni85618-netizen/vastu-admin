"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Clock,
  CheckCircle2,
  UserRound,
  Phone,
  Mail,
  MapPin,
  CalendarCheck,
  RotateCcw,
  AlertTriangle,
  Layers,
  Sparkles,
  Check,
  FileText,
  Printer,
  UploadCloud,
  PhoneCall,
  Receipt,
  Loader2,
  ExternalLink,
} from "lucide-react";
import GstInvoiceModal from "@/components/admin/GstInvoiceModal";

const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-xs text-[#18181b] outline-none transition focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]/20";

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
  if (s === "paid" || s === "confirmed" || s === "completed" || s === "active") {
    cls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (s === "partial" || s === "scheduled" || s === "processing") {
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

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-[#27272a]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const bookingStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
const paymentStatuses = ["Pending", "Paid", "Refunded", "Failed"];

export default function AdminConsultationPage() {
  const [activeTab, setActiveTab] = useState("bookings"); // "bookings" | "services" | "pricing"

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [dateFilter, setDateFilter] = useState("All dates");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteBooking, setDeleteBooking] = useState(null);
  const [viewBooking, setViewBooking] = useState(null);
  const [viewFormModal, setViewFormModal] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toast, setToast] = useState("");

  // Services state
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteService, setDeleteService] = useState(null);
  const [serviceUploading, setServiceUploading] = useState(false);

  // Pricing Matrix state
  const [pricing, setPricing] = useState({
    videoCall: 2100,
    officeVisit: 2100,
    withinJaipur: 11000,
    within500km: 21000,
    above500km: 31000,
    within200km: 21000,
    within200_300km: 21000,
    above300km: 31000,
    gstRate: 18,
    gstin: "08AAAAA0000A1Z5",
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);

  const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");

  // 1. Fetch Bookings
  async function fetchBookings() {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/admin/consultations`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        const mapped = result.data.map((c) => ({
          id: c.reference || `CON-${String(c._id).slice(-6).toUpperCase()}`,
          _id: c._id,
          reference: c.reference || "",
          name: c.name || "Customer",
          email: c.email || "—",
          phone: c.phone || "—",
          type: c.type || "Residential Vastu",
          service: c.service || c.type || "Residential Vastu",
          mode: c.consultationMode === "video_call" ? "Video Call (Online)" : c.consultationMode === "office_visit" ? "Office Visit (Jaipur)" : "On-Site Visit",
          consultationMode: c.consultationMode,
          distanceTier: c.distanceTier,
          date: c.date ? new Date(c.date).toISOString().slice(0, 10) : "",
          time: c.time || "11:00 AM",
          scheduledDate: c.scheduledDate ? new Date(c.scheduledDate).toISOString().slice(0, 10) : "",
          scheduledTime: c.scheduledTime || "",
          scheduledByAdmin: Boolean(c.scheduledByAdmin),
          status: (c.status || "pending").charAt(0).toUpperCase() + (c.status || "pending").slice(1),
          paymentStatus: (c.paymentStatus || "pending").charAt(0).toUpperCase() + (c.paymentStatus || "pending").slice(1),
          amount: Number(c.amount || 0),
          fee: Number(c.amount || 0),
          gstRate: c.gstRate ?? 18,
          taxableAmount: c.taxableAmount,
          gstAmount: c.gstAmount,
          txnid: c.txnid || "",
          location: c.propertyAddress || c.address || "Jaipur, Rajasthan",
          address: c.propertyAddress || c.address || "",
          notes: c.clientConcerns || c.notes || "",
          clientId: c.clientId || "",
          documentNo: c.documentNo || "",
          fatherOrSpouseName: c.fatherOrSpouseName || "",
          residentialAddress: c.residentialAddress || "",
          state: c.state || "Rajasthan",
          occupation: c.occupation || "",
          propertyOwnerName: c.propertyOwnerName || "",
          propertyAddress: c.propertyAddress || "",
          propertyType: c.propertyType || "",
          approximateArea: c.approximateArea || "",
          numberOfFloors: c.numberOfFloors || "",
          propertyPlanProvided: c.propertyPlanProvided,
          clientGstin: c.clientGstin || "",
          googleMapsLink: c.googleMapsLink || "",
          distanceKm: c.distanceKm !== undefined ? c.distanceKm : null,
          familyMembers: c.familyMembers || [],
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
        }));
        setBookings(mapped);
      }
    } catch (err) {
      console.error("Unable to load consultations:", err);
    } finally {
      setLoading(false);
    }
  }

  // 2. Fetch Services
  async function fetchServices() {
    try {
      setServicesLoading(true);
      const res = await fetch(`${apiBase}/api/admin/services`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        setServices(result.data);
      }
    } catch (err) {
      console.error("Unable to load services:", err);
    } finally {
      setServicesLoading(false);
    }
  }

  // 3. Fetch Consultation Pricing Matrix
  async function fetchPricing() {
    try {
      setPricingLoading(true);
      const res = await fetch(`${apiBase}/api/admin/consultations/pricing`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.success && json?.data) {
        setPricing((prev) => ({
          ...prev,
          ...json.data,
          within500km: json.data.within500km ?? json.data.within200km ?? 21000,
          above500km: json.data.above500km ?? json.data.above300km ?? 31000,
        }));
      }
    } catch (err) {
      console.error("Failed to load consultation pricing:", err);
    } finally {
      setPricingLoading(false);
    }
  }

  // 4. Save Consultation Pricing Matrix
  async function savePricing(e) {
    e?.preventDefault();
    try {
      setPricingSaving(true);
      const payload = {
        ...pricing,
        within200km: pricing.within500km,
        within200_300km: pricing.within500km,
        above300km: pricing.above500km,
      };
      const res = await fetch(`${apiBase}/api/admin/consultations/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.success) {
        setToast("Consultation pricing & GST matrix saved successfully!");
      } else {
        throw new Error(json.error || "Failed to save pricing");
      }
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setPricingSaving(false);
    }
  }

  // 5. Cloudinary upload for Service image
  async function handleServiceImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setServiceUploading(true);
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${apiBase}/api/upload/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          image: base64,
          folder: "vastu-services",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cloudinary upload failed");
      }
      setSelectedService((prev) => ({
        ...prev,
        image: data.url,
      }));
      setToast("Image uploaded to Cloudinary successfully!");
    } catch (err) {
      setToast(`Upload failed: ${err.message}`);
    } finally {
      setServiceUploading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    fetchServices();
    fetchPricing();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "Pending").length,
      confirmed: bookings.filter((b) => b.status === "Confirmed").length,
      revenue: bookings
        .filter((b) => b.paymentStatus === "Paid")
        .reduce((sum, b) => sum + Number(b.amount || 0), 0),
    }),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    let result = bookings.filter((booking) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        [
          booking.id,
          booking.name,
          booking.email,
          booking.phone,
          booking.type,
          booking.location,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(q),
        );

      const matchesStatus =
        statusFilter === "All statuses" || booking.status === statusFilter;
      const matchesType =
        typeFilter === "All types" || booking.type === typeFilter;

      const matchesDate =
        dateFilter === "All dates" ||
        (dateFilter === "Upcoming" &&
          booking.date >= today &&
          booking.status !== "Cancelled") ||
        (dateFilter === "Past" && booking.date < today);

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    result = [...result];

    if (sortBy === "oldest")
      result.sort((a, b) => a.date.localeCompare(b.date));
    else if (sortBy === "fee-high") result.sort((a, b) => b.amount - a.amount);
    else if (sortBy === "fee-low") result.sort((a, b) => a.amount - b.amount);
    else result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [bookings, search, statusFilter, typeFilter, dateFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Booking CRUD
  async function saveBooking(form) {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        type: form.type,
        mode: form.mode === "In-Person" ? "in_person" : "online",
        date: form.scheduledDate || form.date || undefined,
        time: form.scheduledTime || form.time || undefined,
        scheduledDate: form.scheduledDate || undefined,
        scheduledTime: form.scheduledTime || undefined,
        scheduledByAdmin: Boolean(form.scheduledDate || form.scheduledTime),
        notes: form.notes,
        state: form.state || "Rajasthan",
        amount: Number(form.amount || 0),
        clientGstin: form.clientGstin ? String(form.clientGstin).trim().toUpperCase() : undefined,
        googleMapsLink: form.googleMapsLink ? String(form.googleMapsLink).trim() : undefined,
        status: String(form.status || "pending").toLowerCase(),
        paymentStatus:
          selectedBooking?.paymentStatus === "Paid"
            ? "paid"
            : String(form.paymentStatus || "pending").toLowerCase(),
      };

      if (selectedBooking?._id) {
        const res = await fetch(`${apiBase}/api/admin/consultations/${selectedBooking._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update consultation");
        setToast("Consultation booking updated successfully.");
      } else {
        const res = await fetch(`${apiBase}/api/admin/consultations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to create consultation");
        setToast("Consultation booking created successfully.");
      }
      fetchBookings();
    } catch (err) {
      console.error("Save consultation error:", err);
      setToast(err.message || "Failed to save consultation.");
    }
    setSelectedBooking(null);
  }

  async function confirmDeleteBooking() {
    if (!deleteBooking?._id) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/consultations/${deleteBooking._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to delete");
      setToast("Consultation booking deleted.");
      fetchBookings();
    } catch (err) {
      console.error("Delete consultation error:", err);
      setToast(err.message || "Could not delete consultation.");
    }
    setDeleteBooking(null);
  }

  // Service CRUD
  async function saveService(form) {
    try {
      const payload = {
        name: form.name,
        price: Number(form.price) || 0,
        description: form.description || "",
        icon: form.icon || "⌂",
        image: form.image || "",
        features: typeof form.features === "string" ? form.features.split("\n").map(f => f.trim()).filter(Boolean) : (form.features || []),
        isActive: form.isActive !== undefined ? Boolean(form.isActive) : true,
      };

      if (selectedService?._id) {
        const res = await fetch(`${apiBase}/api/admin/services/${selectedService._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update service");
        setToast("Service updated successfully.");
      } else {
        const res = await fetch(`${apiBase}/api/admin/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to create service");
        setToast("New service added successfully.");
      }
      fetchServices();
    } catch (err) {
      console.error("Save service error:", err);
      setToast(err.message || "Failed to save service.");
    }
    setSelectedService(null);
  }

  async function confirmDeleteService() {
    if (!deleteService?._id) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/services/${deleteService._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to delete service");
      setToast("Service deleted.");
      fetchServices();
    } catch (err) {
      console.error("Delete service error:", err);
      setToast(err.message || "Could not delete service.");
    }
    setDeleteService(null);
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-xs font-bold text-white shadow-2xl"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-zinc-900">
              Vastu Consultations & Services
            </h1>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
              {bookings.length} Bookings · {services.length} Services
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Manage online appointment bookings, PayU payments, and live consultation service offerings.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap rounded-xl bg-zinc-100 p-1 border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "bookings"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <CalendarDays size={15} />
            <span>Appointments & Bookings ({bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "services"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Layers size={15} />
            <span>Services ({services.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "pricing"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <IndianRupee size={15} />
            <span>Fee & GST Matrix</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: APPOINTMENTS & BOOKINGS */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Bookings</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{stats.total}</p>
              <p className="mt-1 text-[11px] text-zinc-500">All registered appointments</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="mt-1 text-[11px] text-zinc-500">Awaiting confirmation</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Confirmed</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
              <p className="mt-1 text-[11px] text-zinc-500">Ready & scheduled</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">Paid Revenue</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{money(stats.revenue)}</p>
              <p className="mt-1 text-[11px] text-zinc-500">Verified consultation fees</p>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer, phone, ID, service..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white transition"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 outline-none focus:border-zinc-900 transition"
              >
                <option>All statuses</option>
                {bookingStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 outline-none focus:border-zinc-900 transition hidden md:block"
              >
                <option>All dates</option>
                <option>Upcoming</option>
                <option>Past</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fetchBookings();
                  setToast("Appointments reloaded successfully");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
                title="Reload appointments from server"
              >
                <RotateCcw size={14} className={loading ? "animate-spin text-zinc-600" : "text-zinc-500"} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBooking({})}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition"
              >
                <Plus size={15} />
                <span>New Appointment</span>
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3.5">Reference & Customer</th>
                    <th className="px-4 py-3.5">Service & Mode</th>
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Fee</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">
                        Loading appointments...
                      </td>
                    </tr>
                  ) : visibleBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">
                        No appointment bookings found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    visibleBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-zinc-50/60 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-mono font-bold text-zinc-900">{b.id}</p>
                          <p className="text-zinc-700 font-medium">{b.name}</p>
                          <p className="text-[10px] text-zinc-400">{b.phone} · {b.email}</p>
                          {b.clientGstin && (
                            <span className="inline-block mt-0.5 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              GST: {b.clientGstin}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-zinc-800">{b.type}</span>
                          <p className="text-[10px] text-zinc-500">{b.mode}</p>
                          {b.googleMapsLink && (
                            <a
                              href={b.googleMapsLink.startsWith("http") ? b.googleMapsLink : `https://www.google.com/maps?q=${encodeURIComponent(b.googleMapsLink)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold hover:underline mt-0.5"
                            >
                              <MapPin size={10} />
                              <span>Map ({b.distanceKm !== undefined && b.distanceKm !== null ? `~${b.distanceKm}km` : "View"})</span>
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {b.scheduledDate ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                <Check size={10} />
                                {dateLabel(b.scheduledDate)}
                              </span>
                              {b.scheduledTime && (
                                <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                  <Clock size={10} /> {b.scheduledTime}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              <PhoneCall size={10} />
                              Call & Schedule
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-zinc-900">
                          {money(b.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={b.paymentStatus} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(b)}
                              className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-100 shadow-xs"
                              title="Download official GST tax invoice"
                            >
                              <Receipt size={12} className="text-emerald-700" />
                              <span>GST Bill</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewFormModal(b)}
                              className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100 shadow-xs"
                              title="View filled registration form document"
                            >
                              <FileText size={12} className="text-amber-700" />
                              <span>Filled Form</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewBooking(b)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition"
                              title="Quick view"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition"
                              title="Edit appointment"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteBooking(b)}
                              className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Delete appointment"
                            >
                              <Trash2 size={16} />
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
              <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs">
                <span className="text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: DYNAMIC CONSULTATION PRICING & GST MATRIX */}
      {activeTab === "pricing" && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl">
          <div className="border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <IndianRupee size={20} />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-zinc-900">
                  Consultation Fee Structure & GST Matrix
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Control live rates for all modes, Jaipur radial distance tiers, and tax invoice percentages.
                </p>
              </div>
            </div>
          </div>

          {pricingLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              <Loader2 size={24} className="animate-spin mx-auto text-amber-700 mb-2" />
              Loading current pricing configuration...
            </div>
          ) : (
            <form onSubmit={savePricing} className="space-y-6">
              {/* 1. Mode Based Pricing */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    1. Fixed Fees for Online & Office Consultations
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Video Call Consultation Fee (₹)" required>
                    <input
                      type="number"
                      min="0"
                      value={pricing.videoCall ?? 2100}
                      onChange={(e) => setPricing((prev) => ({ ...prev, videoCall: Number(e.target.value) }))}
                      className={inputClass}
                      required
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">Default: ₹2,100</span>
                  </Field>
                  <Field label="Office Visit (Jaipur Head Office) Fee (₹)" required>
                    <input
                      type="number"
                      min="0"
                      value={pricing.officeVisit ?? 2100}
                      onChange={(e) => setPricing((prev) => ({ ...prev, officeVisit: Number(e.target.value) }))}
                      className={inputClass}
                      required
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">Default: ₹2,100</span>
                  </Field>
                </div>
              </div>

              {/* 2. On-Site Property Visit Radial Tiers */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                  <MapPin size={15} className="text-amber-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    2. On-Site Property Visit Distance Radial Tiers (from Jaipur Benchmark)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Tier 1: In Jaipur City (₹)" required>
                    <input
                      type="number"
                      min="0"
                      value={pricing.withinJaipur ?? 11000}
                      onChange={(e) => setPricing((prev) => ({ ...prev, withinJaipur: Number(e.target.value) }))}
                      className={inputClass}
                      required
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">Jaipur municipal boundary / ≤ 40 km (Default: ₹11,000)</span>
                  </Field>
                  <Field label="Tier 2: Outside Jaipur, Within 500 km (₹)" required>
                    <input
                      type="number"
                      min="0"
                      value={pricing.within500km ?? 21000}
                      onChange={(e) => setPricing((prev) => ({ ...prev, within500km: Number(e.target.value) }))}
                      className={inputClass}
                      required
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">e.g. Ajmer, Kota, Bikaner, Delhi NCR (Default: ₹21,000)</span>
                  </Field>
                  <Field label="Tier 3: Above 500 km from Jaipur (₹)" required>
                    <input
                      type="number"
                      min="0"
                      value={pricing.above500km ?? 31000}
                      onChange={(e) => setPricing((prev) => ({ ...prev, above500km: Number(e.target.value) }))}
                      className={inputClass}
                      required
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">Pan-India or international sites (Default: ₹31,000)</span>
                  </Field>
                </div>
              </div>

              {/* 3. GST Tax Invoice Configuration */}
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-2">
                  <Receipt size={15} className="text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    3. Official GST Tax Invoice Settings
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Consultation GST Tax Rate" required>
                    <select
                      value={pricing.gstRate ?? 18}
                      onChange={(e) => setPricing((prev) => ({ ...prev, gstRate: Number(e.target.value) }))}
                      className={inputClass}
                    >
                      <option value={18}>18% (Standard Professional SAC 998399 Consulting)</option>
                      <option value={5}>5% (Reduced Tax Rate)</option>
                      <option value={0}>0% (Tax Exempt / Nil Rate)</option>
                    </select>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Controls breakdown into Taxable Value + CGST/SGST on generated GST bills
                    </span>
                  </Field>
                  <Field label="Business GSTIN Number" required>
                    <input
                      type="text"
                      value={pricing.gstin || ""}
                      onChange={(e) => setPricing((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                      placeholder="08AAAAA0000A1Z5"
                      className={inputClass}
                      required
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Appears on printable customer & admin GST invoices
                    </span>
                  </Field>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  New fees take effect immediately across all customer booking cards and PayU gateway orders.
                </p>
                <button
                  type="submit"
                  disabled={pricingSaving}
                  className="flex items-center gap-2 rounded-xl bg-zinc-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition disabled:opacity-50 shadow-md"
                >
                  {pricingSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Matrix...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Consultation Pricing Matrix</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* VIEW 2: SERVICES & PRICING MANAGEMENT */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Live Vastu Services Catalogue
              </h2>
              <p className="text-xs text-zinc-500">
                Services configured here are directly served to the user appointment booking system.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedService({ isActive: true, price: 11000, icon: "⌂" })}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition"
            >
              <Plus size={15} />
              <span>Add New Service</span>
            </button>
          </div>

          {/* Services Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <div
                key={svc._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-lg">
                        {svc.icon || "⌂"}
                      </span>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-sm">
                          {svc.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${svc.isActive ? "text-emerald-700" : "text-zinc-400"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${svc.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
                          {svc.isActive ? "Active on Store" : "Inactive / Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedService(svc)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition"
                        title="Edit service"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteService(svc)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete service"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-zinc-500 leading-5 line-clamp-3">
                    {svc.description}
                  </p>

                  {Array.isArray(svc.features) && svc.features.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3">
                      {svc.features.slice(0, 3).map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                          <Check size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Consultation Fee</span>
                    <p className="font-serif text-lg font-bold text-zinc-900">{money(svc.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedService(svc)}
                    className="text-xs font-bold text-zinc-800 hover:underline"
                  >
                    Edit Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Service Add/Edit */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedService(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">
                      {selectedService._id ? "Edit Vastu Service" : "Add New Vastu Service"}
                    </h3>
                    <p className="text-xs text-zinc-500">Live service in public booking catalogue</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="rounded-xl p-1 text-zinc-400 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveService({
                    name: fd.get("name"),
                    price: fd.get("price"),
                    icon: fd.get("icon"),
                    description: fd.get("description"),
                    features: fd.get("features"),
                    image: fd.get("image"),
                    isActive: fd.get("isActive") === "true",
                  });
                }}
                className="mt-4 space-y-3.5"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="Service Name" required>
                      <input
                        name="name"
                        defaultValue={selectedService.name || ""}
                        placeholder="e.g. Vastu for Single Person"
                        required
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Icon Emoji">
                      <input
                        name="icon"
                        defaultValue={selectedService.icon || "⌂"}
                        placeholder="⌂, ▥, ⚒, 👤"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Field label="Consultation Fee (₹)" required>
                      <input
                        type="number"
                        name="price"
                        defaultValue={selectedService.price || 11000}
                        required
                        min={0}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Status">
                      <select
                        name="isActive"
                        defaultValue={selectedService.isActive !== false ? "true" : "false"}
                        className={inputClass}
                      >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <div>
                  <Field label="Description">
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={selectedService.description || ""}
                      placeholder="Brief description of consultation scope..."
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div>
                  <Field label="Features / Highlights (one per line)">
                    <textarea
                      name="features"
                      rows={3}
                      defaultValue={Array.isArray(selectedService.features) ? selectedService.features.join("\n") : ""}
                      placeholder="Home Vastu Consultation&#10;Plan Energy Balancing&#10;Online or In-Person Guidance"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div>
                  <Field label="Service Image (Cloudinary or Image URL)">
                    <div className="flex gap-2">
                      <input
                        name="image"
                        value={selectedService.image || ""}
                        onChange={(e) => setSelectedService((prev) => ({ ...prev, image: e.target.value }))}
                        placeholder="https://res.cloudinary.com/... or upload below"
                        className={inputClass}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400 transition">
                        {serviceUploading ? (
                          <Loader2 size={14} className="animate-spin text-zinc-600" />
                        ) : (
                          <UploadCloud size={14} className="text-zinc-600" />
                        )}
                        <span>{serviceUploading ? "Uploading to Cloudinary..." : "Upload from Computer (Cloudinary)"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={serviceUploading}
                          onChange={handleServiceImageUpload}
                        />
                      </label>
                      {selectedService.image && (
                        <div className="flex items-center gap-2">
                          <img
                            src={selectedService.image}
                            alt="Preview"
                            className="h-10 w-16 rounded-lg object-cover border border-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedService((prev) => ({ ...prev, image: "" }))}
                            className="text-[11px] text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-950 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    Save Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Service Delete Confirmation */}
      <AnimatePresence>
        {deleteService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteService(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl text-center"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Delete Service?</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Are you sure you want to remove &quot;{deleteService.name}&quot;? Existing past bookings will remain in records.
              </p>
              <div className="mt-5 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteService(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteService}
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Delete Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Appointment Add/Edit */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900 text-base">
                  {selectedBooking._id ? "Edit Appointment Booking" : "Add New Appointment"}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl p-1 text-zinc-400 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveBooking({
                    name: fd.get("name"),
                    phone: fd.get("phone"),
                    email: fd.get("email"),
                    type: fd.get("type"),
                    mode: fd.get("mode"),
                    date: fd.get("scheduledDate") || fd.get("date"),
                    time: fd.get("scheduledTime") || fd.get("time"),
                    scheduledDate: fd.get("scheduledDate"),
                    scheduledTime: fd.get("scheduledTime"),
                    amount: fd.get("amount"),
                    status: fd.get("status"),
                    paymentStatus: fd.get("paymentStatus"),
                    clientGstin: fd.get("clientGstin"),
                    googleMapsLink: fd.get("googleMapsLink"),
                    notes: fd.get("notes"),
                  });
                }}
                className="mt-4 space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Customer Name" required>
                    <input name="name" defaultValue={selectedBooking.name || ""} required className={inputClass} />
                  </Field>
                  <Field label="Phone Number" required>
                    <input name="phone" defaultValue={selectedBooking.phone || ""} required className={inputClass} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email Address">
                    <input name="email" defaultValue={selectedBooking.email || ""} className={inputClass} />
                  </Field>
                  <Field label="Service Type" required>
                    <select name="type" defaultValue={selectedBooking.type || (services[0]?.name || "Residential Vastu")} className={inputClass}>
                      {services.map((s) => (
                        <option key={s._id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="col-span-2 flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200/60 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <PhoneCall size={14} className="text-amber-700" />
                      <span>Post-Call Scheduling (Admin Call)</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-normal">Call user to fix slot</span>
                  </div>
                  <div>
                    <Field label="Scheduled Date">
                      <input
                        type="date"
                        name="scheduledDate"
                        defaultValue={selectedBooking.scheduledDate || selectedBooking.date || ""}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Scheduled Time / Slot">
                      <input
                        type="text"
                        name="scheduledTime"
                        defaultValue={selectedBooking.scheduledTime || selectedBooking.time || ""}
                        placeholder="e.g. 11:30 AM / 4:00 PM"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Field label="Mode">
                      <select name="mode" defaultValue={selectedBooking.mode || "Online"} className={inputClass}>
                        <option value="Online">Online</option>
                        <option value="In-Person">In-Person</option>
                      </select>
                    </Field>
                  </div>
                  <div>
                    <Field label="Fee (₹)">
                      <input type="number" name="amount" defaultValue={selectedBooking.amount || 11000} className={inputClass} />
                    </Field>
                  </div>
                  <div>
                    <Field label="Status">
                      {String(selectedBooking.status || "").toLowerCase() === "completed" ? (
                        <div className="flex items-center justify-between rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-blue-600" />
                            Completed (Status Locked)
                          </span>
                          <input type="hidden" name="status" value="Completed" />
                        </div>
                      ) : (
                        <select name="status" defaultValue={selectedBooking.status || "Pending"} className={inputClass}>
                          {bookingStatuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>
                  <div>
                    <Field label="Payment Status">
                      {selectedBooking.paymentStatus === "Paid" ? (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Paid via PayU (Locked)
                          </span>
                          <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-900">
                            Verified
                          </span>
                          <input type="hidden" name="paymentStatus" value="Paid" />
                        </div>
                      ) : (
                        <select name="paymentStatus" defaultValue={selectedBooking.paymentStatus || "Pending"} className={inputClass}>
                          {paymentStatuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Field label="State / UT (for GST Billing)">
                      <input
                        name="state"
                        defaultValue={selectedBooking.state || "Rajasthan"}
                        placeholder="e.g. Rajasthan, Maharashtra, Delhi"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Client ID">
                      <input
                        name="clientId"
                        defaultValue={selectedBooking.clientId || ""}
                        readOnly
                        className={`${inputClass} bg-zinc-50 cursor-not-allowed text-zinc-500`}
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Field label="Buyer GSTIN (ITC Claim)">
                      <input
                        name="clientGstin"
                        defaultValue={selectedBooking.clientGstin || ""}
                        placeholder="e.g. 08AAAAA0000A1Z5"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Google Maps Location Link">
                      <input
                        name="googleMapsLink"
                        defaultValue={selectedBooking.googleMapsLink || ""}
                        placeholder="https://maps.app.goo.gl/..."
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                <div>
                  <Field label="Notes & Address Details">
                    <textarea name="notes" rows={2} defaultValue={selectedBooking.notes || ""} className={inputClass} />
                  </Field>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-950 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    Save Appointment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: View Booking Details */}
      <AnimatePresence>
        {viewBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewBooking(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-900">{viewBooking.id}</span>
                  {viewBooking.clientId && (
                    <span className="ml-2 font-mono text-[10px] text-zinc-500">({viewBooking.clientId})</span>
                  )}
                </div>
                <StatusBadge status={viewBooking.status} />
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Customer</p>
                  <p className="font-bold text-zinc-900 text-sm">{viewBooking.name}</p>
                  <p className="text-zinc-600">{viewBooking.phone} · {viewBooking.email}</p>
                  {viewBooking.fatherOrSpouseName && (
                    <p className="text-zinc-500 text-[11px] mt-0.5">Father/Spouse: {viewBooking.fatherOrSpouseName}</p>
                  )}
                  {viewBooking.residentialAddress && (
                    <p className="text-zinc-500 text-[11px]">Res. Address: {viewBooking.residentialAddress}</p>
                  )}
                  {viewBooking.clientGstin && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-mono font-bold text-emerald-900 border border-emerald-200">
                      <span>Buyer GSTIN (ITC Claim):</span>
                      <span className="text-emerald-700">{viewBooking.clientGstin}</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Service & Mode</p>
                  <p className="font-bold text-zinc-900">{viewBooking.type} — {viewBooking.mode}</p>
                  {viewBooking.distanceTier && (
                    <p className="text-zinc-600 text-[11px] font-medium mt-0.5">
                      Distance: <span className="capitalize">{viewBooking.distanceTier.replace(/_/g, " ")}</span>
                      {viewBooking.distanceKm !== undefined && viewBooking.distanceKm !== null && (
                        <span> (~{viewBooking.distanceKm} km from Jaipur)</span>
                      )}
                    </p>
                  )}
                  {viewBooking.googleMapsLink && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-800">
                      <MapPin size={12} className="shrink-0 text-amber-700" />
                      <a
                        href={viewBooking.googleMapsLink.startsWith("http") ? viewBooking.googleMapsLink : `https://www.google.com/maps?q=${encodeURIComponent(viewBooking.googleMapsLink)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline font-semibold flex items-center gap-1"
                      >
                        <span className="truncate">{viewBooking.googleMapsLink}</span>
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Consultation Date</p>
                    <p className="font-semibold text-zinc-800">
                      {viewBooking.scheduledDate ? dateLabel(viewBooking.scheduledDate) : "📞 Pending Scheduling Call"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Time Slot</p>
                    <p className="font-semibold text-zinc-800">{viewBooking.scheduledTime || viewBooking.time || "To be scheduled"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Fee & Tax</p>
                    <p className="font-bold text-zinc-900">{money(viewBooking.amount)} ({viewBooking.gstRate ?? 18}% GST)</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Payment Status</p>
                    <StatusBadge status={viewBooking.paymentStatus} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Billing State</p>
                    <p className="font-semibold text-zinc-800">{viewBooking.state || "Rajasthan"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">GST Place of Supply</p>
                    <p className="font-semibold text-[#b9843c]">
                      {!viewBooking.state || viewBooking.state.toLowerCase().includes("rajasthan")
                        ? "Intra-State (CGST + SGST)"
                        : "Inter-State (IGST)"}
                    </p>
                  </div>
                </div>

                {(viewBooking.propertyAddress || viewBooking.address || viewBooking.googleMapsLink) && (
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Property Site & Location Details</p>
                      {viewBooking.distanceKm !== undefined && viewBooking.distanceKm !== null && (
                        <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                          ~{viewBooking.distanceKm} km from Jaipur
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-900 font-semibold text-xs">{viewBooking.propertyAddress || viewBooking.address || "Address in booking"}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-zinc-600">
                      {viewBooking.propertyOwnerName && <span>Owner: <strong>{viewBooking.propertyOwnerName}</strong></span>}
                      {viewBooking.propertyType && <span>• Type: {viewBooking.propertyType}</span>}
                      {viewBooking.approximateArea && <span>• Area: {viewBooking.approximateArea}</span>}
                      {viewBooking.numberOfFloors && <span>• Floors: {viewBooking.numberOfFloors}</span>}
                      {viewBooking.propertyPlanProvided !== undefined && (
                        <span>• Plan: {viewBooking.propertyPlanProvided ? "Provided" : "Not Provided"}</span>
                      )}
                    </div>
                    {viewBooking.googleMapsLink && (
                      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700 truncate min-w-0">
                          <MapPin size={14} className="text-red-600 shrink-0" />
                          <span className="truncate font-mono text-[11px] text-zinc-600">{viewBooking.googleMapsLink}</span>
                        </div>
                        <a
                          href={viewBooking.googleMapsLink.startsWith("http") ? viewBooking.googleMapsLink : `https://www.google.com/maps?q=${encodeURIComponent(viewBooking.googleMapsLink)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                        >
                          <span>View on Google Maps</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {Array.isArray(viewBooking.familyMembers) && viewBooking.familyMembers.length > 0 && (
                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Family Members & Concerns</p>
                    {viewBooking.familyMembers.map((m, idx) => (
                      <p key={idx} className="text-[11px] text-zinc-700">
                        • <strong>{m.name}</strong> {m.relation && `(${m.relation})`} {m.concern && `— ${m.concern}`}
                      </p>
                    ))}
                  </div>
                )}

                {viewBooking.notes && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Client Concerns / Notes</p>
                    <p className="text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">{viewBooking.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(viewBooking);
                      setViewBooking(null);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-xs"
                  >
                    <Receipt size={14} className="text-emerald-700" />
                    <span>Download GST Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewFormModal(viewBooking);
                      setViewBooking(null);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
                  >
                    <FileText size={14} className="text-amber-700" />
                    <span>Open Full Form Document</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setViewBooking(null)}
                  className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Complete Filled Registration & Declaration Document View */}
      <AnimatePresence>
        {viewFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setViewFormModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full"
            >
              {/* Modal Top Bar (Hidden during print) */}
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="text-amber-700" size={18} />
                  <span className="font-serif font-bold text-zinc-900 text-sm">
                    Filled Registration & Declaration Form
                  </span>
                  <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-mono font-bold">
                    {viewFormModal.documentNo || viewFormModal.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition shadow-xs"
                  >
                    <Printer size={14} />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewFormModal(null)}
                    className="grid h-8 w-8 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div className="overflow-y-auto p-6 sm:p-10 text-zinc-900 space-y-6 print:p-0">
                {/* Official Letterhead */}
                <div className="border-b-2 border-amber-900/80 pb-5 text-center">
                  <span className="text-[11px] font-bold tracking-[0.25em] text-amber-800 uppercase">
                    Bhuwneshwari Scientific Vastu
                  </span>
                  <h1 className="mt-1 font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                    CLIENT REGISTRATION, DECLARATION, INFORMED CONSENT & SERVICE TERMS
                  </h1>
                  <p className="mt-1 text-xs text-zinc-600">
                    Consultant: <strong>Ar. Kuldeep Swami</strong> (Architect & Scientific Vastu Expert)
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Head Office: Jaipur, Rajasthan · Contact: +91 8690708302 · Email: support@bhuwneshwari.com
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-amber-50/50 p-4 border border-amber-200/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Client ID</span>
                    <span className="font-mono font-bold text-amber-900 text-sm">
                      {viewFormModal.clientId || "CLT-USER"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Document No.</span>
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      {viewFormModal.documentNo || viewFormModal.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Consultation Date</span>
                    <span className="font-semibold text-zinc-800">
                      {dateLabel(viewFormModal.date)} at {viewFormModal.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Payment Status</span>
                    <span className="font-bold text-emerald-800">
                      {viewFormModal.paymentStatus === "Paid" ? "Paid via PayU ✓" : "Payment Pending"} ({money(viewFormModal.amount)})
                    </span>
                  </div>
                </div>

                {/* Section 1: Client's Particulars */}
                <div className="space-y-3">
                  <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1 flex items-center gap-2">
                    <span>1. Client&apos;s Particulars</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs border border-zinc-200 rounded-xl p-4 bg-white">
                    <div>
                      <span className="font-bold text-zinc-600">Full Name of Client: </span>
                      <span className="font-semibold text-zinc-900">{viewFormModal.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Father&apos;s / Spouse&apos;s Name: </span>
                      <span className="text-zinc-900">{viewFormModal.fatherOrSpouseName || "—"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Mobile Number: </span>
                      <span className="font-semibold text-zinc-900">{viewFormModal.phone}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Email Address: </span>
                      <span className="text-zinc-900">{viewFormModal.email}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-bold text-zinc-600">Residential Address: </span>
                      <span className="text-zinc-900">{viewFormModal.residentialAddress || viewFormModal.address || "—"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Occupation / Business: </span>
                      <span className="text-zinc-900">{viewFormModal.occupation || "—"}</span>
                    </div>
                    {viewFormModal.clientGstin && (
                      <div className="sm:col-span-2">
                        <span className="font-bold text-zinc-600">Buyer Business GSTIN (ITC): </span>
                        <span className="font-mono font-bold text-emerald-800">{viewFormModal.clientGstin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Property Particulars */}
                <div className="space-y-3">
                  <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1 flex items-center gap-2">
                    <span>2. Property Particulars to be Consulted</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs border border-zinc-200 rounded-xl p-4 bg-white">
                    <div>
                      <span className="font-bold text-zinc-600">Property Owner&apos;s Name: </span>
                      <span className="font-semibold text-zinc-900">{viewFormModal.propertyOwnerName || viewFormModal.name}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Property Type: </span>
                      <span className="text-zinc-900">{viewFormModal.propertyType || "Residential"}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-bold text-zinc-600">Complete Property Address: </span>
                      <span className="font-semibold text-zinc-900">{viewFormModal.propertyAddress || viewFormModal.address || "—"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Approximate Area: </span>
                      <span className="text-zinc-900">{viewFormModal.approximateArea || "—"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Number of Floors: </span>
                      <span className="text-zinc-900">{viewFormModal.numberOfFloors || "—"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Property Plan Provided: </span>
                      <span className="text-zinc-900 font-semibold">{viewFormModal.propertyPlanProvided ? "Yes (Provided)" : "No (Will be verified on site)"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-600">Site Visit Required: </span>
                      <span className="text-zinc-900 font-semibold">
                        {viewFormModal.consultationMode === "site_visit" ? "Yes (On-Site Property Inspection)" : "No (Online Video / Office Visit)"}
                      </span>
                    </div>
                    {viewFormModal.distanceTier && (
                      <div className="sm:col-span-2">
                        <span className="font-bold text-zinc-600">Location / Distance Tier: </span>
                        <span className="text-zinc-900 capitalize">{viewFormModal.distanceTier.replace(/_/g, " ")}</span>
                        {viewFormModal.distanceKm !== undefined && viewFormModal.distanceKm !== null && (
                          <span className="text-zinc-600 font-normal"> (~{viewFormModal.distanceKm} km from Jaipur Benchmark)</span>
                        )}
                        {viewFormModal.googleMapsLink && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-600">Google Maps Link: </span>
                            <a
                              href={viewFormModal.googleMapsLink.startsWith("http") ? viewFormModal.googleMapsLink : `https://www.google.com/maps?q=${encodeURIComponent(viewFormModal.googleMapsLink)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-800 hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>{viewFormModal.googleMapsLink}</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {viewFormModal.notes && (
                      <div className="sm:col-span-2 mt-1 rounded-lg bg-zinc-50 p-2.5 border border-zinc-100">
                        <span className="font-bold text-zinc-700 block mb-0.5">Client&apos;s Specific Concerns / Objectives:</span>
                        <span className="text-zinc-800 italic">{viewFormModal.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Family Member Details & Concerns */}
                <div className="space-y-3">
                  <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1">
                    3. Family Member Details & Concerns
                  </h2>
                  {Array.isArray(viewFormModal.familyMembers) && viewFormModal.familyMembers.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                          <tr>
                            <th className="px-3 py-2 font-bold w-12">S.No</th>
                            <th className="px-3 py-2 font-bold">Member Name</th>
                            <th className="px-3 py-2 font-bold">Relationship</th>
                            <th className="px-3 py-2 font-bold">Health / Spatial Concern</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white">
                          {viewFormModal.familyMembers.map((m, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-zinc-400 font-mono">{idx + 1}</td>
                              <td className="px-3 py-2 font-semibold text-zinc-900">{m.name || "—"}</td>
                              <td className="px-3 py-2 text-zinc-600">{m.relation || "—"}</td>
                              <td className="px-3 py-2 text-zinc-800">{m.concern || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      No additional family members listed for this consultation.
                    </p>
                  )}
                </div>

                {/* Section 4: Declaration & Informed Consent */}
                <div className="space-y-2 border-t border-zinc-200 pt-4">
                  <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-amber-900">
                    4. Declaration & Informed Consent
                  </h2>
                  <p className="text-xs text-zinc-600 leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-200">
                    &ldquo;I hereby declare that all particulars, property details and plans submitted above are true and correct to the best of my knowledge. I understand that Scientific Vastu guidance provided by Ar. Kuldeep Swami constitutes spatial, structural, and directional energy balancing advisory.&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Digitally Confirmed & Accepted by Client</span>
                    </span>
                    <span className="text-zinc-500 font-mono">
                      Ref: {viewFormModal.documentNo || viewFormModal.id}
                    </span>
                  </div>
                </div>

                {/* Print Signatures */}
                <div className="hidden print:flex items-end justify-between pt-12 text-xs text-zinc-700">
                  <div className="text-center">
                    <div className="border-t border-zinc-400 w-48 pt-1">Client Signature</div>
                    <p className="font-semibold">{viewFormModal.name}</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-zinc-400 w-48 pt-1">Consultant Signature</div>
                    <p className="font-semibold">Ar. Kuldeep Swami</p>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions (Hidden during print) */}
              <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4 print:hidden">
                <span className="text-xs text-zinc-500">
                  Total Fee: <strong className="text-zinc-900">{money(viewFormModal.amount)}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100"
                  >
                    <Printer size={14} />
                    <span>Print Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewFormModal(null)}
                    className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Booking Delete Confirmation */}
      <AnimatePresence>
        {deleteBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteBooking(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl text-center"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 mb-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Delete Appointment?</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Are you sure you want to permanently delete appointment {deleteBooking.id} for {deleteBooking.name}?
              </p>
              <div className="mt-5 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setDeleteBooking(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteBooking}
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Official GST Bill */}
      {selectedInvoice && (
        <GstInvoiceModal
          invoiceData={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
