
"use client";

import ResetPasswordModal from "@/components/admin/ResetPasswordModal";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Settings,
  Store,
  Wrench,
  CreditCard,
  Truck,
  ShoppingBag,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Palette,
  Search,
  Bell,
  ShieldCheck,
  Building2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Eye,
  Globe,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  LockKeyhole,
  X,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  SlidersHorizontal,
  Receipt,
  MessageSquare,
  Heart,
  Plus,
  Trash2,
  Share2,
} from "lucide-react";
import SocialIcon, { getPlatformFromUrl } from "@/components/admin/SocialIcon";

const STORAGE_KEY = "bsv-admin-store-settings";

const defaultSettings = {
  general: {
    storeName: "Bhuwneshwari Scientific Vastu",
    tagline: "Bring balance and harmony to your spaces",
    supportEmail: "support@bhuwneshwari.com",
    supportPhone: "+91 8690708302",
    contactWhatsapp: "918690708302",
    currency: "INR",
    timezone: "Asia/Kolkata",
    country: "India",
    address: {
      line1: "Plot no 57 near khandelwal namkeen",
      line2: "Ward No 36, Saipura, Sanganer",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302029",
      country: "India",
      googleMapsUrl: "https://maps.google.com/?q=26.8289,75.7789",
    },
    workingHours: "Monday – Saturday: 9:00 AM – 7:00 PM",
    gstin: "08ABCDE1234F1Z5",
    logoUrl: "",
    footerText: "© Bhuwneshwari Scientific Vastu. All rights reserved.",
    socialLinks: [
      { id: "instagram", platform: "instagram", name: "Instagram", url: "https://www.instagram.com/bhuwneshwarivastu", active: true },
      { id: "youtube", platform: "youtube", name: "YouTube", url: "https://www.youtube.com/@bhuwneshwarivastu", active: true },
      { id: "facebook", platform: "facebook", name: "Facebook", url: "https://www.facebook.com/bhuwneshwarivastu", active: true },
      { id: "whatsapp", platform: "whatsapp", name: "WhatsApp", url: "https://wa.me/918690708302", active: true },
    ],
  },
  maintenance: {
    enabled: false,
    message:
      "We are making improvements to our store. Please check back soon.",
    allowAdminAccess: true,
    showEstimatedReturn: false,
    estimatedReturn: "",
    allowNewsletter: true,
  },
  storefront: {
    primaryColor: "#18181b",
    accentColor: "#18181b",
    announcementEnabled: false,
    announcementText: "Explore our latest Vastu collections.",
    showHero: true,
    showProducts: true,
    showServices: true,
    showTestimonials: true,
    showBlog: true,
    showTraining: true,
    showConsultationCTA: true,
    showFloatingBookButton: true,
    showNewsletter: true,
    showFooterSocials: true,
    productsPerPage: "12",
  },
  payments: {
    codEnabled: true,
    onlineEnabled: true,
    razorpayEnabled: false,
    stripeEnabled: false,
    upiEnabled: true,
    bankTransferEnabled: false,
    testMode: true,
    autoCapture: true,
    minimumOrder: "0",
    currency: "INR",
    refundPolicy:
      "Refunds are reviewed according to the store's published refund policy.",
  },
  shipping: {
    shippingEnabled: true,
    freeShippingEnabled: false,
    freeShippingThreshold: "1999",
    flatRateEnabled: true,
    flatRate: "99",
    localPickupEnabled: false,
    processingDays: "2",
    deliveryNote: "Delivery timelines depend on the destination and courier.",
    allowedCountries: "India",
  },
  orders: {
    autoConfirm: false,
    allowCancellation: true,
    cancellationWindow: "24",
    lowStockAlerts: true,
    lowStockThreshold: "5",
    orderEmailEnabled: true,
    invoiceEnabled: true,
    prefix: "BSV",
  },
  consultations: {
    enabled: true,
    onlineEnabled: true,
    inPersonEnabled: true,
    requireAdvancePayment: false,
    allowReschedule: true,
    minimumNotice: "24",
    bufferMinutes: "15",
    confirmationEmail: true,
  },
  training: {
    enabled: true,
    enrollmentEnabled: true,
    allowWaitlist: true,
    certificateEnabled: false,
    confirmationEmail: true,
    showFees: true,
  },
  blog: {
    enabled: true,
    commentsEnabled: false,
    moderationRequired: true,
    showAuthor: true,
    showPublishDate: true,
    showReadingTime: true,
    postsPerPage: "9",
    defaultCategory: "Vastu Basics",
  },
  seo: {
    siteTitle: "Bhuwneshwari Scientific Vastu",
    description:
      "Explore Vastu products, expert consultations, training and practical guidance.",
    keywords: "Vastu Shastra, Vastu consultation, Vastu products",
    canonicalUrl: "",
    robotsIndex: true,
    sitemapEnabled: true,
    socialImage: "",
  },
  notifications: {
    orderNotifications: true,
    paymentNotifications: true,
    consultationNotifications: true,
    trainingNotifications: true,
    contactFormNotifications: true,
    newsletterNotifications: false,
    emailFromName: "Bhuwneshwari Scientific Vastu",
    emailReplyTo: "support@example.com",
  },
  security: {
    sessionTimeout: "60",
    loginAlerts: true,
    twoFactorRequired: false,
    customerRegistration: true,
    passwordResetEnabled: true,
    rateLimitEnabled: true,
  },
  donation: {
    enabled: true,
    ngoName: "Choti Khushi NGO - feeding work for Birds",
    suggestedAmounts: "500, 1000, 10000",
    description: "Support daily feeding and water bowls for sacred birds and pigeons.",
    allowCustomAmount: true,
  },
};

const sections = [
  { id: "general", label: "General & Office", description: "Store identity, mobile & address", icon: Store },
  { id: "social", label: "Social Media & Icons", description: "Manage social profiles & icons", icon: Share2 },
  { id: "maintenance", label: "Maintenance mode", description: "Store availability", icon: Wrench },
  { id: "storefront", label: "Frontend & appearance", description: "Control website sections", icon: Palette },
  { id: "donation", label: "NGO Donation", description: "Bird feeding donation settings & amounts", icon: Heart },
  { id: "payments", label: "Payments", description: "Payment methods and checkout", icon: CreditCard },
  { id: "shipping", label: "Shipping & delivery", description: "Rates and delivery rules", icon: Truck },
  { id: "orders", label: "Orders & inventory", description: "Order handling and stock", icon: ShoppingBag },
  { id: "consultations", label: "Consultations", description: "Booking preferences", icon: CalendarDays },
  { id: "training", label: "Training", description: "Courses and enrollment", icon: GraduationCap },
  { id: "blog", label: "Blog", description: "Publishing preferences", icon: BookOpen },
  { id: "seo", label: "SEO & discovery", description: "Search engine settings", icon: Search },
  { id: "notifications", label: "Notifications", description: "Email alert preferences", icon: Bell },
  { id: "security", label: "Security", description: "Account and access policies", icon: ShieldCheck },
];

