
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Package,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Boxes,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Eye,
  RotateCcw,
  ArrowUpDown,
  Tag,
  UploadCloud,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  GripVertical,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

const STORAGE_KEY = "bsv-admin-products-demo";
const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-xs text-[#18181b] outline-none transition focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]/20";

const categories = [
  "Vastu Pyramids",
  "Yantras",
  "Copper Products",
  "Crystals",
  "Home Decor",
  "Other",
];

const blankProduct = {
  name: "",
  slug: "",
  category: "Vastu Pyramids",
  price: "",
  compareAtPrice: "",
  stock: "10",
  description: "",
  image: "",
  status: "Active",
};

function formatINR(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
}

function getStockInfo(stock) {
  const num = Number(stock) || 0;
  if (num === 0) return { label: "Out of stock", color: "bg-red-50 text-red-700 ring-red-200" };
  if (num <= 5) return { label: `Low stock (${num})`, color: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: `In stock (${num})`, color: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
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

function ProductImage({ product, large = false }) {
  const src = product?.image || product?.imageUrl || "";
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] ${large ? "h-16 w-16" : "h-12 w-12"}`}>
      {src ? (
        <img src={src} alt={product?.name || "Product"} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs text-[#a1a1aa]">
          <Package size={large ? 24 : 18} />
        </div>
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }) {
  const editing = Boolean(product);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => {
    let initialImages = [];
    if (product) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        initialImages = product.images.map((img) =>
          typeof img === "string" ? { url: img, alt: product.name || "", publicId: null } : img
        );
      } else if (product.image) {
        initialImages = [{ url: product.image, alt: product.name || "", publicId: null }];
      }
    }
    return product
      ? {
          ...product,
          price: String(product.price ?? ""),
          compareAtPrice: String(product.compareAtPrice || ""),
          stock: String(product.stock ?? ""),
          images: initialImages,
          image: initialImages[0]?.url || product.image || "",
        }
      : {
          ...blankProduct,
          images: [],
          image: "",
        };
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "http://localhost:3001").replace(/\/$/, "");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // Handle uploading image files to Cloudinary
  async function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    try {
      const fileList = Array.from(files);
      const newUploaded = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress(`Uploading ${i + 1} of ${fileList.length} to Cloudinary...`);

        // Convert file to base64 data url
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch(`${apiBase}/api/upload/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            folder: "vastu-products",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Cloudinary upload failed");
        }

        newUploaded.push({
          url: data.url,
          alt: file.name.replace(/\.[^.]+$/, ""),
          publicId: data.publicId,
        });
      }

      setForm((current) => {
        const combined = [...(current.images || []), ...newUploaded];
        return {
          ...current,
          images: combined,
          image: combined[0]?.url || current.image,
        };
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload to Cloudinary.");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Add image by URL
  function addImageUrl() {
    const url = newImageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid HTTP/HTTPS image URL.");
      return;
    }

    setForm((current) => {
      const combined = [...(current.images || []), { url, alt: current.name || "Product image", publicId: null }];
      return {
        ...current,
        images: combined,
        image: combined[0]?.url || current.image,
      };
    });
    setNewImageUrl("");
    setError("");
  }

  // Rearrange Sequence Functions
  function moveImage(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= (form.images || []).length) return;
    setForm((current) => {
      const arr = [...(current.images || [])];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return {
        ...current,
        images: arr,
        image: arr[0]?.url || "",
      };
    });
  }

  function setAsMainImage(index) {
    if (index === 0) return;
    moveImage(index, 0);
  }

  function removeImage(index) {
    setForm((current) => {
      const arr = (current.images || []).filter((_, i) => i !== index);
      return {
        ...current,
        images: arr,
        image: arr[0]?.url || "",
      };
    });
  }

  function handleDragStart(index) {
    setDraggedIndex(index);
  }

  function handleDrop(targetIndex) {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    moveImage(draggedIndex, targetIndex);
    setDraggedIndex(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.sku.trim()) {
      setError("Please enter both a product name and SKU.");
      return;
    }

    if (!form.category) {
      setError("Please select a product category.");
      return;
    }

    if (form.price === "" || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      setError("Enter a valid selling price.");
      return;
    }

    if (
      form.compareAtPrice !== "" &&
      (!Number.isFinite(Number(form.compareAtPrice)) ||
        Number(form.compareAtPrice) < 0)
    ) {
      setError("Enter a valid comparison price.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      setError("Stock must be a whole number of zero or more.");
      return;
    }

    if (
      form.compareAtPrice !== "" &&
      Number(form.compareAtPrice) > 0 &&
      Number(form.compareAtPrice) <= Number(form.price)
    ) {
      setError("The original price should be greater than the selling price.");
      return;
    }

    setSaving(true);

    onSave({
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice) || 0,
      stock: Number(form.stock),
      image: form.images?.[0]?.url || form.image.trim(),
      images: form.images || [],
      description: form.description.trim(),
    });

    setSaving(false);
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
        aria-labelledby="product-modal-title"
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-[#e4e4e7] bg-[#ffffff] shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e7] bg-gradient-to-r from-[#fff8ea] to-white px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f2e2c5] text-[#95601f]">
              {editing ? <Pencil size={20} /> : <ImagePlus size={21} />}
            </div>
            <div>
              <h2
                id="product-modal-title"
                className="font-serif text-xl font-bold text-[#18181b] sm:text-2xl"
              >
                {editing ? "Edit product" : "Add new product"}
              </h2>
              <p className="mt-1 text-xs text-[#71717a]">
                {editing
                  ? `Update details for ${product.name}`
                  : "Enter the details for your new store product."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e4e4e7] text-[#52525b] transition hover:bg-[#f4f4f5]"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-7">
            <div className="flex items-center gap-4 rounded-2xl border border-[#e4e4e7] bg-white p-4">
              <ProductImage product={form} large />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#18181b]">
                  Product preview
                </p>
                <p className="mt-1 break-words text-xs text-[#71717a]">
                  {form.name || "Your product name will appear here"}
                </p>
                <p className="mt-2 text-sm font-bold text-[#18181b]">
                  {form.price !== "" ? formatINR(form.price) : "Set a price"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#71717a]">
                Product information
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" required>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Copper Vastu Pyramid"
                    maxLength={120}
                    required
                  />
                </Field>

                <Field label="SKU / Product code" required>
                  <input
                    value={form.sku}
                    onChange={(e) => update("sku", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. BSV-CVP-011"
                    maxLength={40}
                    required
                  />
                </Field>

                <Field label="Category" required>
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className={inputClass}
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Product status">
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                    className={inputClass}
                  >
                    <option>Active</option>
                    <option>Draft</option>
                  </select>
                </Field>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#71717a]">
                Pricing & inventory
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Selling price (₹)" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    className={inputClass}
                    placeholder="0"
                    required
                  />
                </Field>

                <Field
                  label="Original price (₹)"
                  hint="Optional strike-through price"
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={(e) => update("compareAtPrice", e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </Field>

                <Field label="Stock quantity" required>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => update("stock", e.target.value)}
                    className={inputClass}
                    placeholder="0"
                    required
                  />
                </Field>
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71717a]">
                  Product Images (Cloudinary) & Sequence
                </p>
                <span className="text-[11px] font-semibold text-zinc-500">
                  {form.images?.length || 0} image{(form.images?.length || 0) === 1 ? "" : "s"}
                </span>
              </div>

              {/* Upload Dropzone / Button */}
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d4d4d8] bg-zinc-50/70 p-6 transition hover:border-[#18181b] hover:bg-white"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 group-hover:scale-105 transition">
                    {uploading ? (
                      <Loader2 size={22} className="animate-spin text-zinc-900" />
                    ) : (
                      <UploadCloud size={24} className="text-zinc-700" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-bold text-zinc-900">
                    {uploading ? uploadProgress : "Upload Images to Cloudinary"}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500 text-center">
                    Click to browse or drag & drop files here. PNG, JPG, WebP supported.
                  </p>
                </div>

                {/* Add Image via Direct URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste external image URL (https://...)"
                    className={inputClass}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImageUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-800 hover:bg-zinc-200 transition"
                  >
                    + Add URL
                  </button>
                </div>

                {/* Gallery of Uploaded Images with Sequence Controls */}
                {Array.isArray(form.images) && form.images.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold text-zinc-700">
                      Rearrange Sequence: The 1st image is the primary cover image. Use arrows, &ldquo;Make Main&rdquo;, or drag to reorder.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {form.images.map((img, idx) => {
                        const isMain = idx === 0;
                        return (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(idx)}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-2 shadow-sm transition hover:shadow-md ${
                              isMain
                                ? "border-amber-400 ring-2 ring-amber-400/20"
                                : "border-zinc-200 hover:border-zinc-400"
                            }`}
                          >
                            {/* Sequence Badge */}
                            <div className={`absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow ${
                              isMain
                                ? "bg-amber-500 text-white"
                                : "bg-black/70 text-white backdrop-blur-sm"
                            }`}>
                              {isMain ? (
                                <>
                                  <Star size={10} className="fill-white" />
                                  <span>Cover (1st)</span>
                                </>
                              ) : (
                                <span>#{idx + 1}</span>
                              )}
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              title="Remove image"
                              className="absolute right-3 top-3 z-10 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-red-600 shadow hover:bg-red-600 hover:text-white transition"
                            >
                              <Trash2 size={12} />
                            </button>

                            {/* Image Thumbnail */}
                            <div className="h-28 w-full overflow-hidden rounded-xl bg-zinc-100 grid place-items-center">
                              <img
                                src={img.url}
                                alt={img.alt || `Product image ${idx + 1}`}
                                className="h-full w-full object-contain"
                              />
                            </div>

                            {/* Rearrange Action Controls */}
                            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-[10px]">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveImage(idx, idx - 1)}
                                  title="Move earlier in sequence"
                                  className="rounded-lg p-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <ArrowLeft size={13} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === form.images.length - 1}
                                  onClick={() => moveImage(idx, idx + 1)}
                                  title="Move later in sequence"
                                  className="rounded-lg p-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                  <ArrowRight size={13} />
                                </button>
                              </div>

                              {!isMain && (
                                <button
                                  type="button"
                                  onClick={() => setAsMainImage(idx)}
                                  className="flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 font-bold text-amber-800 hover:bg-amber-100"
                                >
                                  <Star size={10} />
                                  <span>Make Main</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-zinc-50 p-4 text-center text-xs text-zinc-500 border border-zinc-100">
                    No images uploaded yet. Upload images above to show in your store catalog.
                  </div>
                )}

                <Field label="Description">
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    className={`${inputClass} resize-y`}
                    placeholder="Describe the product..."
                  />
                </Field>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                {error}
              </motion.div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e4e7] bg-white px-5 py-4 sm:px-7">
            <p className="hidden text-xs text-[#71717a] sm:block">
              Fields marked * are required.
            </p>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#e4e4e7] px-4 py-3 text-sm font-semibold text-[#6f5c47] transition hover:bg-[#f4f4f5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-black px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                <CheckCircle2 size={17} />
                {saving ? "Saving..." : editing ? "Save changes" : "Add product"}
              </button>
            </div>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}

function DeleteModal({ product, onClose, onConfirm }) {
  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#20170f]/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="w-full max-w-md rounded-3xl border border-[#e4e4e7] bg-[#ffffff] p-6 shadow-2xl sm:p-7"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={24} />
        </div>
        <h3 className="mt-5 font-serif text-2xl font-bold text-[#18181b]">
          Delete this product?
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#7e6a53]">
          You're about to delete{" "}
          <span className="font-bold text-[#18181b]">{product.name}</span>.
          This removes it from the demo product list and cannot be undone from
          this screen.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e4e4e7] px-4 py-3 text-sm font-semibold text-[#6f5c47] hover:bg-[#f4f4f5]"
          >
            Keep product
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Delete product
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [stockFilter, setStockFilter] = useState("All stock");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [toast, setToast] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  async function fetchProducts() {
    try {
      setLoading(true);
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/products?limit=100`, {
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result?.data)) {
        const mapped = result.data.map((p) => {
          const imgs = Array.isArray(p.images)
            ? p.images.map((img) => typeof img === "string" ? { url: img, alt: p.title || "", publicId: null } : img)
            : (p.image ? [{ url: p.image, alt: p.title || "", publicId: null }] : []);
          const mainImg = imgs[0]?.url || p.image || "";
          return {
            id: p.sku || p.slug || String(p._id).slice(-6).toUpperCase(),
            _id: p._id,
            name: p.title || p.name || "Product",
            title: p.title || p.name || "Product",
            slug: p.slug || "",
            sku: p.sku || "—",
            category: p.category || "Remedies",
            price: Number(p.regularPrice ?? p.price ?? 0),
            compareAtPrice: Number(p.salePrice ?? p.compareAtPrice ?? 0),
            stock: Number(p.stock ?? p.stockQuantity ?? 25),
            status: ((p.status || "active").toLowerCase() === "published" || (p.status || "active").toLowerCase() === "active") ? "Active" : "Draft",
            image: mainImg,
            images: imgs,
            description: p.description || "",
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "",
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      console.error("Unable to load products:", err);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.status === "Active").length,
      low: products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10).length,
      out: products.filter((p) => Number(p.stock) === 0).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [product.name, product.sku, product.category]
          .some((value) => String(value || "").toLowerCase().includes(query));

      const matchesCategory =
        categoryFilter === "All categories" ||
        product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All statuses" || product.status === statusFilter;

      const matchesStock =
        stockFilter === "All stock" ||
        (stockFilter === "In stock" && Number(product.stock) > 10) ||
        (stockFilter === "Low stock" &&
          Number(product.stock) > 0 &&
          Number(product.stock) <= 10) ||
        (stockFilter === "Out of stock" && Number(product.stock) === 0);

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });

    result = [...result];

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "stock-low") {
      result.sort((a, b) => Number(a.stock) - Number(b.stock));
    } else {
      result.sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );
    }

    return result;
  }, [products, search, categoryFilter, statusFilter, stockFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function openAdd() {
    setModalProduct(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setModalProduct(product);
    setModalOpen(true);
  }

  async function saveProduct(form) {
    if (products.some(
      (p) =>
        p.sku?.toLowerCase() === form.sku?.toLowerCase() &&
        p.id !== modalProduct?.id
    )) {
      setToast("That SKU already exists. Please use a unique SKU.");
      return;
    }

    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const imgsToSend = Array.isArray(form.images) && form.images.length > 0
        ? form.images.map((img) => (typeof img === "string" ? { url: img, alt: form.name, publicId: null } : img))
        : (form.image ? [{ url: form.image, alt: form.name, publicId: null }] : []);

      const payload = {
        title: form.name,
        name: form.name,
        sku: form.sku,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        category: form.category,
        price: Number(form.price || 0),
        regularPrice: Number(form.price || 0),
        compareAtPrice: Number(form.compareAtPrice || 0),
        salePrice: Number(form.compareAtPrice || 0) || null,
        stockQuantity: Number(form.stock || 0),
        stock: Number(form.stock || 0),
        status: form.status === "Active" ? "active" : "draft",
        description: form.description || "",
        image: imgsToSend[0]?.url || form.image || "",
        images: imgsToSend,
      };

      if (modalProduct?._id) {
        const res = await fetch(`${apiBase}/api/admin/products/${modalProduct._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to update product");
        setToast("Product updated successfully.");
      } else {
        const res = await fetch(`${apiBase}/api/admin/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to create product");
        setToast("New product added successfully.");
      }
      fetchProducts();
    } catch (err) {
      console.error(err);
      setToast(err.message || "Failed to save product.");
    }

    setModalOpen(false);
    setModalProduct(null);
  }

  async function confirmDelete() {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      if (deleteProduct?._id) {
        const res = await fetch(`${apiBase}/api/admin/products/${deleteProduct._id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.error || "Failed to delete product");
      }
      setProducts((current) => current.filter((p) => p.id !== deleteProduct.id));
      setToast("Product deleted successfully.");
    } catch (err) {
      console.error("Delete product error:", err);
      setToast(err.message || "Could not delete product.");
    } finally {
      setDeleteProduct(null);
    }
  }

  function toggleStatus(product) {
    const nextStatus = product.status === "Active" ? "Draft" : "Active";
    setProducts((current) =>
      current.map((p) =>
        p.id === product.id ? { ...p, status: nextStatus } : p
      )
    );
    setToast(`Product set to ${nextStatus.toLowerCase()}.`);
  }

  function refreshProducts() {
    fetchProducts();
    setToast("Products refreshed from server.");
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("All categories");
    setStockFilter("All stock");
    setStatusFilter("All statuses");
    setSortBy("newest");
    setPage(1);
  }

  const filtersActive =
    search ||
    categoryFilter !== "All categories" ||
    stockFilter !== "All stock" ||
    statusFilter !== "All statuses";

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#18181b]">
            <Package size={15} />
            Store management
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181b] sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#71717a]">
            Manage your Vastu catalogue, pricing, inventory, and product visibility.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshProducts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] bg-white px-4 py-3 text-sm font-semibold text-[#3f3f46] transition hover:bg-[#f4f4f5]"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reset demo</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-black px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#18181b]/15 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Plus size={18} />
            Add product
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total products",
            value: stats.total,
            icon: Boxes,
            color: "bg-[#f4f4f5] text-[#18181b]",
          },
          {
            label: "Active products",
            value: stats.active,
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Low stock",
            value: stats.low,
            icon: AlertTriangle,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Out of stock",
            value: stats.out,
            icon: Package,
            color: "bg-red-50 text-red-700",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-[#e4e4e7] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${stat.color}`}>
                  <Icon size={19} />
                </div>
                <span className="text-[10px] font-semibold text-[#a1a1aa]">
                  Catalogue
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-[#71717a] sm:text-sm">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#18181b] sm:text-3xl">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Product table panel */}
      <section className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm">
        <div className="border-b border-[#e4e4e7] p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#18181b]">
                All products
              </h2>
              <p className="mt-1 text-xs text-[#71717a]">
                {filteredProducts.length} result
                {filteredProducts.length === 1 ? "" : "s"} in your catalogue
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3 sm:w-64">
                <Search size={17} className="shrink-0 text-[#a1a1aa]" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, SKU, category..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#18181b] outline-none placeholder:text-[#a1a1aa]"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="text-[#71717a] hover:text-[#18181b]"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                  showFilters || filtersActive
                    ? "border-[#cba96e] bg-[#faf2e3] text-[#18181b]"
                    : "border-[#e4e4e7] bg-white text-[#3f3f46] hover:bg-[#f4f4f5]"
                }`}
              >
                <SlidersHorizontal size={16} />
                Filters
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
                      Category
                    </span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option>All categories</option>
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">
                      Inventory
                    </span>
                    <select
                      value={stockFilter}
                      onChange={(e) => {
                        setStockFilter(e.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option>All stock</option>
                      <option>In stock</option>
                      <option>Low stock</option>
                      <option>Out of stock</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[11px] font-bold text-[#52525b]">
                      Visibility
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
                      <option>Active</option>
                      <option>Draft</option>
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
                      <option value="name">Name: A–Z</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="stock-low">Lowest stock first</option>
                    </select>
                  </label>

                  {filtersActive && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#18181b] hover:underline sm:col-span-2 xl:col-span-4"
                    >
                      <X size={14} /> Clear active filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filtersActive && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#71717a]">Active filters:</span>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] px-3 py-1.5 text-[10px] font-semibold text-[#18181b]"
                >
                  Search: {search} <X size={12} />
                </button>
              )}
              {categoryFilter !== "All categories" && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("All categories");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] px-3 py-1.5 text-[10px] font-semibold text-[#18181b]"
                >
                  {categoryFilter} <X size={12} />
                </button>
              )}
              {statusFilter !== "All statuses" && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("All statuses");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] px-3 py-1.5 text-[10px] font-semibold text-[#18181b]"
                >
                  {statusFilter} <X size={12} />
                </button>
              )}
              {stockFilter !== "All stock" && (
                <button
                  type="button"
                  onClick={() => {
                    setStockFilter("All stock");
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f5] px-3 py-1.5 text-[10px] font-semibold text-[#18181b]"
                >
                  {stockFilter} <X size={12} />
                </button>
              )}
            </div>
          )}
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
        ) : filteredProducts.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#f4f4f5] text-[#18181b]">
              <Search size={25} />
            </div>
            <h3 className="mt-4 font-serif text-xl font-bold text-[#18181b]">
              No products found
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#71717a]">
              Try another search or clear your filters to see more products.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-[#d4d4d8] px-5 py-3 text-sm font-bold text-[#18181b] hover:bg-[#f4f4f5]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-[#fcfaf6] text-[10px] uppercase tracking-[0.13em] text-[#71717a]">
                    <th className="px-5 py-4 font-bold">Product</th>
                    <th className="px-4 py-4 font-bold">Category / SKU</th>
                    <th className="px-4 py-4 font-bold">Price</th>
                    <th className="px-4 py-4 font-bold">Inventory</th>
                    <th className="px-4 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {visibleProducts.map((product, index) => {
                    const stock = getStockInfo(product.stock);
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025 }}
                        className="group transition hover:bg-[#fafafa]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage product={product} />
                            <div className="min-w-0 max-w-[240px]">
                              <p className="truncate text-sm font-bold text-[#18181b]">
                                {product.name}
                              </p>
                              <p className="mt-1 text-[10px] text-[#a1a1aa]">
                                {product.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-[#6f5c47]">
                            {product.category}
                          </p>
                          <p className="mt-1 text-[10px] text-[#a1a1aa]">
                            SKU: {product.sku}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="text-sm font-bold text-[#18181b]">
                            {formatINR(product.price)}
                          </p>
                          {Number(product.compareAtPrice) > Number(product.price) && (
                            <p className="mt-1 text-[10px] text-[#a1a1aa] line-through">
                              {formatINR(product.compareAtPrice)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-[#18181b]">
                            {product.stock}
                          </p>
                          <span
                            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${stock.className}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${stock.dot}`} />
                            {stock.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => toggleStatus(product)}
                            title="Click to change visibility"
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition hover:ring-2 hover:ring-[#cba96e]/30 ${
                              product.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                product.status === "Active"
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {product.status}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e4e7] text-[#18181b] transition hover:border-[#cba96e] hover:bg-[#faf2e3]"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteProduct(product)}
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-[#f0dada] text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet product cards */}
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 lg:hidden">
              {visibleProducts.map((product, index) => {
                const stock = getStockInfo(product.stock);
                return (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className="rounded-2xl border border-[#e4e4e7] bg-white p-4 transition hover:border-[#d4d4d8] hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <ProductImage product={product} large={false} />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-bold leading-5 text-[#18181b]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a1a1aa]">
                          {product.id} · {product.sku}
                        </p>
                        <p className="mt-2 text-base font-bold text-[#18181b]">
                          {formatINR(product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10px] font-semibold text-[#18181b]">
                        {product.category}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${stock.className}`}>
                        {stock.label} · {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStatus(product)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          product.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {product.status}
                      </button>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-[#e4e4e7] pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4e4e7] px-3 py-2.5 text-xs font-bold text-[#18181b] hover:bg-[#faf2e3]"
                      >
                        <Pencil size={14} /> Edit product
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteProduct(product)}
                        aria-label={`Delete ${product.name}`}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-[#f0dada] text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-[#e4e4e7] bg-[#ffffff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-[#71717a]">
                Showing{" "}
                <span className="font-bold text-[#18181b]">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                {"–"}
                <span className="font-bold text-[#18181b]">
                  {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[#18181b]">
                  {filteredProducts.length}
                </span>{" "}
                products
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e4e7] px-3 text-xs font-semibold text-[#6f5c47] transition hover:bg-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span className="min-w-16 text-center text-xs font-semibold text-[#6f5c47]">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e4e4e7] px-3 text-xs font-semibold text-[#6f5c47] transition hover:bg-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-4 py-3 text-xs leading-5 text-[#71717a]">
        <Tag size={15} className="mt-0.5 shrink-0 text-[#18181b]" />
        <p>
          <span className="font-bold text-[#6f5130]">Demo mode:</span> product
          changes are saved only in this browser's local storage. They do not
          update your storefront catalogue or a database.
        </p>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <ProductModal
            key={modalProduct?.id || "new-product"}
            product={modalProduct}
            onClose={() => {
              setModalOpen(false);
              setModalProduct(null);
            }}
            onSave={saveProduct}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteProduct && (
          <DeleteModal
            key={deleteProduct.id}
            product={deleteProduct}
            onClose={() => setDeleteProduct(null)}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            role="status"
            className="fixed bottom-5 right-4 z-[150] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-[#d9c49f] bg-[#ffffff] px-4 py-3.5 text-sm font-semibold text-[#18181b] shadow-xl sm:bottom-7 sm:right-7"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={17} />
            </span>
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast("")}
              aria-label="Dismiss notification"
              className="ml-1 text-[#9b8a77] hover:text-[#18181b]"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
