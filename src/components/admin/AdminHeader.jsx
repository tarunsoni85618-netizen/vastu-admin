"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, Bell, ExternalLink, KeyRound, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import ResetPasswordModal from "./ResetPasswordModal";

export default function AdminHeader({ onMenuClick }) {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const dropdownRef = useRef(null);

  const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");

  useEffect(() => {
    async function loadAdminInfo() {
      // First try to load cached user for instant rendering
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("vastu_admin_user") || localStorage.getItem("bsv-user");
          if (cached) {
            setAdminUser(JSON.parse(cached));
          }
        } catch {}
      }

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("vastu_admin_token") || localStorage.getItem("bsv-token")
            : null;
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${apiBase}/api/auth/me`, {
          headers,
          credentials: "include",
        });
        const json = await res.json();
        if (json?.success && json?.data) {
          setAdminUser(json.data);
          if (typeof window !== "undefined") {
            localStorage.setItem("vastu_admin_user", JSON.stringify(json.data));
          }
        }
      } catch (err) {
        // ignore network error
      }
    }
    loadAdminInfo();
  }, [apiBase]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vastu_admin_token");
        localStorage.removeItem("bsv-token");
        localStorage.removeItem("bsv-user");
      }
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="rounded-xl border border-zinc-200 p-2.5 text-zinc-700 transition hover:bg-zinc-100 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="text-xs font-medium text-zinc-500">Workspace / Overview</p>
            <h2 className="mt-0.5 truncate font-serif text-lg font-bold text-zinc-900">
              Admin Dashboard
            </h2>
          </div>
          <h2 className="truncate font-serif text-base font-bold text-zinc-900 sm:hidden">
            Admin Panel
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <label className="hidden h-10 w-48 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 md:flex lg:w-64 focus-within:border-zinc-400 focus-within:bg-white transition">
            <Search size={16} className="shrink-0 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dashboard..."
              className="w-full bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </label>

          <button
            type="button"
            aria-label="Notifications"
            title="Live Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {/* User Profile Menu & Dropdown */}
          <div className="relative border-l border-zinc-200 pl-3 sm:pl-4" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-zinc-100 focus:outline-none"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-900 text-sm font-bold text-white shadow-sm">
                {adminUser?.name ? adminUser.name[0].toUpperCase() : "A"}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold text-zinc-900">
                  {adminUser?.name || "Administrator"}
                </p>
                <p className="text-[10px] font-medium text-zinc-500 truncate max-w-[130px]">
                  {adminUser?.email || "Master Access"}
                </p>
              </div>
              <ChevronDown size={14} className="text-zinc-500 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl z-50">
                <div className="px-3 py-2.5 border-b border-zinc-100">
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {adminUser?.name || "Administrator"}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {adminUser?.email || "admin@bhuwneshwari.com"}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck size={11} />
                    <span>Master Admin</span>
                  </div>
                </div>

                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setResetModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition text-left"
                  >
                    <KeyRound size={15} className="text-zinc-500" />
                    <span>Reset Password</span>
                  </button>

                  <a
                    href={process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition text-left sm:hidden"
                  >
                    <ExternalLink size={15} className="text-zinc-500" />
                    <span>View Storefront</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                  >
                    <LogOut size={15} className="text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <a
            href={process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000"}
            title="View storefront"
            aria-label="View storefront"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 w-10 place-items-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 sm:grid"
          >
            <ExternalLink size={17} />
          </a>
        </div>
      </header>

      {/* Global Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />
    </>
  );
}
