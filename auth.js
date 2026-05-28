// Identität: Username + PIN → SHA-256 → deterministischer uid
// Kein Firebase Auth – die UID ist nur ein lokaler Hash.
// Gleicher Username + gleiche PIN = gleiche UID = gleiche Daten auf jedem Gerät.

const AUTH_KEY = "7min.auth.v1";

export async function hashUid(username, pin) {
  const input = `${username.toLowerCase().trim()}:${pin}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20);
}

export async function login(username, pin) {
  const uid = await hashUid(username.trim(), pin);
  const auth = { username: username.trim(), uid };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); } catch (_) {}
  return auth;
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function logout() {
  try { localStorage.removeItem(AUTH_KEY); } catch (_) {}
  window.location.reload();
}
