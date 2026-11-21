const AUTH_KEY = "bsv-user";
const TOKEN_KEY = "bsv-token";
const ADMIN_TOKEN_KEY = "vastu_admin_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function saveAuthToken(token) {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {}
}

export function removeAuthToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const user = localStorage.getItem(AUTH_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    if (user?.token) {
      saveAuthToken(user.token);
    }
    window.dispatchEvent(new Event("bsv-auth-updated"));
  } catch {}
}

export function logoutUser() {
  const apiBase = (process.env.NEXT_PUBLIC_VASTU_API_URL || "").replace(/\/$/, "");
  fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  removeAuthToken();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    window.dispatchEvent(new Event("bsv-auth-updated"));
  }
}

export function openLoginPopup(returnTo = "/") {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("bsv-open-login", {
      detail: { returnTo },
    })
  );
}
