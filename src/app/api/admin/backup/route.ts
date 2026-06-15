import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/audit-log";
import { apiError } from "@/lib/api-response";
import { requireAdminRole } from "@/modules/auth/server/session";

const TABLES_TO_EXPORT = [
  "settings",
  "admin_users",
  "categories",
  "products",
  "product_files",
  "promotions",
  "coupons",
  "clients",
  "sales",
  "sale_files",
  "expenses",
  "trash",
] as const;

export async function GET(request: Request) {
  const user = await requireAdminRole(["ADMIN"]);
  if (!user) {
    return apiError(
      "FORBIDDEN",
      "Apenas administradores podem exportar backups.",
      403,
    );
  }

  try {
    const supabase = getAdminSupabase();
    const backupData: Record<string, unknown[]> = {};

    for (const table of TABLES_TO_EXPORT) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        throw new Error(`Erro ao exportar ${table}: ${error.message}`);
      }
      backupData[table] = data || [];
    }

    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({
      version: "3.0.0",
      timestamp,
      data: backupData,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "backup.export",
      resource: "database",
      requestId: request.headers.get("x-request-id") || undefined,
      metadata: {
        tables: TABLES_TO_EXPORT.length,
        rows: Object.values(backupData).reduce(
          (total, rows) => total + rows.length,
          0,
        ),
      },
    });

    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="printh3d_backup_${timestamp.slice(0, 10)}.json"`,
      },
    });
  } catch (error: unknown) {
    return apiError(
      "BACKUP_FAILED",
      error instanceof Error
        ? error.message
        : "Não foi possível gerar o backup.",
      500,
    );
  }
}
