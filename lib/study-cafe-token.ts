import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_TOKEN_SECRET = "dadareum-study-cafe-token-v1";

export type StudyCafeCheckinTokenPayload = {
  purpose: "study-cafe-checkin";
  projectId: number;
  youthId: number;
  exp: number;
};

function getTokenSecret() {
  return (
    process.env.STUDY_CAFE_TOKEN_SECRET ||
    process.env.PHONE_HASH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    DEFAULT_TOKEN_SECRET
  );
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function sign(payload: string) {
  return toBase64Url(createHmac("sha256", getTokenSecret()).update(payload).digest());
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createStudyCafeCheckinToken(projectId: number, youthId: number) {
  const payload: StudyCafeCheckinTokenPayload = {
    purpose: "study-cafe-checkin",
    projectId,
    youthId,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyStudyCafeCheckinToken(token: string): StudyCafeCheckinTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(sign(encodedPayload), signature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as StudyCafeCheckinTokenPayload;
    if (payload.purpose !== "study-cafe-checkin") return null;
    if (!payload.projectId || !payload.youthId || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
