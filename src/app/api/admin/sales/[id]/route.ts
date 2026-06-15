import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/lib/audit-log";
import { saleInputSchema } from "@/modules/sales/schemas";
import { deleteSale, saveSale } from "@/modules/sales/server/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const requestId = crypto.randomUUID();
  try {
    const saleId = parseId((await params).id);
    if (!saleId) return apiError("INVALID_ID", "Venda inválida.", 400);

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

    const data = await saveSale(parsed.data, actorId, saleId);
    await writeAuditLog({
      requestId,
      actorId,
      action: "sales.update",
      resource: "sales",
      resourceId: saleId,
    });
    logger.info("Sale updated.", {
      requestId,
      actorId,
      action: "sales.update",
      resource: "sales",
      resourceId: saleId,
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error("Failed to update sale.", {
      requestId,
      action: "sales.update",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "SALE_UPDATE_FAILED",
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar a venda.",
      400,
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const requestId = crypto.randomUUID();
  try {
    const saleId = parseId((await params).id);
    if (!saleId) return apiError("INVALID_ID", "Venda inválida.", 400);

    await deleteSale(saleId);
    const actorId = Number(request.headers.get("x-admin-user-id")) || undefined;
    await writeAuditLog({
      requestId,
      actorId,
      action: "sales.delete",
      resource: "sales",
      resourceId: saleId,
    });
    logger.info("Sale moved to trash.", {
      requestId,
      actorId,
      action: "sales.delete",
      resource: "sales",
      resourceId: saleId,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Failed to delete sale.", {
      requestId,
      action: "sales.delete",
      error: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      "SALE_DELETE_FAILED",
      error instanceof Error
        ? error.message
        : "Não foi possível excluir a venda.",
      400,
    );
  }
}
