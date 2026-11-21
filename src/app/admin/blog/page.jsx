
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  FileText,
  Eye,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Clock3,
  CheckCircle2,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  LayoutGrid,
  List,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  Tag,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "bsv-admin-blog-posts";

const categories = [
  "Vastu Basics",
  "Vastu Principles",
  "Home Vastu",
  "Commercial Vastu",
  "Plot Selection",
  "Tips & Guidance",
  "Case Studies",
];

const statuses = ["Published", "Draft", "Scheduled", "Archived"];

const emptyPost = {
  title: "",
  slug: "",
  category: "Vastu Basics",
  author: "Bhuwneshwari Vastu Team",
  excerpt: "",
  content: "",
  image: "",
  status: "Draft",
  featured: false,
  tags: "",
  views: 0,
  readTime: "5 min",
  publishDate: "",
};

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3.5 py-3 text-sm text-[#18181b] outline-none transition placeholder:text-[#b0a596] focus:border-[#27272a] focus:ring-2 focus:ring-[#27272a]/10";

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const styles = {
    Published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Draft: "bg-amber-50 text-amber-700 ring-amber-200",
    Scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
    Archived: "bg-stone-100 text-stone-600 ring-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        styles[status] || styles.Draft
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#e4e4e7] bg-white p-5 shadow-sm shadow-[#3b2b18]/[0.025]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#817565]">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#18181b] sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs text-[#918575]">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children, required = false }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#594a36]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function PostEditor({ post, onClose, onSave }) {
  const isEditing = Boolean(post?.id);
  const [form, setForm] = useState({ ...emptyPost, ...post });
  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const createSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const submit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a blog title.");
      return;
    }

    if (!form.excerpt.trim()) {
      setError("Please enter a short excerpt.");
      return;
    }

    if (!form.content.trim()) {
      setError("Please enter the blog content.");
      return;
    }

    const finalSlug = createSlug(form.slug || form.title);
    if (!finalSlug) {
      setError("Please provide a valid URL slug.");
      return;
    }

    onSave({
      ...form,
      title: form.title.trim(),
      slug: finalSlug,
      author: form.author.trim() || "Bhuwneshwari Vastu Team",
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(","),
      readTime: form.readTime || "5 min",
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#21190f]/50 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-[#f4f4f5] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e7] bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#18181b]">
              Content management
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#18181b]">
              {isEditing ? "Edit article" : "Create article"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close editor"
            className="rounded-full border border-[#e4e4e7] p-2 text-[#52525b] hover:bg-[#f4f4f5]"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_290px]">
            <div className="space-y-5">
              <Field label="Article title" required>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(event) => {
                    update("title", event.target.value);
                    if (!isEditing || !form.slug) {
                      update("slug", createSlug(event.target.value));
                    }
                  }}
                  placeholder="Enter an engaging blog title"
                  required
                />
              </Field>

              <Field label="URL slug">
                <div className="flex items-center overflow-hidden rounded-xl border border-[#e4e4e7] bg-white">
                  <span className="border-r border-[#e4e4e7] bg-[#f7f1e7] px-3 py-3 text-xs text-[#71717a]">
                    /blog/
                  </span>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                    value={form.slug}
                    onChange={(event) => update("slug", createSlug(event.target.value))}
                    placeholder="article-url-slug"
                  />
                </div>
              </Field>

              <Field label="Short excerpt" required>
                <textarea
                  className={`${inputClass} resize-y`}
                  rows={3}
                  maxLength={300}
                  value={form.excerpt}
                  onChange={(event) => update("excerpt", event.target.value)}
                  placeholder="A short summary shown on blog cards..."
                  required
                />
                <p className="mt-1 text-right text-[11px] text-[#71717a]">
                  {form.excerpt.length}/300
                </p>
              </Field>

              <Field label="Article content" required>
                <textarea
                  className={`${inputClass} resize-y`}
                  rows={10}
                  value={form.content}
                  onChange={(event) => update("content", event.target.value)}
                  placeholder="Write your article content here..."
                  required
                />
                <p className="mt-1 text-xs text-[#71717a]">
                  Plain text editor. Connect a rich-text editor for formatted headings, links and images.
                </p>
              </Field>

              <Field label="Featured image URL">
                <input
                  className={inputClass}
                  type="url"
                  value={form.image}
                  onChange={(event) => update("image", event.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </Field>

              {form.image && (
                <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white p-2">
                  <img
                    src={form.image}
                    alt="Blog cover preview"
                    className="h-48 w-full rounded-lg object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#e4e4e7] bg-white p-4">
                <p className="mb-4 text-sm font-semibold text-[#18181b]">Publish settings</p>

                <Field label="Status">
                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(event) => update("status", event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </Field>

                <div className="mt-4">
                  <Field label="Publish / schedule date">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.publishDate || ""}
                      onChange={(event) => update("publishDate", event.target.value)}
                    />
                  </Field>
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f8f2e7] p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={(event) => update("featured", event.target.checked)}
                    className="mt-0.5 accent-[#8d6b36]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#18181b]">Featured article</span>
                    <span className="mt-1 block text-xs leading-5 text-[#71717a]">
                      Mark this article for special placement on the blog page.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-[#e4e4e7] bg-white p-4">
                <p className="mb-4 text-sm font-semibold text-[#18181b]">Article details</p>

                <Field label="Category">
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(event) => update("category", event.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>

                <div className="mt-4">
                  <Field label="Author">
                    <input
                      className={inputClass}
                      value={form.author}
                      onChange={(event) => update("author", event.target.value)}
                      placeholder="Author name"
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Reading time">
                    <select
                      className={inputClass}
                      value={form.readTime}
                      onChange={(event) => update("readTime", event.target.value)}
                    >
                      {["2 min", "3 min", "4 min", "5 min", "6 min", "7 min", "8 min", "10 min", "12 min", "15 min"].map(
                        (time) => <option key={time}>{time}</option>
                      )}
                    </select>
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Tags (comma separated)">
                    <textarea
                      className={`${inputClass} resize-y`}
                      rows={3}
                      value={form.tags}
                      onChange={(event) => update("tags", event.target.value)}
                      placeholder="Vastu, Home, Guide"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 text-sm text-red-600">
              <CircleAlert size={16} /> {error}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#e4e4e7] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#d4d4d8] px-5 py-3 text-sm font-semibold text-[#3f3f46] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#18181b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#624a2d]"
            >
              {isEditing ? "Save changes" : "Create article"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function PreviewModal({ post, onClose, onEdit }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#21190f]/50 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#ffffff] shadow-2xl"
      >
        <div className="relative">
          {post.image ? (
            <img
              src={post.image}
              alt={post.title}
              className="h-56 w-full object-cover sm:h-72"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-[#f0e5d2] text-[#9a7843] sm:h-72">
              <ImageIcon size={48} strokeWidth={1.2} />
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="absolute right-4 top-4 rounded-full border border-white/50 bg-white/90 p-2 text-[#18181b] shadow-sm hover:bg-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            <span className="rounded-full bg-[#f4f4f5] px-3 py-1 text-[11px] font-semibold text-[#8f6b33]">
              {post.category}
            </span>
            {post.featured && (
              <span className="rounded-full bg-[#f9edcf] px-3 py-1 text-[11px] font-semibold text-[#916c2f]">
                Featured
              </span>
            )}
          </div>

          <h2 className="mt-4 font-serif text-3xl leading-tight text-[#18181b] sm:text-4xl">
            {post.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#71717a]">
            <span>{post.author}</span>
            <span className="flex items-center gap-1"><CalendarDays size={14} /> {formatDate(post.publishDate)}</span>
            <span className="flex items-center gap-1"><Clock3 size={14} /> {post.readTime}</span>
            <span className="flex items-center gap-1"><Eye size={14} /> {Number(post.views || 0).toLocaleString("en-IN")} views</span>
          </div>

          <p className="mt-6 border-l-2 border-[#27272a] pl-4 text-base leading-7 text-[#6e5d47]">
            {post.excerpt}
          </p>

          <div className="mt-6 whitespace-pre-wrap text-sm leading-8 text-[#6b5b48]">
            {post.content}
          </div>

          {post.tags && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#eee5d8] pt-5">
              {post.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full border border-[#e7dac5] px-3 py-1.5 text-xs text-[#3f3f46]">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#eee5d8] pt-5 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-full border border-[#d4d4d8] px-5 py-3 text-sm font-semibold text-[#3f3f46]"
            >
              Close preview
            </button>
            <button
              onClick={() => onEdit(post)}
              className="flex items-center justify-center gap-2 rounded-full bg-[#18181b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#624a2d]"
            >
              <Pencil size={15} /> Edit article
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeleteModal({ post, onClose, onConfirm }) {
  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#21190f]/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md rounded-3xl border border-[#eee5d8] bg-[#ffffff] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={22} />
        </div>
        <h3 className="mt-5 font-serif text-2xl text-[#18181b]">Delete article?</h3>
        <p className="mt-3 text-sm leading-6 text-[#52525b]">
          Are you sure you want to delete{" "}
          <strong className="text-[#18181b]">{post.title}</strong>? This removes it from this demo dashboard.
        </p>
        <div className="mt-7 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-[#d4d4d8] px-4 py-3 text-sm font-semibold text-[#3f3f46]">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">
            Delete article
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("8");
  const [editorPost, setEditorPost] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [toast, setToast] = useState("");

  async function fetchPosts() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/blog`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        const mapped = result.data.map((b) => ({
          id: b.slug || String(b._id).slice(-6).toUpperCase(),
          _id: b._id,
          title: b.title || "Untitled",
          slug: b.slug || "",
          category: b.category || "Vastu Shastra",
          author: b.author || "Consultant",
          excerpt: b.excerpt || "",
          content: b.content || "",
          status: (b.status || "published") === "published" ? "Published" : "Draft",
          featured: Boolean(b.featured),
          tags: Array.isArray(b.tags) ? b.tags.join(", ") : (b.tags || ""),
          views: Number(b.views || 0),
          readTime: b.readTime || "5 min read",
          coverImage: b.coverImage || "",
          publishDate: b.publishedAt ? new Date(b.publishedAt).toISOString().slice(0, 10) : "",
          createdAt: b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 10) : "",
        }));
        setPosts(mapped);
      }
    } catch (err) {
      console.error("Unable to load blog posts:", err);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === "Published").length;
    const drafts = posts.filter((post) => post.status === "Draft").length;
    const views = posts.reduce((sum, post) => sum + Number(post.views || 0), 0);
    const featured = posts.filter((post) => post.featured).length;
    return { published, drafts, views, featured };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = posts.filter((post) => {
      const matchesSearch = [
        post.title,
        post.id,
        post.slug,
        post.category,
        post.author,
        post.tags,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All statuses" || post.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All categories" || post.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "views") return Number(b.views) - Number(a.views);
      if (sortBy === "oldest") return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
  }, [posts, search, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / Number(pageSize)));
  const currentPage = Math.min(page, totalPages);
  const pagePosts = filteredPosts.slice(
    (currentPage - 1) * Number(pageSize),
    currentPage * Number(pageSize)
  );

  const savePost = async (data) => {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const payload = {
        title: data.title,
        slug: data.slug,
        category: data.category,
        author: data.author,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage || data.image || "",
        status: String(data.status || "published").toLowerCase(),
        featured: Boolean(data.featured),
        tags: typeof data.tags === "string" ? data.tags.split(",").map((s) => s.trim()).filter(Boolean) : (Array.isArray(data.tags) ? data.tags : []),
        readTime: data.readTime,
      };

      if (data._id) {
        const res = await fetch(`${apiBase}/api/admin/blog/${data._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update article");
        setToast("Article updated successfully.");
      } else {
        const res = await fetch(`${apiBase}/api/admin/blog`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to create article");
        setToast("New article created successfully.");
      }
      fetchPosts();
    } catch (err) {
      console.error(err);
      setToast(err.message || "Failed to save article.");
    }
    setEditorPost(null);
    setPreviewPost(null);
  };

  const exportCSV = () => {
    const columns = [
      "id", "title", "slug", "category", "author", "excerpt",
      "status", "featured", "tags", "views", "readTime",
      "publishDate", "createdAt",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.join(","),
      ...filteredPosts.map((post) =>
        columns.map((column) => escapeCSV(post[column])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bsv-blog-posts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("Blog articles exported.");
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All statuses");
    setCategoryFilter("All categories");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-5 text-[#18181b] sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Page header */}
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#18181b]">
              <BookOpen size={16} />
              Content management
            </div>
            <h1 className="font-serif text-3xl tracking-tight text-[#18181b] sm:text-4xl">
              Blog management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817565]">
              Create articles, organize categories, manage publishing, and keep your Vastu knowledge library up to date.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e6dccb] bg-white px-4 py-3 text-sm font-semibold text-[#3f3f46] transition hover:bg-[#f5efe5]"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={() => setEditorPost({ ...emptyPost })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#18181b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#624a2d]"
            >
              <Plus size={17} /> Create article
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total articles"
            value={posts.length}
            subtitle="All blog content"
            icon={FileText}
            color="bg-[#f2e8d5] text-[#8f6b33]"
          />
          <StatCard
            title="Published articles"
            value={stats.published}
            subtitle={`${stats.drafts} drafts in progress`}
            icon={CheckCircle2}
            color="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            title="Total article views"
            value={stats.views.toLocaleString("en-IN")}
            subtitle="Sample view counts"
            icon={Eye}
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            title="Featured articles"
            value={stats.featured}
            subtitle="Marked for special placement"
            icon={TrendingUp}
            color="bg-purple-50 text-purple-700"
          />
        </div>

        {/* Feature banner */}
        <div className="relative mb-7 overflow-hidden rounded-2xl bg-[#18181b] p-6 text-white sm:p-8">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -right-1 -top-8 h-40 w-40 rounded-full border border-[#d5b87f]/20" />
          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#dfc18a]">
                <Sparkles size={15} /> Your content workspace
              </div>
              <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
                Share knowledge. Build trust.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#d0c0a9]">
                Manage educational articles, practical Vastu guides and insights for your audience from one dashboard.
              </p>
            </div>
            <button
              onClick={() => setEditorPost({ ...emptyPost })}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#e7d1a8] px-5 py-3 text-sm font-semibold text-[#18181b] transition hover:bg-[#f3e2c4] md:self-center"
            >
              <Plus size={16} /> Write an article
            </button>
          </div>
        </div>

        {/* Content table */}
        <div className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm shadow-[#3b2b18]/[0.025]">
          <div className="border-b border-[#e4e4e7] p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-semibold text-[#18181b]">All articles</h2>
                <p className="mt-1 text-xs text-[#71717a]">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <div className="relative min-w-0 sm:w-64">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a49a8b]" />
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search articles..."
                    className="w-full rounded-xl border border-[#e4e4e7] bg-[#ffffff] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-[#afa494] focus:border-[#27272a]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3 py-2.5 text-sm text-[#3f3f46] outline-none focus:border-[#27272a]"
                >
                  <option>All statuses</option>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3 py-2.5 text-sm text-[#3f3f46] outline-none focus:border-[#27272a]"
                >
                  <option>All categories</option>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3 py-2.5 text-sm text-[#3f3f46] outline-none focus:border-[#27272a]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                  <option value="views">Most views</option>
                </select>

                <div className="flex items-center gap-1 self-start rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] p-1">
                  <button
                    onClick={() => setView("table")}
                    aria-label="Table view"
                    className={`rounded-lg p-2 ${view === "table" ? "bg-white text-[#8d6b36] shadow-sm" : "text-[#71717a]"}`}
                  >
                    <List size={17} />
                  </button>
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className={`rounded-lg p-2 ${view === "grid" ? "bg-white text-[#8d6b36] shadow-sm" : "text-[#71717a]"}`}
                  >
                    <LayoutGrid size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {view === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-[#f4f4f5] text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Article</th>
                    <th className="px-4 py-4 font-semibold">Category</th>
                    <th className="px-4 py-4 font-semibold">Author</th>
                    <th className="px-4 py-4 font-semibold">Views</th>
                    <th className="px-4 py-4 font-semibold">Publish date</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {pagePosts.map((post) => (
                    <tr key={post.id} className="transition hover:bg-[#ffffff]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e4e4e7] bg-[#e4e4e7]">
                            {post.image ? (
                              <img src={post.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[#18181b]">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div className="max-w-[270px]">
                            <p className="line-clamp-2 text-sm font-semibold text-[#18181b]">{post.title}</p>
                            <p className="mt-1 text-xs text-[#71717a]">{post.id} · {post.readTime}</p>
                            {post.featured && (
                              <span className="mt-1 inline-block text-[10px] font-semibold text-[#18181b]">
                                ★ Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#f5efe5] px-2.5 py-1.5 text-xs text-[#3f3f46]">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#3f3f46]">{post.author}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-[#3f3f46]">
                          <Eye size={14} className="text-[#18181b]" />
                          {Number(post.views || 0).toLocaleString("en-IN")}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#3f3f46]">
                        {formatDate(post.publishDate)}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={post.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewPost(post)}
                            title="Preview article"
                            aria-label={`Preview ${post.title}`}
                            className="rounded-lg border border-[#e4e4e7] p-2 text-[#3f3f46] transition hover:border-[#d4d4d8] hover:bg-[#f4f4f5] hover:text-[#8d6b36]"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setEditorPost(post)}
                            title="Edit article"
                            aria-label={`Edit ${post.title}`}
                            className="rounded-lg border border-[#e4e4e7] p-2 text-[#3f3f46] transition hover:border-[#d4d4d8] hover:bg-[#f4f4f5] hover:text-[#8d6b36]"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeletePost(post)}
                            title="Delete article"
                            aria-label={`Delete ${post.title}`}
                            className="rounded-lg border border-[#f1dfdc] p-2 text-[#a35b52] transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
              {pagePosts.map((post) => (
                <motion.article
                  layout
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white transition hover:border-[#d8c4a1] hover:shadow-md"
                >
                  <div className="relative h-48 bg-[#f4f4f5]">
                    {post.image ? (
                      <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#18181b]">
                        <ImageIcon size={36} />
                      </div>
                    )}
                    <div className="absolute left-3 top-3"><StatusBadge status={post.status} /></div>
                    {post.featured && (
                      <span className="absolute right-3 top-3 rounded-full bg-[#fff7e6] px-3 py-1.5 text-[10px] font-semibold text-[#8f6b33]">
                        ★ Featured
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#18181b]">
                      {post.category} · {post.readTime}
                    </p>
                    <h3 className="mt-2 line-clamp-2 font-serif text-xl text-[#18181b]">{post.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#817565]">{post.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-[#e4e4e7] pt-4">
                      <div>
                        <p className="text-xs font-semibold text-[#3f3f46]">{post.author}</p>
                        <p className="mt-1 text-xs text-[#71717a]">{formatDate(post.publishDate)}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-[#71717a]">
                        <Eye size={13} /> {Number(post.views || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setPreviewPost(post)} className="flex-1 rounded-full border border-[#e4e4e7] px-3 py-2.5 text-xs font-semibold text-[#6b5940] hover:bg-[#f4f4f5]">
                        <Eye className="mr-1 inline" size={14} /> Preview
                      </button>
                      <button onClick={() => setEditorPost(post)} className="flex-1 rounded-full bg-[#18181b] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#624a2d]">
                        <Pencil className="mr-1 inline" size={14} /> Edit
                      </button>
                      <button onClick={() => setDeletePost(post)} aria-label={`Delete ${post.title}`} className="rounded-full border border-red-100 px-3 py-2.5 text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {pagePosts.length === 0 && (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f4f5] text-[#18181b]">
                <Search size={23} />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#18181b]">No articles found</h3>
              <p className="mt-2 text-sm text-[#71717a]">Try another search or clear your filters.</p>
              <button onClick={resetFilters} className="mt-5 rounded-full border border-[#d4d4d8] px-5 py-2.5 text-sm font-semibold text-[#3f3f46] hover:bg-[#f4f4f5]">
                Clear filters
              </button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-[#e4e4e7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#71717a]">
              <span>
                Showing {filteredPosts.length === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}–
                {Math.min(currentPage * Number(pageSize), filteredPosts.length)} of {filteredPosts.length}
              </span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#e4e4e7] bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value="8">8 per page</option>
                <option value="12">12 per page</option>
                <option value="20">20 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="rounded-lg border border-[#e4e4e7] p-2 text-[#3f3f46] hover:bg-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>
              <span className="min-w-16 text-center text-xs font-semibold text-[#3f3f46]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="rounded-lg border border-[#e4e4e7] p-2 text-[#3f3f46] hover:bg-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#e9dfce] bg-[#f4f4f5] p-4 text-xs leading-5 text-[#52525b]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <p>
            <strong>Live Data:</strong> Blog articles and publishing statuses are connected directly to your MongoDB database.
          </p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editorPost && (
          <PostEditor
            key={editorPost.id || "new-article"}
            post={editorPost}
            onClose={() => setEditorPost(null)}
            onSave={savePost}
          />
        )}

        {previewPost && (
          <PreviewModal
            key={`preview-${previewPost.id}`}
            post={previewPost}
            onClose={() => setPreviewPost(null)}
            onEdit={(post) => {
              setPreviewPost(null);
              setEditorPost(post);
            }}
          />
        )}

        {deletePost && (
          <DeleteModal
            key={`delete-${deletePost.id}`}
            post={deletePost}
            onClose={() => setDeletePost(null)}
            onConfirm={async () => {
              try {
                const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
                if (deletePost._id) {
                  await fetch(`${apiBase}/api/admin/blog/${deletePost._id}`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                }
                setPosts((previous) =>
                  previous.filter((post) => post.id !== deletePost.id)
                );
                setToast("Article deleted.");
                fetchPosts();
              } catch {
                setToast("Failed to delete article");
              } finally {
                setDeletePost(null);
                setPreviewPost(null);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            className="fixed bottom-5 left-1/2 z-[150] flex max-w-[calc(100%-24px)] items-center gap-2 rounded-full bg-[#18181b] px-5 py-3.5 text-sm font-medium text-white shadow-xl"
          >
            <CheckCircle2 size={17} className="shrink-0 text-[#d4d4d8]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
