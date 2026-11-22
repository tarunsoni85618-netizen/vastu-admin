"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  BookOpen,
  Users,
  IndianRupee,
  GraduationCap,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  CircleAlert,
  MoreHorizontal,
  Download,
  CalendarDays,
  Video,
  LayoutGrid,
  List,
  Sparkles,
  MessageCircle,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

const statuses = ["Published", "Draft", "Upcoming", "Closed", "Active"];
const categories = ["Master Class", "Workshop", "Foundational", "Advanced", "Professional"];
const emptyProgram = {
  title: "",
  slug: "",
  price: 4999,
  duration: "4 Weeks",
  format: "Online",
  level: "Beginner",
  status: "Published",
  category: "Master Class",
  description: "",
  whatsappLink: "https://chat.whatsapp.com/BhuwneshwariMasterClass",
  topics: "Foundational Principles, Layout Assessment, Remedial Measures",
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
          {Icon && <Icon size={20} />}
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "Active").toLowerCase();
  let cls = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (s === "upcoming" || s === "draft" || s === "pending") cls = "bg-amber-50 text-amber-700 ring-amber-200";
  if (s === "completed" || s === "closed") cls = "bg-zinc-100 text-zinc-700 ring-zinc-300";
  if (s === "cancelled" || s === "archived") cls = "bg-red-50 text-red-700 ring-red-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Active"}
    </span>
  );
}

