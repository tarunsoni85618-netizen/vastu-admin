"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  Mail,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

// Client-side fetch interceptor: automatically attaches Bearer token to all admin API requests
if (typeof window !== "undefined" && !window.__bsv_fetch_intercepted__) {
  window.__bsv_fetch_intercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init = {}) {
    try {
      const token = localStorage.getItem("vastu_admin_token") || localStorage.getItem("bsv-token");
      if (token) {
        const urlStr = typeof input === "string" ? input : (input?.url || "");
        const isApi = urlStr.includes("/api/") || urlStr.startsWith("/") || !/^https?:\/\//i.test(urlStr);
        if (isApi) {
          const headers = new Headers(init.headers || (typeof input === "object" && input?.headers ? input.headers : {}));
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          init = {
            ...init,
            credentials: init.credentials || "include",
            headers,
          };
        }
      }
    } catch {}
    return originalFetch.call(this, input, init);
  };
}

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState("checking"); // "checking" | "authenticated" | "unauthenticated"
  const [authMode, setAuthMode] = useState("password"); // "password" | "otp" | "forgot"
  
  // Mobile OTP state
  const [phone, setPhone] = useState("8690708302");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Email & Password state
  const [email, setEmail] = useState("admin@bhuwneshwari.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState("admin@bhuwneshwari.com");
  const [forgotStep, setForgotStep] = useState(1); // 1 = request OTP, 2 = enter OTP and new password
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");

  async function verifyAdmin(overrideToken) {
    try {
      const token =
        overrideToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("vastu_admin_token") || localStorage.getItem("bsv-token")
          : null);

      if (!token) {
        setAuthStatus("unauthenticated");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${apiBase}/api/auth/me`, {
        headers,
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.data?.role === "admin") {
        if (result?.data && typeof window !== "undefined") {
          localStorage.setItem("vastu_admin_user", JSON.stringify(result.data));
          localStorage.setItem("bsv-user", JSON.stringify(result.data));
        }
        setAuthStatus("authenticated");
      } else {
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("vastu_admin_token");
          localStorage.removeItem("bsv-token");
          localStorage.removeItem("vastu_admin_user");
          localStorage.removeItem("bsv-user");
        }
        setAuthStatus("unauthenticated");
      }
    } catch {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("vastu_admin_user") || localStorage.getItem("bsv-user");
        const token = localStorage.getItem("vastu_admin_token") || localStorage.getItem("bsv-token");
        if (token && cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.role === "admin") {
              setAuthStatus("authenticated");
              return;
            }
          } catch {}
        }
      }
      setAuthStatus("unauthenticated");
    }
  }

  useEffect(() => {
    verifyAdmin();
  }, []);

  // 1. Password Login
  async function handlePasswordLogin(e) {
    e?.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!email || !password) {
      setErrorMsg("Please enter your admin email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid credentials");
      }
      const token = data.token || data.data?.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("vastu_admin_token", token);
        localStorage.setItem("bsv-token", token);
      }
      if (data.data && typeof window !== "undefined") {
        localStorage.setItem("vastu_admin_user", JSON.stringify(data.data));
        localStorage.setItem("bsv-user", JSON.stringify(data.data));
      }
      if (data.data?.role === "admin") {
        setAuthStatus("authenticated");
        return;
      }
      await verifyAdmin(token);
    } catch (err) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // 2. Forgot Password - Step 1: Send OTP
  async function handleForgotSendOtp(e) {
    e?.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!forgotIdentifier.trim()) {
      setErrorMsg("Please enter your admin email or registered mobile");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotIdentifier.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send verification code");
      }
      setForgotStep(2);
      setSuccessMsg(data.message || "Verification code sent successfully.");
    } catch (err) {
      setErrorMsg(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  }

  // 2. Forgot Password - Step 2: Verify OTP & Reset Password
  async function handleForgotVerifyAndReset(e) {
    e?.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit verification code");
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/admin/verify-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      setSuccessMsg("Password reset successfully! You can now login with your new password.");
      setEmail(forgotIdentifier);
      setPassword(forgotNewPassword);
      setAuthMode("password");
      setForgotStep(1);
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  // 3. Mobile OTP Login
  async function handleSendOtp(e) {
    e?.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send OTP");
      }
      setOtpSent(true);
      setSuccessMsg("OTP sent successfully to +91 " + cleanPhone);
    } catch (err) {
      setErrorMsg(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e?.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const cleanPhone = phone.replace(/\D/g, "");
    if (!otpCode.trim()) {
      setErrorMsg("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: cleanPhone, code: otpCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid OTP code");
      }
      const token = data.token || data.data?.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("vastu_admin_token", token);
        localStorage.setItem("bsv-token", token);
      }
      if (data.data && typeof window !== "undefined") {
        localStorage.setItem("vastu_admin_user", JSON.stringify(data.data));
        localStorage.setItem("bsv-user", JSON.stringify(data.data));
      }
      if (data.data?.role === "admin") {
        setAuthStatus("authenticated");
        return;
      }
      await verifyAdmin(token);
    } catch (err) {
      setErrorMsg(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (authStatus === "checking") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="mt-4 text-xs font-medium text-zinc-400 tracking-wider uppercase">
          Verifying Admin Session...
        </p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100 selection:bg-white selection:text-black">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-zinc-950 shadow-md">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold tracking-tight text-white">
                  Admin Portal
                </h1>
                <p className="text-[11px] text-zinc-400">Bhuwneshwari Scientific Vastu</p>
              </div>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              title="Open storefront"
            >
              <span>Store</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Auth tabs (only visible when not in forgot password mode) */}
          {authMode !== "forgot" ? (
            <div className="mt-6 flex rounded-xl bg-zinc-800/60 p-1 border border-zinc-700/50">
              <button
                type="button"
                onClick={() => { setAuthMode("password"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  authMode === "password"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("otp"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  authMode === "otp"
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Mobile OTP
              </button>
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-zinc-400" />
                <span className="text-xs font-bold text-white">Forgot Password</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setErrorMsg("");
                  setSuccessMsg("");
                  setForgotStep(1);
                }}
                className="text-xs text-zinc-400 hover:text-white transition underline underline-offset-2"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-200">
              {successMsg}
            </div>
          )}

          {/* MODE 1: Email & Password */}
          {authMode === "password" && (
            <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Admin Email or Username
                </label>
                <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus-within:border-white focus-within:bg-zinc-800 transition">
                  <Mail size={16} className="text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bhuwneshwari.com"
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setErrorMsg("");
                      setSuccessMsg("");
                      setForgotIdentifier(email);
                    }}
                    className="text-[11px] font-medium text-zinc-400 hover:text-white transition underline underline-offset-2"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus-within:border-white focus-within:bg-zinc-800 transition">
                  <Lock size={16} className="text-zinc-400 mr-2 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-white ml-1 shrink-0"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: Forgot Password */}
          {authMode === "forgot" && (
            <div className="mt-5 space-y-4">
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotSendOtp} className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-5">
                    Enter your administrator email or registered mobile number. We will send a secure 6-digit verification code to reset your password.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Admin Email or Mobile
                    </label>
                    <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus-within:border-white focus-within:bg-zinc-800 transition">
                      <Mail size={16} className="text-zinc-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="admin@bhuwneshwari.com or 8690708302"
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Verification Code</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotVerifyAndReset} className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-5">
                    Enter the 6-digit verification code sent to your registered contact and enter your new password.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="••••••"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-center font-mono text-base tracking-widest text-white outline-none focus:border-white focus:bg-zinc-800 transition"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus-within:border-white focus-within:bg-zinc-800 transition">
                      <Lock size={16} className="text-zinc-400 mr-2 shrink-0" />
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="text-zinc-400 hover:text-white ml-1 shrink-0"
                      >
                        {showForgotNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus-within:border-white focus-within:bg-zinc-800 transition">
                      <Lock size={16} className="text-zinc-400 mr-2 shrink-0" />
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-zinc-400 hover:text-white underline underline-offset-2"
                    >
                      Change Contact
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotSendOtp}
                      disabled={loading}
                      className="text-zinc-300 hover:text-white font-semibold underline underline-offset-2"
                    >
                      Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Reset Password & Proceed to Login</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MODE 3: Mobile OTP */}
          {authMode === "otp" && (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Admin Registered Mobile
                </label>
                <div className="flex rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus-within:border-white focus-within:bg-zinc-800 transition">
                  <span className="text-zinc-400 mr-2 font-medium">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 disabled:opacity-60"
                    placeholder="8690708302"
                    required
                  />
                </div>
                <p className="mt-1 text-[10px] text-zinc-400">
                  Default administrator master mobile: 8690708302
                </p>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-center font-mono text-base tracking-widest text-white outline-none focus:border-white focus:bg-zinc-800 transition"
                    autoFocus
                    required
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(""); }}
                      className="text-zinc-400 hover:text-white underline underline-offset-2"
                    >
                      Change Mobile Number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-zinc-300 hover:text-white font-semibold underline underline-offset-2"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 hover:bg-zinc-200 transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : otpSent ? (
                  <>
                    <span>Verify & Open Admin Panel</span>
                    <ArrowRight size={14} />
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-zinc-800/80 pt-4 text-center">
            <p className="text-[10px] text-zinc-500">
              Only authorized administrators are permitted. Session secured with encrypted HTTP-only cookie.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen lg:pl-[270px]">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
        <footer className="border-t border-zinc-200 bg-white px-5 py-5 text-center text-xs text-zinc-500 lg:ml-0">
          © {new Date().getFullYear()} Bhuwneshwari Scientific Vastu · Master Admin
        </footer>
      </div>
    </div>
  );
}
