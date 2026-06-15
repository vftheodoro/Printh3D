import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getAdminSupabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/lib/audit-log";
import { saleInputSchema } from "@/modules/sales/schemas";
import { saveSale } from "@/modules/sales/server/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 50),
    );
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = getAdminSupabase();
    let query = supabase
      .from("sales")
      .select(
        `
          *,
          vendedor:admin_users(nome)
        `,
        { count: "exact" },
      )
      .order("data_venda", { ascending: false })
      .range(from, to);

    if (search) {
      const safeSearch = search.replace(/[%_,()]/g, " ");
      query = query.or(
        `cliente.ilike.%${safeSearch}%,item_nome.ilike.%${safeSearch}%`,
      );
    }

    if (status === "pending") {
      query = query.gt("valor_devido", 0);
    } else if (status === "paid") {
      query = query.lte("valor_devido", 0);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const response = NextResponse.json(Array.isArray(data) ? data : []);
    response.headers.set("X-Total-Count", String(count ?? 0));
    return response;
  } catch (error: unknown) {
    logger.error("Failed to list sales.", {
      action: "sales.list",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "SALES_LIST_FAILED",
      "Não foi possível carregar as vendas.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const parsed = saleInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "INVALID_SALE",
        "Revise os dados da venda.",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const actorId = Number(request.headers.get("x-admin-user-id"));
    if (!Number.isInteger(actorId) || actorId <= 0) {
      return apiError("UNAUTHORIZED", "Sessão inválida.", 401);
    }

    const data = await saveSale(parsed.data, actorId);
    await writeAuditLog({
      requestId,
      actorId,
      action: "sales.create",
      resource: "sales",
      resourceId:
        data && typeof data === "object" && "id" in data
          ? String(data.id)
          : undefined,
    });
    logger.info("Sale created.", {
      requestId,
      actorId,
      action: "sales.create",
      resource: "sales",
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    logger.error("Failed to create sale.", {
      requestId,
      action: "sales.create",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "SALE_CREATE_FAILED",
      error instanceof Error
        ? error.message
        : "Não foi possível registrar a venda.",
      400,
    );
  }
}
