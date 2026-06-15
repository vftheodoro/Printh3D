import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api-response";
import { getAdminSupabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const restoreSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("trash")
      .select("*")
      .order("deleted_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: unknown) {
    logger.error("Failed to list trash.", {
      action: "trash.list",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "TRASH_LIST_FAILED",
      "Não foi possível carregar a lixeira.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const parsed = restoreSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("INVALID_TRASH_ITEM", "Item inválido.", 400);
    }

    const supabase = getAdminSupabase();
    const { error } = await supabase.rpc("admin_restore_trash", {
      p_trash_id: parsed.data.id,
    });
    if (error) throw error;

    logger.info("Trash item restored.", {
      requestId,
      actorId: Number(request.headers.get("x-admin-user-id")) || undefined,
      action: "trash.restore",
      resource: "trash",
      resourceId: parsed.data.id,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Failed to restore trash item.", {
      requestId,
      action: "trash.restore",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "TRASH_RESTORE_FAILED",
      error instanceof Error ? error.message : "Não foi possível restaurar.",
      400,
    );
  }
}
