import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getAdminSupabase } from "@/lib/supabase";
import { requireAdminRole } from "@/modules/auth/server/session";

const STORE_TO_TABLE = {
  settings: "settings",
  admin_users: "admin_users",
  categorias: "categories",
  categories: "categories",
  produtos: "products",
  products: "products",
  arquivos_produto: "product_files",
  product_files: "product_files",
  promocoes: "promotions",
  promotions: "promotions",
  cupons: "coupons",
  coupons: "coupons",
  clientes: "clients",
  clients: "clients",
  vendas: "sales",
  sales: "sales",
  arquivos_venda: "sale_files",
  sale_files: "sale_files",
  gastos: "expenses",
  expenses: "expenses",
  lixeira: "trash",
  trash: "trash",
} as const;

const IMPORT_ORDER = [
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

const migrationSchema = z.object({
  backup: z.record(z.string(), z.unknown()),
  dryRun: z.boolean().default(true),
});

type ImportTable = (typeof IMPORT_ORDER)[number];
type ImportRow = Record<string, unknown>;

function normalizeBackup(backup: Record<string, unknown>) {
  const rawData =
    backup.data && typeof backup.data === "object" && !Array.isArray(backup.data)
      ? (backup.data as Record<string, unknown>)
      : backup;

  const normalized = new Map<ImportTable, ImportRow[]>();

  for (const [sourceName, value] of Object.entries(rawData)) {
    const target =
      STORE_TO_TABLE[sourceName as keyof typeof STORE_TO_TABLE] ?? null;
    if (!target || !Array.isArray(value)) continue;

    const rows = value.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(
          `Registro inválido em ${sourceName}, posição ${index + 1}.`,
        );
      }

      const clean: ImportRow = { ...(item as ImportRow) };
      delete clean.blob;

      if (target === "products" && clean.category && !clean.category_id) {
        clean.category_id = clean.category;
        delete clean.category;
      }

      return clean;
    });

    const existing = normalized.get(target) || [];
    normalized.set(target, [...existing, ...rows]);
  }

  return normalized;
}

export async function POST(request: Request) {
  const user = await requireAdminRole(["ADMIN"]);
  if (!user) {
    return apiError(
      "FORBIDDEN",
      "Apenas administradores podem importar backups.",
      403,
    );
  }

  try {
    const parsedBody = migrationSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return apiError(
        "INVALID_BACKUP",
        "O payload de backup é inválido.",
        400,
        parsedBody.error.flatten().fieldErrors,
      );
    }

    const tables = normalizeBackup(parsedBody.data.backup);
    const summary = IMPORT_ORDER.flatMap((table) => {
      const rows = tables.get(table);
      return rows ? [{ table, rows: rows.length }] : [];
    });
    const totalRows = summary.reduce((total, item) => total + item.rows, 0);

    if (summary.length === 0) {
      return apiError(
        "EMPTY_BACKUP",
        "Nenhuma tabela reconhecida foi encontrada no arquivo.",
        400,
      );
    }

    if (totalRows > 100_000) {
      return apiError(
        "BACKUP_TOO_LARGE",
        "O backup excede o limite de 100.000 registros por importação.",
        413,
      );
    }

    const requestId = request.headers.get("x-request-id") || undefined;
    if (parsedBody.data.dryRun) {
      await writeAuditLog({
        actorId: user.id,
        action: "backup.validate",
        resource: "database",
        requestId,
        metadata: { tables: summary.length, rows: totalRows },
      });
      return apiSuccess({ dryRun: true, tables: summary, totalRows });
    }

    const supabase = getAdminSupabase();
    const results: Record<
      string,
      { processed: number; errors: string[] }
    > = {};

    for (const table of IMPORT_ORDER) {
      const rows = tables.get(table);
      if (!rows) continue;

      results[table] = { processed: 0, errors: [] };
      for (let index = 0; index < rows.length; index += 100) {
        const chunk = rows.slice(index, index + 100);
        const { error } = await supabase
          .from(table)
          .upsert(chunk, { onConflict: "id" });

        if (error) {
          results[table].errors.push(
            `Registros ${index + 1}-${index + chunk.length}: ${error.message}`,
          );
        } else {
          results[table].processed += chunk.length;
        }
      }
    }

    const failures = Object.values(results).flatMap((result) => result.errors);
    await writeAuditLog({
      actorId: user.id,
      action: "backup.import",
      resource: "database",
      requestId,
      metadata: {
        tables: summary.length,
        rows: totalRows,
        failures: failures.length,
      },
    });

    if (failures.length > 0) {
      return apiError(
        "IMPORT_PARTIAL_FAILURE",
        `A importação encontrou ${failures.length} erro(s). Consulte os logs antes de repetir a operação.`,
        409,
      );
    }

    return apiSuccess({
      dryRun: false,
      tables: summary,
      totalRows,
      results,
    });
  } catch (error: unknown) {
    return apiError(
      "IMPORT_FAILED",
      error instanceof Error
        ? error.message
        : "Não foi possível processar o backup.",
      500,
    );
  }
}