export default function AdminTrainingPage() {
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("8");
  const [view, setView] = useState("table");
  const [modalProgram, setModalProgram] = useState(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState("");
  const [selectedCourseStudentsProgram, setSelectedCourseStudentsProgram] = useState(null);
  const [viewProgram, setViewProgram] = useState(null);
  const [deleteProgram, setDeleteProgram] = useState(null);
  const [toast, setToast] = useState("");

  async function fetchTrainingData() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const [trainingsRes, enrollmentsRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/training`, { credentials: "include", cache: "no-store" }),
        fetch(`${apiBase}/api/admin/enrollments`, { credentials: "include", cache: "no-store" }),
      ]);
      const trainingsResult = await trainingsRes.json();
      const enrollmentsResult = await enrollmentsRes.json();

      const enrList = Array.isArray(enrollmentsResult?.data) ? enrollmentsResult.data : [];
      setEnrollments(enrList);

      if (trainingsResult?.success && Array.isArray(trainingsResult?.data)) {
        const mapped = trainingsResult.data.map((t, idx) => {
          const matchingEnrs = enrList.filter((e) => {
            const matchSlug = e.courseSlug && t.slug && e.courseSlug.toLowerCase() === t.slug.toLowerCase();
            const matchTitle = e.courseTitle && t.title && e.courseTitle.trim().toLowerCase() === t.title.trim().toLowerCase();
            return matchSlug || matchTitle;
          });
          const studentCount = matchingEnrs.length;
          return {
            id: `TRN-${String(idx + 1).padStart(3, "0")}`,
            _id: t._id,
            title: t.title || "Untitled Course",
            slug: t.slug || "",
            category: t.level || "Foundation",
            level: t.level || "Beginner",
            format: (t.format || "online").charAt(0).toUpperCase() + (t.format || "online").slice(1),
            duration: t.duration || "4 weeks",
            price: String(t.price || 0),
            seats: "50",
            enrolled: studentCount,
            status: (t.status || "published") === "published" ? "Published" : "Draft",
            description: t.description || t.shortDescription || "",
            topics: Array.isArray(t.syllabus) ? t.syllabus.join(", ") : (t.topics || ""),
            whatsappLink: t.whatsappLink || "",
            startDate: t.startDate ? new Date(t.startDate).toISOString().slice(0, 10) : "",
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : "",
          };
        });
        setPrograms(mapped);
      }
    } catch (err) {
      console.error("Unable to load training programs:", err);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }

  useEffect(() => {
    fetchTrainingData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const stats = useMemo(() => {
    const published = programs.filter((p) => p.status === "Published").length;
    const learners = enrollments.length;
    const revenue = enrollments.reduce((sum, e) => sum + Number(e.paidAmount || (e.paymentStatus === "paid" ? e.amount : 0) || 0), 0);
    const drafts = programs.filter((p) => p.status === "Draft").length;

    return { published, learners, revenue, drafts };
  }, [programs, enrollments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = programs.filter((program) => {
      const matchesSearch = [
        program.title,
        program.id,
        program.category,
        program.level,
        program.format,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All statuses" || program.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All categories" || program.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "priceHigh") return Number(b.price) - Number(a.price);
      if (sortBy === "priceLow") return Number(a.price) - Number(b.price);
      if (sortBy === "learners") return Number(b.enrolled) - Number(a.enrolled);
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }, [programs, search, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * Number(pageSize),
    currentPage * Number(pageSize)
  );

  const saveProgram = async (data) => {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const payload = {
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        price: Number(data.price || 0),
        duration: data.duration,
        format: String(data.format || "online").toLowerCase(),
        level: data.level || "Beginner",
        status: String(data.status || "published").toLowerCase(),
        description: data.description || "",
        shortDescription: (data.description || "").slice(0, 150),
        whatsappLink: data.whatsappLink || "",
        syllabus: typeof data.topics === "string" ? data.topics.split(",").map((s) => s.trim()).filter(Boolean) : (Array.isArray(data.topics) ? data.topics : []),
      };

      if (data._id) {
        const res = await fetch(`${apiBase}/api/admin/training/${data._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update training");
        setToast("Program updated successfully.");
      } else {
        const res = await fetch(`${apiBase}/api/admin/training`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to create training");
        setToast("Program created successfully.");
      }
      fetchTrainingData();
    } catch (err) {
      console.error(err);
      setToast(err.message || "Error saving program");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All statuses");
    setCategoryFilter("All categories");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Training & Courses
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Manage course curriculum, enrollments, student records, and batch schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedCourseForEnroll("");
              setEnrollModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            <UserCheck size={16} />
            <span>Manual Enroll Student</span>
          </button>

          <button
            onClick={() => setModalProgram(emptyProgram)}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-black"
          >
            <Plus size={16} />
            <span>New Training Program</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Courses" value={stats.published} icon={BookOpen} />
        <StatCard title="Enrolled Students" value={stats.learners} subtitle="Across all batches" icon={Users} />
        <StatCard title="Fee Collected" value={money(stats.revenue)} subtitle="From student enrollments" icon={IndianRupee} />
        <StatCard title="Draft Programs" value={stats.drafts} subtitle="Pending publication" icon={GraduationCap} />
      </div>

      {/* Content Box */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Controls */}
        <div className="border-b border-zinc-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course title, code, format..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-xs font-medium text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400"
              >
                <option>All statuses</option>
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400"
              >
                <option value="newest">Newest first</option>
                <option value="learners">Most students</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="priceLow">Price: Low to High</option>
              </select>

              <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                <button
                  onClick={() => setView("table")}
                  className={`rounded-lg p-1.5 transition ${view === "table" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`rounded-lg p-1.5 transition ${view === "grid" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        {view === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Course Program</th>
                  <th className="px-4 py-3.5 font-semibold">Category</th>
                  <th className="px-4 py-3.5 font-semibold">Fee</th>
                  <th className="px-4 py-3.5 font-semibold">Enrolled Students</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {pageItems.map((program) => (
                  <tr key={program.id} className="transition hover:bg-zinc-50/75">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                          <BookOpen size={18} />
                        </div>
                        <div className="max-w-[280px]">
                          <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{program.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{program.id} · {program.duration} · {program.format}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-zinc-800">{program.category}</span>
                      <p className="mt-0.5 text-[11px] text-zinc-500">{program.level}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-zinc-900">{money(program.price)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedCourseStudentsProgram(program)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100"
                        title="Click to view all enrolled students for this course"
                      >
                        <Users size={14} className="text-zinc-600" />
                        <span>{program.enrolled} Enrolled</span>
                        <span className="text-[10px] text-zinc-400 font-normal">›</span>
                      </button>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={program.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCourseStudentsProgram(program)}
                          title="View Enrolled Students"
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Users size={15} />
                        </button>
                        <button
                          onClick={() => setViewProgram(program)}
                          title="View details"
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setModalProgram(program)}
                          title="Edit program"
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteProgram(program)}
                          title="Delete program"
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((program) => (
              <div key={program.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 uppercase">
                    {program.category}
                  </span>
                  <StatusBadge status={program.status} />
                </div>
                <h3 className="mt-3 font-serif text-base font-bold text-zinc-900">{program.title}</h3>
                <p className="mt-1 text-xs text-zinc-500">{program.duration} · {program.format}</p>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <p className="text-base font-bold text-zinc-900">{money(program.price)}</p>
                  <button
                    onClick={() => setSelectedCourseStudentsProgram(program)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                  >
                    <Users size={13} />
                    <span>{program.enrolled} Students</span>
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedCourseStudentsProgram(program)}
                    className="flex-1 rounded-xl bg-zinc-900 py-2 text-xs font-bold text-white hover:bg-black transition"
                  >
                    View Students
                  </button>
                  <button
                    onClick={() => setModalProgram(program)}
                    className="rounded-xl border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-100"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pageItems.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen size={32} className="mx-auto text-zinc-400" />
            <h3 className="mt-3 font-serif text-lg font-bold text-zinc-900">No training programs found</h3>
            <p className="mt-1 text-xs text-zinc-500">Create a new course or adjust your filter.</p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500">
          <div>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}–
            {Math.min(currentPage * Number(pageSize), filtered.length)} of {filtered.length} courses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-zinc-800 font-semibold">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Enrolled Students Modal */}
        {selectedCourseStudentsProgram && (
          <EnrolledStudentsModal
            program={selectedCourseStudentsProgram}
            enrollments={enrollments}
            onClose={() => setSelectedCourseStudentsProgram(null)}
            onManualEnroll={() => {
              setSelectedCourseForEnroll(selectedCourseStudentsProgram.title);
              setSelectedCourseStudentsProgram(null);
              setEnrollModalOpen(true);
            }}
          />
        )}

        {/* Manual Enroll Modal */}
        {enrollModalOpen && (
          <ManualEnrollModal
            programs={programs}
            initialCourse={selectedCourseForEnroll}
            onClose={() => {
              setEnrollModalOpen(false);
              setSelectedCourseForEnroll("");
            }}
            onEnrolled={(msg) => {
              setEnrollModalOpen(false);
              setSelectedCourseForEnroll("");
              setToast(msg);
              fetchTrainingData();
            }}
          />
        )}

        {/* Create/Edit Program Modal */}
        {modalProgram && (
          <ProgramModal
            program={modalProgram}
            onClose={() => setModalProgram(null)}
            onSave={saveProgram}
          />
        )}

        {/* Details Modal */}
        {viewProgram && (
          <DetailsModal
            program={viewProgram}
            onClose={() => setViewProgram(null)}
            onEdit={(prog) => {
              setViewProgram(null);
              setModalProgram(prog);
            }}
          />
        )}

        {/* Delete Modal */}
        {deleteProgram && (
          <DeleteModal
            program={deleteProgram}
            onClose={() => setDeleteProgram(null)}
            onConfirm={async () => {
              try {
                const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
                if (deleteProgram._id) {
                  await fetch(`${apiBase}/api/admin/training/${deleteProgram._id}`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                }
                setPrograms((prev) => prev.filter((p) => p.id !== deleteProgram.id));
                setDeleteProgram(null);
                setToast("Program deleted.");
                fetchTrainingData();
              } catch {
                setToast("Failed to delete program");
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            className="fixed bottom-5 left-1/2 z-[150] flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-xs font-semibold text-white shadow-2xl border border-zinc-800"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Enrolled Students Modal for a specific Training Program
 */
function EnrolledStudentsModal({ program, enrollments, onClose, onManualEnroll }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const matchingEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const matchSlug = e.courseSlug && program.slug && e.courseSlug.toLowerCase() === program.slug.toLowerCase();
      const matchTitle = e.courseTitle && program.title && e.courseTitle.trim().toLowerCase() === program.title.trim().toLowerCase();
      return matchSlug || matchTitle;
    });
  }, [enrollments, program]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return matchingEnrollments.filter((item) => {
      const matchesText = [
        item.userName,
        item.userPhone,
        item.userEmail,
        item.enrollmentId,
        item.txnid,
      ].some((v) => String(v || "").toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && (item.paymentStatus === "paid" || item.dueAmount === 0)) ||
        (statusFilter === "due" && Number(item.dueAmount || 0) > 0);

      return matchesText && matchesStatus;
    });
  }, [matchingEnrollments, searchTerm, statusFilter]);

  const totalCollected = matchingEnrollments.reduce(
    (sum, e) => sum + Number(e.paidAmount || (e.paymentStatus === "paid" ? e.amount : 0) || 0),
    0
  );
  const totalDue = matchingEnrollments.reduce((sum, e) => sum + Number(e.dueAmount || 0), 0);

  const downloadCSV = () => {
    if (matchingEnrollments.length === 0) return;
    const headers = ["Enrollment ID", "Student Name", "Phone", "Email", "Fee", "Paid", "Due", "Status", "Payment Method", "Date"];
    const rows = matchingEnrollments.map((e) => [
      e.enrollmentId || "",
      `"${e.userName || ""}"`,
      `"${e.userPhone || ""}"`,
      `"${e.userEmail || ""}"`,
      e.amount || 0,
      e.paidAmount || 0,
      e.dueAmount || 0,
      e.paymentStatus || "",
      e.paymentProvider || e.paymentMethod || "online",
      new Date(e.createdAt).toISOString().slice(0, 10),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Enrolled_Students_${program.title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                Batch Roster
              </span>
              <span className="text-xs text-zinc-500 font-mono">{program.id}</span>
            </div>
            <h3 className="mt-1 font-serif text-xl font-bold text-zinc-900">{program.title}</h3>
            <p className="text-xs text-zinc-500">
              {matchingEnrollments.length} total enrolled students · Fee: {money(program.price)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              disabled={matchingEnrollments.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onManualEnroll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-black"
            >
              <Plus size={14} />
              <span>+ Enroll Student</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Enrolled Students</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{matchingEnrollments.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Collected</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{money(totalCollected)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Pending Dues</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{money(totalDue)}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, phone, email, or enrollment ID..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {["all", "paid", "due"].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                  statusFilter === filter
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {filter === "all" ? "All Students" : filter === "paid" ? "Paid in Full" : "With Due Balance"}
              </button>
            ))}
          </div>
        </div>

        {/* Student Table */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Contact & WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Enrollment ID</th>
                <th className="px-4 py-3 font-semibold">Financials</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Enrolled On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    No enrolled students match your query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((enr) => {
                  const cleanPhone = String(enr.userPhone || "").replace(/\D/g, "").slice(-10);
                  const isPaid = enr.paymentStatus === "paid" && Number(enr.dueAmount || 0) === 0;
                  const hasDue = Number(enr.dueAmount || 0) > 0;
                  return (
                    <tr key={enr._id || enr.enrollmentId} className="hover:bg-zinc-50/75 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-zinc-900">{enr.userName || "Student"}</p>
                        {enr.userEmail && <p className="text-[11px] text-zinc-500">{enr.userEmail}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/91${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={12} />
                            <span>{cleanPhone}</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-600">
                        {enr.enrollmentId}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-zinc-900">{money(enr.amount)}</p>
                        <p className="text-[10px] text-emerald-700">Paid: {money(enr.paidAmount)}</p>
                        {hasDue && (
                          <p className="text-[10px] font-bold text-amber-700">Due: {money(enr.dueAmount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : hasDue
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-zinc-100 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          {isPaid ? "Paid in Full" : hasDue ? `Due: ${money(enr.dueAmount)}` : enr.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-zinc-500 text-[11px]">
                        {enr.createdAt ? new Date(enr.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            Close Roster
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Manual Enroll Modal with partial payment support
 */
function ManualEnrollModal({ programs, initialCourse = "", onClose, onEnrolled }) {
  const [selectedCourse, setSelectedCourse] = useState(initialCourse || programs[0]?.title || "");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProgramObj = programs.find((p) => p.title === selectedCourse);

  useEffect(() => {
    if (selectedProgramObj) {
      setAmount(String(selectedProgramObj.price || ""));
      setPaidAmount(String(selectedProgramObj.price || ""));
    }
  }, [selectedProgramObj]);

  const total = Number(amount) || 0;
  const paid = Math.max(0, Number(paidAmount) || 0);
  const due = Math.max(0, total - paid);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      setError("Student name and phone number are required.");
      return;
    }
    if (total <= 0) {
      setError("Please specify a valid program fee.");
      return;
    }
    if (paid > total) {
      setError("Paid amount cannot exceed total program fee.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userName: userName.trim(),
          userPhone: userPhone.trim(),
          userEmail: userEmail.trim(),
          courseTitle: selectedCourse,
          courseSlug: selectedProgramObj?.slug || "",
          amount: total,
          paidAmount: paid,
          paymentMethod,
          whatsappLink: selectedProgramObj?.whatsappLink || "",
          notes: notes.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to enroll student");
      onEnrolled(`Student enrolled successfully! Ref: ${result.data?.enrollmentId}. ${due > 0 ? "Remaining due: ₹" + due : ""}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to enroll student.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Admin Manual Entry</span>
            <h3 className="mt-1 font-serif text-2xl font-bold text-zinc-900">Enroll Student</h3>
            <p className="text-xs text-zinc-500">Enroll student into training program with full or partial payment.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-zinc-700">Select Training Program *</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.title}>
                  {p.title} (Fee: ₹{Number(p.price).toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4 space-y-3 border border-zinc-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">Student Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-700">Student Name *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Full Name"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-700">Phone (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="10-digit WhatsApp number"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 outline-none focus:border-zinc-400"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700">Email Address (optional)</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="student@example.com"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-700">Total Course Fee (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ Total Fee"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-700">
                  Paid Today (₹) <span className="text-zinc-500 font-normal">(Partial/Full)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setPaidAmount(String(total))}
                className="font-semibold text-zinc-900 underline"
              >
                Paid Full (₹{total.toLocaleString("en-IN")})
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setPaidAmount("0")}
                className="font-semibold text-zinc-900 underline"
              >
                Unpaid / Full Due
              </button>
            </div>

            {due > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-2.5 text-xs font-bold text-amber-900 border border-amber-200">
                <span>REMAINING DUE BALANCE:</span>
                <span className="text-sm font-extrabold text-amber-950">₹{due.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-zinc-700">Payment Mode</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {["Cash", "UPI / QR", "Online Payment"].map((m) => (
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
              <label className="text-[11px] font-bold text-zinc-700">Payment Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Batch starts Nov 15 / Cash received"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-black disabled:opacity-50"
            >
              {submitting ? "Enrolling..." : "Confirm & Enroll Student"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ProgramModal({ program, onClose, onSave }) {
  const isEditing = Boolean(program && program.title);
  const [form, setForm] = useState(
    isEditing
      ? { ...program }
      : {
          title: "",
          slug: "",
          price: 4999,
          duration: "4 Weeks",
          format: "Online",
          level: "Beginner",
          status: "Published",
          description: "",
          whatsappLink: "https://chat.whatsapp.com/BhuwneshwariMasterClass",
          topics: "Foundational Principles, Layout Assessment, Remedial Measures",
        }
  );

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h3 className="font-serif text-xl font-bold text-zinc-900">
            {isEditing ? "Edit Program" : "New Training Course"}
          </h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-700">Course Title *</label>
            <input
              type="text"
              required
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400"
              placeholder="e.g. Master Vastu Practitioner Course"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700">Fee (₹) *</label>
              <input
                type="number"
                required
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700">Duration</label>
              <input
                type="text"
                value={form.duration || "4 Weeks"}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700">Format</label>
              <select
                value={form.format || "Online"}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400 bg-white"
              >
                {["Online", "Offline Workshop", "Hybrid", "1-on-1 Mentorship"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-700">Status</label>
              <select
                value={form.status || "Published"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400 bg-white"
              >
                {["Published", "Draft", "Upcoming", "Closed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-700">WhatsApp Channel / Group Link</label>
            <input
              type="url"
              value={form.whatsappLink || ""}
              onChange={(e) => setForm({ ...form, whatsappLink: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-mono outline-none focus:border-zinc-400"
              placeholder="https://chat.whatsapp.com/..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-700">Key Syllabus Topics (comma-separated)</label>
            <input
              type="text"
              value={Array.isArray(form.topics) ? form.topics.join(", ") : (form.topics || "")}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-zinc-400"
              placeholder="Vastu Grid, Directions, Remedial Energy, Case Studies"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-black"
            >
              Save Course
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DetailsModal({ program, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h3 className="font-serif text-xl font-bold text-zinc-900">
            Course Information
          </h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Course Title:</span>
            <span className="font-bold text-zinc-900 max-w-[240px] text-right">{program.title}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Course Fee:</span>
            <span className="font-bold text-zinc-900">{money(program.price)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Duration & Format:</span>
            <span className="font-medium text-zinc-900">{program.duration || "4 Weeks"} • {program.format || "Online"}</span>
          </div>
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
            <span className="text-zinc-500">Status:</span>
            <StatusBadge status={program.status} />
          </div>
          {program.whatsappLink && (
            <div className="border-b border-zinc-100 pb-2">
              <span className="text-zinc-500 block mb-1">WhatsApp Group:</span>
              <a
                href={program.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-mono text-[11px] underline break-all"
              >
                {program.whatsappLink}
              </a>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(program)}
            className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-black"
          >
            Edit Course
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteModal({ program, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <Trash2 size={22} />
        </div>
        <h3 className="mt-3 font-serif text-lg font-bold text-zinc-900">
          Delete Course?
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Are you sure you want to delete <span className="font-bold text-zinc-800">{program?.title || "this course"}</span>?
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
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
