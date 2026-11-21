"use client";

import React from "react";

export function getPlatformFromUrl(url = "") {
  const u = String(url).toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("facebook.com") || u.includes("fb.com")) return "facebook";
  if (u.includes("wa.me") || u.includes("whatsapp.com")) return "whatsapp";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("t.me") || u.includes("telegram.me")) return "telegram";
  if (u.includes("pinterest.com")) return "pinterest";
  if (u.includes("threads.net")) return "threads";
  return "custom";
}

export default function SocialIcon({ platform = "", className = "w-5 h-5", size = 20 }) {
  const p = (platform || "").toLowerCase().trim();

  switch (p) {
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );

    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );

    case "facebook":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );

    case "whatsapp":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M17.472 14.382c-.301-.15-1.782-.88-2.059-.98-.276-.101-.477-.15-.678.15s-.779.98-.955 1.18c-.176.2-.352.226-.653.075s-1.272-.47-2.423-1.497c-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.527.151-.176.201-.301.301-.502.101-.2.05-.377-.025-.527-.075-.15-.678-1.634-.93-2.242-.244-.593-.493-.513-.678-.522l-.578-.01c-.201 0-.527.075-.804.377-.276.301-1.055 1.03-1.055 2.513s1.08 2.915 1.23 3.116c.151.201 2.126 3.247 5.151 4.555.72.311 1.282.497 1.721.637.723.23 1.381.198 1.901.12.579-.087 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.201-.577-.351zM12.04 2C6.495 2 2 6.495 2 12.04c0 1.81.482 3.511 1.326 4.982L2 22l5.126-1.315A10.016 10.016 0 0 0 12.04 22c5.545 0 10.04-4.495 10.04-10.04S17.585 2 12.04 2z" />
        </svg>
      );

    case "twitter":
    case "x":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    case "linkedin":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 1 0 1.6 1.6 1.6 1.6 0 0 0-1.6-1.6z" />
        </svg>
      );

    case "telegram":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      );

    case "pinterest":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M12 0a12 12 0 0 0-4.37 23.18c-.07-.94-.13-2.39.03-3.42l1.1-4.66s-.28-.56-.28-1.39c0-1.3.75-2.28 1.7-2.28.8 0 1.19.6 1.19 1.33 0 .81-.51 2.01-.78 3.13-.22.94.47 1.7 1.4 1.7 1.67 0 2.96-1.77 2.96-4.32 0-2.26-1.63-3.84-3.95-3.84-2.69 0-4.27 2.02-4.27 4.1 0 .81.31 1.68.7 2.16.08.09.09.18.06.27l-.26 1.07c-.04.18-.15.22-.34.13-1.28-.59-2.07-2.46-2.07-3.95 0-3.22 2.34-6.18 6.75-6.18 3.54 0 6.3 2.53 6.3 5.9 0 3.52-2.22 6.35-5.3 6.35-1.04 0-2.01-.54-2.35-1.18l-.64 2.44c-.23.89-.86 2.01-1.28 2.7A12 12 0 1 0 12 0z" />
        </svg>
      );

    case "threads":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
        >
          <path d="M12 24C5.383 24 0 18.617 0 12S5.383 0 12 0s12 5.383 12 12-5.383 12-12 12zm0-2c5.514 0 10-4.486 10-10S17.514 2 12 2 2 6.486 2 12s4.486 10 10 10zm2.25-14.75c-2.35 0-4.25 1.9-4.25 4.25 0 2.35 1.9 4.25 4.25 4.25 1.35 0 2.55-.65 3.3-1.65l-1.35-1c-.5.65-1.2.95-1.95.95-1.25 0-2.25-1-2.25-2.25 0-1.25 1-2.25 2.25-2.25.95 0 1.75.55 2.05 1.4h-2.05v1.7h3.75c.1-.3.1-.6.1-.9 0-2.65-2.1-4.75-4.75-4.75z" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}