const cloneDefaults = () => JSON.parse(JSON.stringify(defaultSettings));

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#8f6b36]" : "bg-[#d8d0c3]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({ title, description, children, last = false }) {
  return (
    <div
      className={`flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center ${
        last ? "" : "border-b border-[#e4e4e7]"
      }`}
    >
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-[#18181b]">{title}</p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[#71717a]">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Field({ label, description, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#594a36]">
        {label}
      </label>
      {children}
      {description && (
        <p className="mt-1.5 text-[11px] leading-5 text-[#938572]">{description}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e4e4e7] bg-[#ffffff] px-3.5 py-3 text-sm text-[#18181b] outline-none transition placeholder:text-[#b0a596] focus:border-[#27272a] focus:ring-2 focus:ring-[#27272a]/10";

function Panel({ title, description, children, icon: Icon }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white">
      <div className="flex items-start gap-3 border-b border-[#e4e4e7] px-5 py-5 sm:px-6">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f5] text-[#18181b]">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-[#18181b]">{title}</h3>
          {description && (
            <p className="mt-1 text-xs leading-5 text-[#71717a]">{description}</p>
          )}
        </div>
      </div>
      <div className="px-5 sm:px-6">{children}</div>
    </section>
  );
}

function Notice({ type = "info", children }) {
  const styles = {
    info: "border-blue-100 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  };

  const Icon = type === "warning" ? AlertTriangle : type === "success" ? CheckCircle2 : Info;

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-4 text-xs leading-5 ${styles[type]}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function ConfirmModal({ title, description, confirmLabel, danger, onCancel, onConfirm }) {
  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#21190f]/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-md rounded-3xl border border-[#eee5d8] bg-[#ffffff] p-6 shadow-2xl sm:p-8"
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? "bg-amber-50 text-amber-700" : "bg-[#f4f4f5] text-[#18181b]"}`}>
          {danger ? <AlertTriangle size={22} /> : <Settings size={22} />}
        </div>
        <h3 className="mt-5 font-serif text-2xl text-[#18181b]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#52525b]">{description}</p>
        <div className="mt-7 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-[#d4d4d8] px-4 py-3 text-sm font-semibold text-[#3f3f46]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white ${
              danger ? "bg-amber-700 hover:bg-amber-800" : "bg-[#18181b] hover:bg-[#624a2d]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(cloneDefaults);
  const [savedSettings, setSavedSettings] = useState(cloneDefaults);
  const [activeSection, setActiveSection] = useState("general");
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState("instagram");
  const [newSocialName, setNewSocialName] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  const updateAddressField = (k, val) => {
    setSettings((prev) => {
      const currentAddr = typeof prev.general?.address === "object" && prev.general?.address ? prev.general.address : {};
      return {
        ...prev,
        general: {
          ...prev.general,
          address: {
            ...currentAddr,
            [k]: val,
          },
        },
      };
    });
  };

  const handleAddSocial = (e) => {
    e?.preventDefault?.();
    if (!newSocialUrl.trim()) return;
    const platform = newSocialPlatform || getPlatformFromUrl(newSocialUrl) || "custom";
    const name = newSocialName.trim() || platform.charAt(0).toUpperCase() + platform.slice(1);
    const newLink = {
      id: `soc-${Date.now()}`,
      platform,
      name,
      url: newSocialUrl.trim(),
      active: true,
    };
    const currentLinks = Array.isArray(settings.general?.socialLinks) ? [...settings.general.socialLinks] : [];
    currentLinks.push(newLink);
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        socialLinks: currentLinks,
      },
      socialLinks: currentLinks,
    }));
    setNewSocialName("");
    setNewSocialUrl("");
    setToast(`Added ${name} social profile.`);
  };

  const handleRemoveSocial = (id) => {
    const currentLinks = (Array.isArray(settings.general?.socialLinks) ? settings.general.socialLinks : []).filter(
      (item) => item.id !== id
    );
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        socialLinks: currentLinks,
      },
      socialLinks: currentLinks,
    }));
    setToast("Social profile removed.");
  };

  const handleToggleSocial = (id, active) => {
    const currentLinks = (Array.isArray(settings.general?.socialLinks) ? settings.general.socialLinks : []).map(
      (item) => (item.id === id ? { ...item, active } : item)
    );
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        socialLinks: currentLinks,
      },
      socialLinks: currentLinks,
    }));
  };

  const handleUpdateSocialUrl = (id, url) => {
    const currentLinks = (Array.isArray(settings.general?.socialLinks) ? settings.general.socialLinks : []).map(
      (item) => (item.id === id ? { ...item, url, platform: item.platform === "custom" ? getPlatformFromUrl(url) : item.platform } : item)
    );
    setSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        socialLinks: currentLinks,
      },
      socialLinks: currentLinks,
    }));
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
        const res = await fetch(`${apiBase}/api/admin/settings`, { credentials: "include", cache: "no-store" });
        const result = await res.json();
        if (result?.success && result?.data) {
          const merged = cloneDefaults();
          Object.keys(merged).forEach((section) => {
            if (result.data[section] && typeof result.data[section] === "object") {
              merged[section] = { ...merged[section], ...result.data[section] };
            }
          });
          if (typeof merged.general?.address !== "object" || !merged.general?.address) {
            merged.general.address = { ...defaultSettings.general.address, line1: String(merged.general?.address || "") };
          } else {
            merged.general.address = { ...defaultSettings.general.address, ...merged.general.address };
          }
          const links = Array.isArray(result.data.general?.socialLinks) && result.data.general.socialLinks.length > 0
            ? result.data.general.socialLinks
            : (Array.isArray(result.data.socialLinks) && result.data.socialLinks.length > 0 ? result.data.socialLinks : defaultSettings.general.socialLinks);
          merged.general.socialLinks = links;
          merged.socialLinks = links;
          setSettings(merged);
          setSavedSettings(JSON.parse(JSON.stringify(merged)));
        }
      } catch (err) {
        console.error("Unable to load settings from server:", err);
      } finally {
        setHydrated(true);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const update = (section, key, value) => {
    setSettings((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [key]: value,
      },
    }));
  };

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings]
  );

  const filteredSections = sections.filter((section) =>
    `${section.label} ${section.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const saveSettings = async () => {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to save");
      setSavedSettings(JSON.parse(JSON.stringify(settings)));
      setToast("Store settings saved to server successfully.");
    } catch (err) {
      console.error("Unable to save settings:", err);
      setToast(err.message || "Could not save settings to server.");
    }
  };

  const resetSettings = () => {
    setSettings(JSON.parse(JSON.stringify(savedSettings)));
    setToast("Unsaved changes discarded.");
  };

  const resetAllSettings = async () => {
    const defaults = cloneDefaults();
    try {
      const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(defaults),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result?.error || "Failed to reset");
      setSettings(defaults);
      setSavedSettings(defaults);
      setToast("Settings reset to defaults on server.");
    } catch (err) {
      console.error("Unable to reset settings:", err);
      setToast(err.message || "Failed to reset settings.");
    } finally {
      setConfirmAction(null);
    }
  };

  const setActive = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const sectionTitle = sections.find((item) => item.id === activeSection)?.label || "General";
  const sectionDescription = sections.find((item) => item.id === activeSection)?.description || "";

  const toggle = (section, key, title, description) => (
    <SettingRow title={title} description={description}>
      <Toggle
        checked={Boolean(settings[section][key])}
        onChange={(value) => update(section, key, value)}
      />
    </SettingRow>
  );

  const field = (label, key, placeholder = "", type = "text", description = "") => (
    <Field label={label} description={description}>
      <input
        type={type}
        className={inputClass}
        value={settings[activeSection][key] ?? ""}
        onChange={(event) => update(activeSection, key, event.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );

  const selectField = (label, key, options, description = "") => (
    <Field label={label} description={description}>
      <select
        className={inputClass}
        value={settings[activeSection][key]}
        onChange={(event) => update(activeSection, key, event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-5 text-[#18181b] sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#18181b]">
              <SlidersHorizontal size={16} />
              Administration
            </div>
            <h1 className="font-serif text-3xl tracking-tight text-[#18181b] sm:text-4xl">
              Store settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817565]">
              Manage store preferences, checkout options, content, and frontend configuration from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetSettings}
              disabled={!dirty}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e6dccb] bg-white px-4 py-3 text-sm font-semibold text-[#3f3f46] transition hover:bg-[#f5efe5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={16} /> Discard changes
            </button>
            <button
              onClick={saveSettings}
              disabled={!dirty || !hydrated}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#18181b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#624a2d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={16} /> Save settings
            </button>
          </div>
        </div>

        {/* Status banner */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className={`flex items-center gap-3 rounded-2xl border p-4 ${settings.maintenance.enabled ? "border-amber-200 bg-amber-50" : "border-[#e4e4e7] bg-white"}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${settings.maintenance.enabled ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
              {settings.maintenance.enabled ? <Wrench size={19} /> : <CheckCircle2 size={19} />}
            </div>
            <div>
              <p className="text-xs text-[#817565]">Store availability setting</p>
              <p className="mt-1 text-sm font-semibold text-[#18181b]">
                {settings.maintenance.enabled ? "Maintenance enabled" : "Normal mode selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#e4e4e7] bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2e8d5] text-[#8f6b33]">
              <CreditCard size={19} />
            </div>
            <div>
              <p className="text-xs text-[#817565]">Payment configuration</p>
              <p className="mt-1 text-sm font-semibold text-[#18181b]">
                {settings.payments.onlineEnabled || settings.payments.codEnabled ? "Methods selected" : "No methods selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#e4e4e7] bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Globe size={19} />
            </div>
            <div>
              <p className="text-xs text-[#817565]">Frontend controls</p>
              <p className="mt-1 text-sm font-semibold text-[#18181b]">
                {[
                  settings.storefront.showHero,
                  settings.storefront.showProducts,
                  settings.storefront.showServices,
                  settings.storefront.showBlog,
                ].filter(Boolean).length} key sections enabled
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 px-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Settings Navigation</p>
            </div>
            <nav className="space-y-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const active = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-zinc-200 pt-4 mt-3">
              <button
                onClick={() => setConfirmAction("reset")}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
              >
                <RotateCcw size={15} /> Reset to defaults
              </button>
            </div>
          </aside>

          {/* Settings content */}
          <div className="min-w-0 space-y-5">
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#e4e4e7] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f5] text-[#18181b]">
                  {(() => {
                    const Icon = sections.find((item) => item.id === activeSection)?.icon || Settings;
                    return <Icon size={21} />;
                  })()}
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-[#18181b]">{sectionTitle}</h2>
                  <p className="mt-1 text-sm text-[#71717a]">{sectionDescription}</p>
                </div>
              </div>
              {dirty && (
                <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-800">
                  Unsaved changes
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* GENERAL */}
                {activeSection === "general" && (
                  <>
                    <Panel title="Store identity & Branding" description="Your store's name, brand tagline and copyright." icon={Building2}>
                      <div className="grid gap-5 py-5 sm:grid-cols-2">
                        {field("Store name", "storeName", "Your store name")}
                        {field("Tagline", "tagline", "A short brand statement")}
                        <div className="sm:col-span-2">
                          {field("Logo image URL", "logoUrl", "https://example.com/logo.png", "url")}
                        </div>
                        <div className="sm:col-span-2">
                          <Field label="Footer copyright text">
                            <textarea
                              className={inputClass}
                              rows={2}
                              value={settings.general.footerText}
                              onChange={(event) => update("general", "footerText", event.target.value)}
                            />
                          </Field>
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Direct Contact & Mobile Numbers" description="Customer support phone, official WhatsApp number and email (updates live everywhere)." icon={Phone}>
                      <div className="grid gap-5 py-5 sm:grid-cols-2">
                        <div>
                          <Field label="Customer Care / Mobile Phone" description="Displays in Header, Footer, Contact, and Invoices.">
                            <input
                              type="tel"
                              className={inputClass}
                              value={settings.general.supportPhone || ""}
                              onChange={(e) => update("general", "supportPhone", e.target.value)}
                              placeholder="+91 8690708302"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="WhatsApp Desk Number" description="Used for 1-click WhatsApp buttons and training link.">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.contactWhatsapp || ""}
                              onChange={(e) => update("general", "contactWhatsapp", e.target.value)}
                              placeholder="918690708302"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Official Support Email" description="Used across customer emails, footer, and invoices.">
                            <input
                              type="email"
                              className={inputClass}
                              value={settings.general.supportEmail || ""}
                              onChange={(e) => update("general", "supportEmail", e.target.value)}
                              placeholder="support@bhuwneshwari.com"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Consultation Hours" description="Displayed on Footer, Contact and booking pages.">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.workingHours || ""}
                              onChange={(e) => update("general", "workingHours", e.target.value)}
                              placeholder="Monday – Saturday: 9:00 AM – 7:00 PM"
                            />
                          </Field>
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Official Head Office Location & Address" description="Live office address and Google Maps coordinates used on contact page, invoices, and footer." icon={MapPin}>
                      <div className="grid gap-5 py-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="Address Line 1 (Street / Building)" description="Primary office premises address">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.address?.line1 || (typeof settings.general.address === "string" ? settings.general.address : "")}
                              onChange={(e) => updateAddressField("line1", e.target.value)}
                              placeholder="Plot no 57 near khandelwal namkeen"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Address Line 2 (Area / Ward / Landmark)">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.address?.line2 || ""}
                              onChange={(e) => updateAddressField("line2", e.target.value)}
                              placeholder="Ward No 36, Saipura, Sanganer"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="City">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.address?.city || ""}
                              onChange={(e) => updateAddressField("city", e.target.value)}
                              placeholder="Jaipur"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="State">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.address?.state || "Rajasthan"}
                              onChange={(e) => updateAddressField("state", e.target.value)}
                              placeholder="Rajasthan"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Postal Code / PIN">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.address?.postalCode || ""}
                              onChange={(e) => updateAddressField("postalCode", e.target.value)}
                              placeholder="302029"
                            />
                          </Field>
                        </div>
                        <div className="sm:col-span-2">
                          <Field label="Google Maps Location URL" description="Direct link used when clients click on Office Location / Map pin">
                            <div className="flex gap-2">
                              <input
                                type="url"
                                className={inputClass}
                                value={settings.general.address?.googleMapsUrl || ""}
                                onChange={(e) => updateAddressField("googleMapsUrl", e.target.value)}
                                placeholder="https://maps.google.com/?q=..."
                              />
                              {settings.general.address?.googleMapsUrl && (
                                <a
                                  href={settings.general.address.googleMapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e4e4e7] bg-[#f4f4f5] text-[#18181b] hover:bg-zinc-200"
                                  title="Test Google Maps Link"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                            </div>
                          </Field>
                        </div>
                        <div>
                          <Field label="Official GSTIN (GST Number)" description="Printed on tax invoices for consultations and products">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.gstin || ""}
                              onChange={(e) => update("general", "gstin", e.target.value)}
                              placeholder="08ABCDE1234F1Z5"
                            />
                          </Field>
                        </div>
                        <div>
                          <Field label="Country">
                            <input
                              type="text"
                              className={inputClass}
                              value={settings.general.country || "India"}
                              onChange={(e) => update("general", "country", e.target.value)}
                              placeholder="India"
                            />
                          </Field>
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Regional preferences" description="Formatting preferences for the store." icon={Globe}>
                      <div className="grid gap-5 py-5 sm:grid-cols-2">
                        <Field label="Store currency">
                          <select className={inputClass} value={settings.general.currency} onChange={(event) => update("general", "currency", event.target.value)}>
                            <option value="INR">INR — Indian Rupee</option>
                            <option value="USD">USD — US Dollar</option>
                            <option value="GBP">GBP — Pound Sterling</option>
                            <option value="EUR">EUR — Euro</option>
                          </select>
                        </Field>
                        <Field label="Timezone">
                          <select className={inputClass} value={settings.general.timezone} onChange={(event) => update("general", "timezone", event.target.value)}>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York</option>
                            <option value="Europe/London">Europe/London</option>
                          </select>
                        </Field>
                      </div>
                    </Panel>
                  </>
                )}

                {/* SOCIAL MEDIA & ICONS */}
                {activeSection === "social" && (
                  <>
                    <Panel title="Social Media Profiles & Dynamic Icons" description="Admin-controlled social platforms. Add, edit, or toggle icons — changes reflect live across Header, Footer, and Contact page." icon={Share2}>
                      <div className="py-5 space-y-4">
                        {Array.isArray(settings.general?.socialLinks) && settings.general.socialLinks.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {settings.general.socialLinks.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition ${
                                  item.active !== false ? "border-[#e4e4e7] bg-white shadow-sm" : "border-dashed border-zinc-300 bg-zinc-50 opacity-60"
                                }`}
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-zinc-100 text-[#18181b]">
                                    <SocialIcon platform={item.platform} size={22} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm text-[#18181b] truncate">{item.name || item.platform}</span>
                                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                        {item.platform}
                                      </span>
                                    </div>
                                    <input
                                      type="url"
                                      className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-[#18181b] outline-none focus:border-[#18181b] focus:bg-white"
                                      value={item.url}
                                      onChange={(e) => handleUpdateSocialUrl(item.id, e.target.value)}
                                      placeholder="https://..."
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <Toggle
                                    checked={item.active !== false}
                                    onChange={(val) => handleToggleSocial(item.id, val)}
                                  />
                                  <div className="flex items-center gap-1 mt-1">
                                    {item.url && (
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-[#18181b]"
                                        title="Open link"
                                      >
                                        <ExternalLink size={13} />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSocial(item.id)}
                                      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500 text-xs">
                            No social icons added yet. Use the form below to add your first social media link.
                          </div>
                        )}

                        {/* Add New Social Platform */}
                        <div className="mt-6 rounded-2xl border border-[#e4e4e7] bg-[#fafafa] p-5">
                          <h4 className="text-sm font-bold text-[#18181b] flex items-center gap-2">
                            <Plus size={16} /> Add New Social Media Platform
                          </h4>
                          <p className="mt-1 text-xs text-[#71717a]">
                            Select a platform or enter any custom URL. The correct icon will automatically be matched and rendered.
                          </p>

                          <div className="mt-4 grid gap-4 sm:grid-cols-3 items-end">
                            <div>
                              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Platform</label>
                              <select
                                className={inputClass}
                                value={newSocialPlatform}
                                onChange={(e) => {
                                  const p = e.target.value;
                                  setNewSocialPlatform(p);
                                  if (!newSocialName || ["Instagram", "YouTube", "Facebook", "WhatsApp", "X (Twitter)", "LinkedIn", "Telegram", "Pinterest", "Threads"].includes(newSocialName)) {
                                    setNewSocialName(p === "twitter" ? "X (Twitter)" : p.charAt(0).toUpperCase() + p.slice(1));
                                  }
                                }}
                              >
                                <option value="instagram">Instagram</option>
                                <option value="youtube">YouTube</option>
                                <option value="facebook">Facebook</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="twitter">X (Twitter)</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="telegram">Telegram</option>
                                <option value="pinterest">Pinterest</option>
                                <option value="threads">Threads</option>
                                <option value="custom">Other / Custom Website</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Display Label</label>
                              <input
                                type="text"
                                className={inputClass}
                                value={newSocialName}
                                onChange={(e) => setNewSocialName(e.target.value)}
                                placeholder="e.g. Official Instagram"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Profile URL</label>
                              <input
                                type="url"
                                className={inputClass}
                                value={newSocialUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewSocialUrl(val);
                                  if (newSocialPlatform === "custom" && val) {
                                    const detected = getPlatformFromUrl(val);
                                    if (detected !== "custom") setNewSocialPlatform(detected);
                                  }
                                }}
                                placeholder="https://instagram.com/yourhandle"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-500">Live Icon Preview:</span>
                              <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-300 bg-white text-[#18181b] shadow-sm">
                                <SocialIcon platform={newSocialPlatform || getPlatformFromUrl(newSocialUrl)} size={18} />
                              </div>
                              <span className="text-xs font-semibold text-zinc-700 capitalize">{newSocialPlatform}</span>
                            </div>

                            <button
                              type="button"
                              onClick={handleAddSocial}
                              disabled={!newSocialUrl.trim()}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#18181b] px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#3f3f46] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus size={15} /> Add Platform
                            </button>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </>
                )}

                {/* MAINTENANCE */}
                {activeSection === "maintenance" && (
                  <>
                    <div className={`rounded-2xl border p-5 sm:p-6 ${settings.maintenance.enabled ? "border-amber-200 bg-amber-50" : "border-[#e4e4e7] bg-white"}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${settings.maintenance.enabled ? "bg-amber-100 text-amber-800" : "bg-[#f4f4f5] text-[#18181b]"}`}>
                          <Wrench size={23} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-[#18181b]">Store maintenance mode</h3>
                            {settings.maintenance.enabled && <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-900">ENABLED IN SETTINGS</span>}
                          </div>
                          <p className="mt-2 text-xs leading-6 text-[#52525b]">
                            Configure the intended maintenance experience while the storefront is being updated.
                          </p>
                        </div>
                        <Toggle
                          checked={settings.maintenance.enabled}
                          onChange={(value) => {
                            if (value) {
                              setConfirmAction("maintenance-on");
                            } else {
                              setConfirmAction("maintenance-off");
                            }
                          }}
                        />
                      </div>
                    </div>

                    <Panel title="Maintenance page" description="Configure the message visitors would see when maintenance mode is connected to your frontend." icon={Eye}>
                      <div className="space-y-5 py-5">
                        <Field label="Visitor message">
                          <textarea className={inputClass} rows={4} value={settings.maintenance.message} onChange={(event) => update("maintenance", "message", event.target.value)} />
                        </Field>
                        {toggle("maintenance", "allowAdminAccess", "Allow admin access", "The intended policy is to let authorized administrators access the dashboard. Backend access rules must enforce this.")}
                        {toggle("maintenance", "showEstimatedReturn", "Show estimated return time", "Display an estimated reopening time on the maintenance page.")}
                        {settings.maintenance.showEstimatedReturn && (
                          <Field label="Estimated reopening date and time">
                            <input type="datetime-local" className={inputClass} value={settings.maintenance.estimatedReturn} onChange={(event) => update("maintenance", "estimatedReturn", event.target.value)} />
                          </Field>
                        )}
                        {toggle("maintenance", "allowNewsletter", "Keep newsletter signup visible", "Allow visitors to register for updates during maintenance, once the form is connected.")}
                      </div>
                    </Panel>

                    <Notice type="warning">
                      Turning this setting on only changes the saved configuration in this demo. To actually block public pages, implement a server-side Next.js middleware or layout check, protect admin routes separately, and return an appropriate maintenance response.
                    </Notice>
                  </>
                )}

                {/* STOREFRONT */}
                {activeSection === "storefront" && (
                  <>
                    <Panel title="Brand appearance" description="Configure the colors used by your storefront components." icon={Palette}>
                      <div className="grid gap-5 py-5 sm:grid-cols-2">
                        {[
                          ["Primary brand color", "primaryColor"],
                          ["Accent color", "accentColor"],
                        ].map(([label, key]) => (
                          <Field key={key} label={label}>
                            <div className="flex items-center gap-3 rounded-xl border border-[#e4e4e7] bg-[#ffffff] p-2">
                              <input type="color" value={settings.storefront[key]} onChange={(event) => update("storefront", key, event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
                              <input value={settings.storefront[key]} onChange={(event) => update("storefront", key, event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-sm uppercase outline-none" />
                            </div>
                          </Field>
                        ))}
                      </div>
                      <div className="mb-5 rounded-2xl border border-[#eee5d8] p-4">
                        <p className="mb-3 text-xs font-semibold text-[#71717a]">Color preview</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: settings.storefront.primaryColor }}>Primary button</div>
                          <div className="rounded-full border px-5 py-3 text-sm font-semibold" style={{ borderColor: settings.storefront.accentColor, color: settings.storefront.accentColor }}>Accent link</div>
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Homepage & navigation sections" description="Choose which sections should be shown when your frontend reads these settings." icon={LayoutDashboard}>
                      <div className="py-1">
                        {toggle("storefront", "showHero", "Homepage hero section", "Main banner, headline and primary call to action.")}
                        {toggle("storefront", "showProducts", "Featured products", "Show product listings or featured product collections.")}
                        {toggle("storefront", "showServices", "Vastu services", "Show service and consultation introduction sections.")}
                        {toggle("storefront", "showConsultationCTA", "Consultation call to action", "Show consultation booking prompts on the storefront.")}
                        {toggle("storefront", "showFloatingBookButton", "Floating Book Now button", "Show the sticky consultation CTA after frontend integration.")}
                        {toggle("storefront", "showTraining", "Training programs", "Show the training introduction and course links.")}
                        {toggle("storefront", "showBlog", "Latest blog articles", "Show recent published articles on the homepage.")}
                        {toggle("storefront", "showTestimonials", "Testimonials section", "Show verified customer or learner testimonials.")}
                        {toggle("storefront", "showNewsletter", "Newsletter section", "Show the newsletter signup area.")}
                        {toggle("storefront", "showFooterSocials", "Social links in footer", "Show social media links in the website footer.", true)}
                      </div>
                    </Panel>

                    <Panel title="Announcement bar" description="Promote store updates or current offers." icon={MessageSquare}>
                      <div className="py-1">
                        {toggle("storefront", "announcementEnabled", "Show announcement bar", "Display an announcement at the top of the public site.")}
                        <div className="py-5">
                          <Field label="Announcement text">
                            <input className={inputClass} value={settings.storefront.announcementText} onChange={(event) => update("storefront", "announcementText", event.target.value)} />
                          </Field>
                        </div>
                        {selectField("Products per page", "productsPerPage", [
                          { value: "8", label: "8 products" },
                          { value: "12", label: "12 products" },
                          { value: "16", label: "16 products" },
                          { value: "24", label: "24 products" },
                        ])}
                      </div>
                    </Panel>
                  </>
                )}

                {/* NGO DONATION */}
                {activeSection === "donation" && (
                  <>
                    <Panel
                      title="Choti Khushi NGO - Bird Feeding"
                      description="Configure donation amounts, NGO title, and public availability."
                      icon={Heart}
                    >
                      <div className="py-1">
                        {toggle(
                          "donation",
                          "enabled",
                          "Enable NGO Donation Collection",
                          "Show and allow visitors to donate for bird feeding on the public website."
                        )}
                        {toggle(
                          "donation",
                          "allowCustomAmount",
                          "Allow Custom Donation Amounts",
                          "Allow users to enter any custom contribution amount alongside preset options."
                        )}
                      </div>
                      <div className="grid gap-5 py-5 sm:grid-cols-2">
                        <Field label="NGO Initiative Name">
                          <input
                            className={inputClass}
                            value={settings.donation?.ngoName || ""}
                            onChange={(event) =>
                              update("donation", "ngoName", event.target.value)
                            }
                            placeholder="Choti Khushi NGO - feeding work for Birds"
                          />
                        </Field>
                        <Field label="Suggested Preset Amounts (₹ comma-separated)">
                          <input
                            className={inputClass}
                            value={
                              settings.donation?.suggestedAmounts ||
                              "500, 1000, 10000"
                            }
                            onChange={(event) =>
                              update(
                                "donation",
                                "suggestedAmounts",
                                event.target.value
                              )
                            }
                            placeholder="500, 1000, 10000"
                          />
                        </Field>
                      </div>
                      <div className="py-2">
                        <Field label="NGO Mission Note / Description">
                          <textarea
                            className={inputClass}
                            rows={3}
                            value={settings.donation?.description || ""}
                            onChange={(event) =>
                              update(
                                "donation",
                                "description",
                                event.target.value
                              )
                            }
                            placeholder="Support daily grains, millet, and clean earthen water pots for pigeons, sparrows, and sacred birds."
                          />
                        </Field>
                      </div>
                    </Panel>
                  </>
                )}

                {/* PAYMENTS */}
                {activeSection === "payments" && (
                  <>
                    <Notice type="warning">
                      <strong>Never store payment secrets in browser settings.</strong> Razorpay/Stripe secret keys, webhook secrets and signing credentials belong in server-side environment variables or a secure secret manager. These switches are preferences only until your checkout backend implements them.
                    </Notice>
                    <Panel title="Checkout methods" description="Select the payment methods you intend to offer." icon={CreditCard}>
                      <div className="py-1">
                        {toggle("payments", "onlineEnabled", "Online payments", "Enable the online payment option in the intended checkout configuration.")}
                        {toggle("payments", "codEnabled", "Cash on delivery", "Offer cash on delivery where your shipping rules allow it.")}
                        {toggle("payments", "upiEnabled", "UPI payments", "Display UPI as an option when supported by your payment provider.")}
                        {toggle("payments", "bankTransferEnabled", "Bank transfer", "Offer manual bank transfer instructions and payment verification.")}
                      </div>
                    </Panel>

                    <Panel title="Payment gateway preferences" description="Select configured providers. Live processing requires server-side gateway setup." icon={LockKeyhole}>
                      <div className="py-1">
                        <SettingRow title="Razorpay" description="Use Razorpay only after adding server-side credentials and webhook verification.">
                          <Toggle checked={settings.payments.razorpayEnabled} onChange={(value) => update("payments", "razorpayEnabled", value)} />
                        </SettingRow>
                        <SettingRow title="Stripe" description="Use Stripe only after configuring the provider for your business and region.">
                          <Toggle checked={settings.payments.stripeEnabled} onChange={(value) => update("payments", "stripeEnabled", value)} />
                        </SettingRow>
                        {toggle("payments", "testMode", "Test mode", "Preference for sandbox/test transactions; your payment backend must enforce this.")}
                        {toggle("payments", "autoCapture", "Automatic payment capture", "Capture eligible payments automatically if supported by the gateway integration.", true)}
                      </div>
                      <div className="grid gap-5 border-t border-[#e4e4e7] py-5 sm:grid-cols-2">
                        {field("Minimum order amount", "minimumOrder", "0", "number", "The intended minimum checkout amount. Validate on the server.")}
                        <Field label="Payment currency">
                          <select className={inputClass} value={settings.payments.currency} onChange={(event) => update("payments", "currency", event.target.value)}>
                            <option value="INR">INR — Indian Rupee</option>
                            <option value="USD">USD — US Dollar</option>
                            <option value="GBP">GBP — Pound Sterling</option>
                            <option value="EUR">EUR — Euro</option>
                          </select>
                        </Field>
                      </div>
                    </Panel>

                    <Panel title="Refund policy" description="Internal reference text for your store policy." icon={Receipt}>
                      <div className="py-5">
                        <Field label="Refund policy text">
                          <textarea className={inputClass} rows={4} value={settings.payments.refundPolicy} onChange={(event) => update("payments", "refundPolicy", event.target.value)} />
                        </Field>
                      </div>
                    </Panel>
                  </>
                )}

                {/* SHIPPING */}
                {activeSection === "shipping" && (
                  <>
                    <Panel title="Shipping availability" description="Configure the intended delivery options." icon={Truck}>
                      <div className="py-1">
                        {toggle("shipping", "shippingEnabled", "Enable shipping", "Allow shippable products to use delivery methods.")}
                        {toggle("shipping", "freeShippingEnabled", "Free shipping", "Offer free shipping when eligible.")}
                        {toggle("shipping", "flatRateEnabled", "Flat-rate shipping", "Use a single base shipping rate.")}
                        {toggle("shipping", "localPickupEnabled", "Local pickup", "Offer pickup if your business has a suitable collection location.", true)}
                      </div>
                      <div className="grid gap-5 border-t border-[#e4e4e7] py-5 sm:grid-cols-2">
                        {field("Free shipping threshold (₹)", "freeShippingThreshold", "1999", "number")}
                        {field("Flat shipping rate (₹)", "flatRate", "99", "number")}
                        {field("Processing time (days)", "processingDays", "2", "number")}
                        {field("Delivery countries", "allowedCountries", "India")}
                      </div>
                      <div className="pb-5">
                        <Field label="Delivery note">
                          <textarea className={inputClass} rows={3} value={settings.shipping.deliveryNote} onChange={(event) => update("shipping", "deliveryNote", event.target.value)} />
                        </Field>
                      </div>
                    </Panel>
                    <Notice type="info">
                      Shipping rates must be recalculated and validated on the server during checkout. These preferences do not calculate real courier prices or generate shipping labels.
                    </Notice>
                  </>
                )}

                {/* ORDERS */}
                {activeSection === "orders" && (
                  <Panel title="Order workflow" description="Configure intended order and inventory behavior." icon={ShoppingBag}>
                    <div className="py-1">
                      {toggle("orders", "autoConfirm", "Automatically confirm orders", "Only activate after defining payment verification and order transition rules.")}
                      {toggle("orders", "allowCancellation", "Allow customer cancellation", "Expose cancellation actions within the permitted cancellation window.")}
                      {toggle("orders", "lowStockAlerts", "Low stock alerts", "Send an alert when inventory reaches the configured threshold.")}
                      {toggle("orders", "orderEmailEnabled", "Order confirmation email", "Send order confirmation messages through your email service.")}
                      {toggle("orders", "invoiceEnabled", "Generate invoices", "Enable invoice generation after implementing the invoice service.", true)}
                    </div>
                    <div className="grid gap-5 py-5 sm:grid-cols-2">
                      {field("Order number prefix", "prefix", "BSV")}
                      {field("Cancellation window (hours)", "cancellationWindow", "24", "number")}
                      {field("Low stock threshold", "lowStockThreshold", "5", "number")}
                    </div>
                  </Panel>
                )}

                {/* CONSULTATIONS */}
                {activeSection === "consultations" && (
                  <Panel title="Consultation booking preferences" description="Manage which booking options are intended to be available." icon={CalendarDays}>
                    <div className="py-1">
                      {toggle("consultations", "enabled", "Enable consultation bookings", "Show consultation booking options on the public site.")}
                      {toggle("consultations", "onlineEnabled", "Online consultations", "Allow online appointment requests.")}
                      {toggle("consultations", "inPersonEnabled", "In-person consultations", "Allow in-person appointment requests.")}
                      {toggle("consultations", "requireAdvancePayment", "Require advance payment", "Enforce payment before confirming a booking in the backend.")}
                      {toggle("consultations", "allowReschedule", "Allow rescheduling", "Allow customers to request a different appointment time.")}
                      {toggle("consultations", "confirmationEmail", "Booking confirmation email", "Send booking confirmation after the server confirms the appointment.", true)}
                    </div>
                    <div className="grid gap-5 py-5 sm:grid-cols-2">
                      {field("Minimum booking notice (hours)", "minimumNotice", "24", "number")}
                      {field("Appointment buffer (minutes)", "bufferMinutes", "15", "number")}
                    </div>
                  </Panel>
                )}

                {/* TRAINING */}
                {activeSection === "training" && (
                  <Panel title="Training and course enrollment" description="Configure the public training page and enrollment preferences." icon={GraduationCap}>
                    <div className="py-1">
                      {toggle("training", "enabled", "Show training page", "Control whether the public training page should be available.")}
                      {toggle("training", "enrollmentEnabled", "Accept enrollments", "Allow course registration when connected to the enrollment backend.")}
                      {toggle("training", "allowWaitlist", "Allow course waitlists", "Collect waitlist requests when a course is full.")}
                      {toggle("training", "certificateEnabled", "Offer certificates", "Show certificate information when your training program supports it.")}
                      {toggle("training", "confirmationEmail", "Enrollment confirmation email", "Send enrollment confirmations through your email provider.")}
                      {toggle("training", "showFees", "Display course fees", "Show the course fee on public course cards.", true)}
                    </div>
                  </Panel>
                )}

                {/* BLOG */}
                {activeSection === "blog" && (
                  <Panel title="Blog publishing preferences" description="Control public blog display and content review preferences." icon={BookOpen}>
                    <div className="py-1">
                      {toggle("blog", "enabled", "Enable public blog", "Make the blog available when your frontend reads this setting.")}
                      {toggle("blog", "commentsEnabled", "Allow comments", "Enable comments only after implementing spam protection and moderation.")}
                      {toggle("blog", "moderationRequired", "Require comment moderation", "Review submitted comments before public display.")}
                      {toggle("blog", "showAuthor", "Display author", "Show the article author on public blog pages.")}
                      {toggle("blog", "showPublishDate", "Display publication date", "Show the article publication date.")}
                      {toggle("blog", "showReadingTime", "Display reading time", "Show estimated article reading time.", true)}
                    </div>
                    <div className="grid gap-5 py-5 sm:grid-cols-2">
                      {selectField("Articles per page", "postsPerPage", [
                        { value: "6", label: "6 articles" },
                        { value: "9", label: "9 articles" },
                        { value: "12", label: "12 articles" },
                        { value: "18", label: "18 articles" },
                      ])}
                      {field("Default category", "defaultCategory", "Vastu Basics")}
                    </div>
                  </Panel>
                )}

                {/* SEO */}
                {activeSection === "seo" && (
                  <>
                    <Panel title="Search engine metadata" description="Set the default metadata used by pages that inherit your site defaults." icon={Search}>
                      <div className="space-y-5 py-5">
                        {field("Default site title", "siteTitle", "Your website title")}
                        <Field label="Meta description">
                          <textarea className={inputClass} rows={3} maxLength={320} value={settings.seo.description} onChange={(event) => update("seo", "description", event.target.value)} />
                          <p className="mt-1 text-right text-[11px] text-[#71717a]">{settings.seo.description.length}/320</p>
                        </Field>
                        {field("Keywords", "keywords", "Vastu, consultation, products")}
                        {field("Canonical site URL", "canonicalUrl", "https://example.com", "url")}
                        {field("Social sharing image URL", "socialImage", "https://example.com/social.jpg", "url")}
                      </div>
                    </Panel>
                    <Panel title="Search indexing" description="These preferences require implementation in metadata, robots and sitemap generation." icon={Globe}>
                      <div className="py-1">
                        {toggle("seo", "robotsIndex", "Allow search indexing", "Intended default for indexable public pages.")}
                        {toggle("seo", "sitemapEnabled", "Enable XML sitemap", "Generate a sitemap for public, indexable pages.", true)}
                      </div>
                    </Panel>
                    <Notice type="warning">
                      Saving SEO values here does not automatically change Next.js metadata, robots.txt, canonical URLs, Open Graph tags, or sitemap.xml. Connect these settings to your metadata generation code.
                    </Notice>
                  </>
                )}

                {/* NOTIFICATIONS */}
                {activeSection === "notifications" && (
                  <Panel title="Email notification preferences" description="Choose which events should generate notification messages." icon={Bell}>
                    <div className="py-1">
                      {toggle("notifications", "orderNotifications", "New order notifications", "Alert the store team when an order is placed.")}
                      {toggle("notifications", "paymentNotifications", "Payment notifications", "Alert the team to payment success or failure events.")}
                      {toggle("notifications", "consultationNotifications", "Consultation notifications", "Alert the team to new bookings and appointment changes.")}
                      {toggle("notifications", "trainingNotifications", "Training enrollment notifications", "Alert the team when someone enrolls in a course.")}
                      {toggle("notifications", "contactFormNotifications", "Contact form notifications", "Notify the team about new contact enquiries.")}
                      {toggle("notifications", "newsletterNotifications", "Newsletter notifications", "Notify the team when someone subscribes.", true)}
                    </div>
                    <div className="grid gap-5 py-5 sm:grid-cols-2">
                      {field("Sender display name", "emailFromName", "Store team")}
                      {field("Reply-to email", "emailReplyTo", "support@example.com", "email")}
                    </div>
                    <Notice type="info">
                      An email provider and server-side sending route are required to deliver notifications. Never expose provider API keys in client-side code.
                    </Notice>
                  </Panel>
                )}

                {/* SECURITY */}
                {activeSection === "security" && (
                  <>
                    <Panel title="Administrator Credentials & Access" description="Master administrator login credentials and security management." icon={LockKeyhole}>
                      <div className="py-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                          <div>
                            <p className="text-xs font-bold text-zinc-900">Admin Login Email</p>
                            <p className="text-xs text-zinc-500 mt-0.5">admin@bhuwneshwari.com</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900">Registered Mobile (OTP)</p>
                            <p className="text-xs text-zinc-500 mt-0.5">+91 8690708302</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResetModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition shrink-0"
                          >
                            <LockKeyhole size={14} />
                            <span>Reset / Change Password</span>
                          </button>
                        </div>
                      </div>
                    </Panel>

                    <Panel title="Account and access policies" description="Configure intended security policies for the application." icon={ShieldCheck}>
                      <div className="py-1">
                        {toggle("security", "loginAlerts", "Login alerts", "Notify administrators about relevant login activity after connecting an alerting service.")}
                        {toggle("security", "twoFactorRequired", "Require two-factor authentication", "This setting alone does not enforce MFA; implement it in your authentication provider.")}
                        {toggle("security", "customerRegistration", "Allow customer registration", "Allow visitors to create customer accounts.")}
                        {toggle("security", "passwordResetEnabled", "Allow password reset", "Enable secure password recovery through your auth provider.")}
                        {toggle("security", "rateLimitEnabled", "Enable rate limiting", "Intended preference for backend rate limits on authentication and public APIs.", true)}
                      </div>
                      <div className="py-5">
                        {selectField("Session timeout", "sessionTimeout", [
                          { value: "15", label: "15 minutes" },
                          { value: "30", label: "30 minutes" },
                          { value: "60", label: "1 hour" },
                          { value: "120", label: "2 hours" },
                          { value: "480", label: "8 hours" },
                        ], "The authentication backend must enforce session expiration.")}
                      </div>
                    </Panel>
                    <Notice type="warning">
                      Security settings must be enforced by the server and authentication provider. Hiding a control or saving a browser preference is not access control. Keep authorization checks on every protected admin API.
                    </Notice>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Bottom save actions */}
            <div className="sticky bottom-3 z-20 flex flex-col justify-between gap-3 rounded-2xl border border-[#e4e4e7] bg-[#ffffff]/95 p-3 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:px-5">
              <div className="flex items-center gap-2 text-xs text-[#71717a]">
                {dirty ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    You have unsaved changes
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    No unsaved changes
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetSettings}
                  disabled={!dirty}
                  className="flex-1 rounded-full border border-[#d4d4d8] px-4 py-3 text-xs font-semibold text-[#3f3f46] disabled:opacity-40 sm:flex-none"
                >
                  Discard
                </button>
                <button
                  onClick={saveSettings}
                  disabled={!dirty || !hydrated}
                  className="flex-1 rounded-full bg-[#18181b] px-5 py-3 text-xs font-semibold text-white hover:bg-[#624a2d] disabled:opacity-40 sm:flex-none"
                >
                  <Save className="mr-1.5 inline" size={14} /> Save settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResetPasswordModal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} />

      {/* Confirmation dialogs */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            title={
              confirmAction === "maintenance-on"
                ? "Enable maintenance mode?"
                : confirmAction === "maintenance-off"
                  ? "Disable maintenance mode?"
                  : "Reset all settings?"
            }
            description={
              confirmAction === "maintenance-on"
                ? "This will enable the maintenance-mode preference. The public website will not be blocked until the frontend and backend are connected to this setting."
                : confirmAction === "maintenance-off"
                  ? "This will turn off the maintenance-mode preference in your unsaved settings."
                  : "This resets all settings in this demo to their original values and saves those defaults in this browser."
            }
            confirmLabel={
              confirmAction === "maintenance-on"
                ? "Enable setting"
                : confirmAction === "maintenance-off"
                  ? "Disable setting"
                  : "Reset defaults"
            }
            danger={confirmAction === "maintenance-on" || confirmAction === "reset"}
            onCancel={() => setConfirmAction(null)}
            onConfirm={() => {
              if (confirmAction === "maintenance-on") {
                update("maintenance", "enabled", true);
                setConfirmAction(null);
              } else if (confirmAction === "maintenance-off") {
                update("maintenance", "enabled", false);
                setConfirmAction(null);
              } else {
                resetAllSettings();
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
