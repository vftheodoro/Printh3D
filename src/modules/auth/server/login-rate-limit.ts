import "server-only";

import { createHash } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const fallbackAttempts = new Map<
  string,
  { count: number; expiresAt: number }
>();

function hashIdentifier(identifier: string) {
  return createHash("sha256")
    .update(`${process.env.ADMIN_JWT_SECRET ?? "missing"}:${identifier}`)
    .digest("hex");
}

function fallbackCheck(identifierHash: string): RateLimitResult {
  const now = Date.now();
  const entry = fallbackAttempts.get(identifierHash);
  if (!entry || entry.expiresAt <= now) {
    fallbackAttempts.delete(identifierHash);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.expiresAt - now) / 1000),
    ),
  };
}

function fallbackRecord(identifierHash: string, success: boolean) {
  if (success) {
    fallbackAttempts.delete(identifierHash);
    return;
  }

  const now = Date.now();
  const current = fallbackAttempts.get(identifierHash);
  const entry =
    current && current.expiresAt > now
      ? current
      : { count: 0, expiresAt: now + WINDOW_MINUTES * 60 * 1000 };

  fallbackAttempts.set(identifierHash, {
    ...entry,
    count: entry.count + 1,
  });

  if (fallbackAttempts.size > 1_000) {
    for (const [key, value] of fallbackAttempts) {
      if (value.expiresAt <= now) fallbackAttempts.delete(key);
    }
  }
}

export async function checkLoginRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const identifierHash = hashIdentifier(identifier);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("admin_check_login_rate_limit", {
    p_identifier_hash: identifierHash,
    p_max_attempts: MAX_ATTEMPTS,
    p_window_minutes: WINDOW_MINUTES,
  });

  if (error) {
    logger.warn("Database login rate limit unavailable; using bounded fallback.", {
      action: "auth.rate_limit.check",
      errorCode: error.code,
    });
    return fallbackCheck(identifierHash);
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(result?.allowed ?? true),
    retryAfterSeconds: Number(result?.retry_after_seconds ?? 0),
  };
}

export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
) {
  const identifierHash = hashIdentifier(identifier);
  const supabase = getAdminSupabase();
  const { error } = await supabase.rpc("admin_record_login_attempt", {
    p_identifier_hash: identifierHash,
    p_success: success,
    p_window_minutes: WINDOW_MINUTES,
  });

  if (error) {
    logger.warn("Database login rate limit unavailable; recording fallback.", {
      action: "auth.rate_limit.record",
      errorCode: error.code,
    });
    fallbackRecord(identifierHash, success);
  }
}
