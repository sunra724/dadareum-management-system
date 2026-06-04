import { createHmac } from "crypto";

const DEFAULT_PHONE_SECRET = "dadareum-study-cafe-phone-v1";

export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("82") && digits.length >= 10) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

export function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized.length >= 10 && normalized.length <= 11;
}

function getPhoneHashSecret() {
  return (
    process.env.PHONE_HASH_SECRET ||
    process.env.STUDY_CAFE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    DEFAULT_PHONE_SECRET
  );
}

export function getPhoneDigest(value: string) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return "";

  return createHmac("sha256", getPhoneHashSecret())
    .update(normalized)
    .digest("hex");
}

export function getPhoneLast4(value: string) {
  const normalized = normalizePhoneNumber(value);
  return normalized.slice(-4);
}

export function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, "");
}
