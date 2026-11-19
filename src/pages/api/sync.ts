import type { APIRoute } from "astro";
import crypto from "node:crypto";

export const prerender = false;

interface StoredAccount {
  salt: string;
  hash: string;
  updatedAt: number;
  payload: unknown;
}

function getRedisEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return { url: url.replace(/\/$/, ""), token };
}

async function redisGet(key: string): Promise<string | null> {
  const { url, token } = getRedisEnv();
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Redis GET failed (${res.status})`);
  const data = await res.json();
  return typeof data.result === "string" ? data.result : null;
}

async function redisSet(key: string, value: string): Promise<void> {
  const { url, token } = getRedisEnv();
  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
    body: value
  });
  if (!res.ok) throw new Error(`Redis SET failed (${res.status})`);
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function verifyPassword(password: string, salt: string, expectedHex: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export const POST: APIRoute = async ({ request }) => {
  const { url, token } = getRedisEnv();
  if (!url || !token) {
    return json({ ok: false, error: "Cloud Sync is not configured yet. Connect Upstash Redis in Vercel Marketplace." }, 503);
  }

  let body: { action?: string; username?: string; password?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const action = String(body.action || "");
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
    return json({ ok: false, error: "Username must be 3–24 characters (letters, numbers, _ or -)." }, 400);
  }
  if (password.length < 6) {
    return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
  }

  const key = `fm:user:${username}`;

  try {
    const raw = await redisGet(key);
    const existing: StoredAccount | null = raw ? JSON.parse(raw) : null;

    if (action === "register") {
      if (existing) return json({ ok: false, error: "Username already exists. Use Sign In instead." }, 409);
      const salt = crypto.randomBytes(16).toString("hex");
      const record: StoredAccount = {
        salt,
        hash: hashPassword(password, salt),
        updatedAt: Date.now(),
        payload: body.payload ?? null
      };
      await redisSet(key, JSON.stringify(record));
      return json({ ok: true, updatedAt: record.updatedAt });
    }

    if (!existing) {
      return json({ ok: false, error: "Account not found. Check username or click Create Account." }, 404);
    }
    if (!verifyPassword(password, existing.salt, existing.hash)) {
      return json({ ok: false, error: "Incorrect password." }, 401);
    }

    if (action === "login" || action === "pull") {
      return json({ ok: true, updatedAt: existing.updatedAt, payload: existing.payload });
    }

    if (action === "push") {
      const updated: StoredAccount = {
        ...existing,
        updatedAt: Date.now(),
        payload: body.payload ?? existing.payload
      };
      await redisSet(key, JSON.stringify(updated));
      return json({ ok: true, updatedAt: updated.updatedAt });
    }

    return json({ ok: false, error: "Unknown action." }, 400);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : "Sync server error." }, 500);
  }
};
