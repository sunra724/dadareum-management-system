const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_ADMIN_EMAILS = ["sunra724@gmail.com", "soilabcoop@gmail.com"];
const DEFAULT_COUNSELOR_EMAILS = ["sp0408@naver.com", "wonban4@gmail.com"];

function parseEmailList(value: string) {
  return value
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails));
}

export function getAppUrl() {
  return (process.env["NEXT_PUBLIC_APP_URL"] || DEFAULT_APP_URL).replace(/\/+$/, "");
}

export function getAdminEmails() {
  const configuredEmails = parseEmailList(
    process.env["ADMIN_EMAILS"] || process.env["NEXT_PUBLIC_ADMIN_EMAILS"] || "",
  );

  return uniqueEmails([...DEFAULT_ADMIN_EMAILS, ...configuredEmails]);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function getCounselorEmails() {
  const configuredEmails = parseEmailList(
    process.env["COUNSELOR_EMAILS"] || process.env["NEXT_PUBLIC_COUNSELOR_EMAILS"] || "",
  );

  return uniqueEmails([...DEFAULT_COUNSELOR_EMAILS, ...configuredEmails]);
}

export function isCounselorEmail(email: string | null | undefined) {
  if (!email) return false;
  return getCounselorEmails().includes(email.trim().toLowerCase());
}

export function isStudyCafeStaffEmail(email: string | null | undefined) {
  return isAdminEmail(email) || isCounselorEmail(email);
}

export function hasSupabaseAuthEnv() {
  return Boolean(process.env["NEXT_PUBLIC_SUPABASE_URL"] && process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
}

export function hasAdminAuthConfig() {
  return hasSupabaseAuthEnv() && getAdminEmails().length > 0;
}

export function getMissingAuthConfigKeys() {
  const missing: string[] = [];

  if (!process.env["NEXT_PUBLIC_SUPABASE_URL"]) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!getAdminEmails().length) {
    missing.push("ADMIN_EMAILS or NEXT_PUBLIC_ADMIN_EMAILS");
  }

  return missing;
}

export function sanitizeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
