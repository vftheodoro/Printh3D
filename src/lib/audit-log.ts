import "server-only";

import { getAdminSupabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface AuditLogInput {
  actorId?: number;
  action: string;
  resource: string;
  resourceId?: string | number;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput) {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("audit_logs").insert([
      {
        actor_id: input.actorId ?? null,
        action: input.action,
        resource: input.resource,
        resource_id:
          input.resourceId === undefined ? null : String(input.resourceId),
        request_id: input.requestId ?? null,
        metadata: input.metadata ?? {},
      },
    ]);

    if (error) throw error;
  } catch (error: unknown) {
    logger.warn("Persistent audit log unavailable.", {
      action: input.action,
      resource: input.resource,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
