"use client";

import { useEffect, useState } from "react";

export const DEFAULT_SETTINGS = {
  general: {
    storeName: "Bhuwneshwari Scientific Vastu",
    tagline: "Bring balance and harmony to your spaces",
    supportEmail: "support@bhuwneshwari.com",
    supportPhone: "+91 8690708302",
    contactWhatsapp: "918690708302",
    workingHours: "Monday – Saturday: 9:00 AM – 7:00 PM",
    gstin: "08ABCDE1234F1Z5",
    address: {
      line1: "Plot no 57 near khandelwal namkeen",
      line2: "Ward No 36, Saipura, Sanganer",
      city: "Jaipur",
      state: "Rajasthan",
      postalCode: "302029",
      country: "India",
      googleMapsUrl: "https://maps.google.com/?q=26.8289,75.7789",
    },
    socialLinks: [
      { id: "instagram", platform: "instagram", name: "Instagram", url: "https://www.instagram.com/bhuwneshwarivastu", active: true },
      { id: "youtube", platform: "youtube", name: "YouTube", url: "https://www.youtube.com/@bhuwneshwarivastu", active: true },
      { id: "facebook", platform: "facebook", name: "Facebook", url: "https://www.facebook.com/bhuwneshwarivastu", active: true },
      { id: "whatsapp", platform: "whatsapp", name: "WhatsApp", url: "https://wa.me/918690708302", active: true },
    ],
  },
};

let cachedSettings = null;
let fetchPromise = null;

export async function fetchStoreSettings() {
  if (cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;

  const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "http://localhost:3001").replace(/\/$/, "");

  fetchPromise = fetch(`${apiBase}/api/settings`, { cache: "no-store" })
    .then((r) => r.json())
    .then((res) => {
      if (res?.success && res.data) {
        cachedSettings = res.data;
        return res.data;
      }
      return DEFAULT_SETTINGS;
    })
    .catch((err) => {
      console.warn("Could not load dynamic settings, using defaults:", err);
      return DEFAULT_SETTINGS;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState(cachedSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    let mounted = true;
    fetchStoreSettings().then((data) => {
      if (mounted) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const g = settings?.general || DEFAULT_SETTINGS.general;
  const rawAddr = g.address || DEFAULT_SETTINGS.general.address;
  const addrObj = typeof rawAddr === "object" && rawAddr ? rawAddr : { line1: String(rawAddr || "") };

  const addressLines = [
    addrObj.line1,
    addrObj.line2,
    [addrObj.city, addrObj.state].filter(Boolean).join(", "),
    [addrObj.postalCode, addrObj.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  const fullAddress = addressLines.join(", ") || "Jaipur, Rajasthan, India";

  const activeSocialLinks = (
    Array.isArray(g.socialLinks) && g.socialLinks.length > 0
      ? g.socialLinks
      : Array.isArray(settings?.socialLinks) && settings.socialLinks.length > 0
      ? settings.socialLinks
      : DEFAULT_SETTINGS.general.socialLinks
  ).filter((s) => s && s.active !== false && s.url);

  return {
    settings,
    loading,
    storeName: g.storeName || "Bhuwneshwari Scientific Vastu",
    supportPhone: g.supportPhone || "+91 8690708302",
    contactWhatsapp: g.contactWhatsapp || "918690708302",
    supportEmail: g.supportEmail || "support@bhuwneshwari.com",
    workingHours: g.workingHours || "Monday – Saturday: 9:00 AM – 7:00 PM",
    gstin: g.gstin || "08ABCDE1234F1Z5",
    address: addrObj,
    fullAddress,
    googleMapsUrl:
      addrObj.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddress || "Bhuwneshwari Scientific Vastu Jaipur"
      )}`,
    socialLinks: activeSocialLinks,
  };
}
