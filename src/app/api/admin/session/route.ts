import { apiError, apiSuccess } from "@/lib/api-response";
import { getCurrentAdminUser } from "@/modules/auth/server/session";

export async function GET() {
  try {
    const user = await getCurrentAdminUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Sessão inválida ou expirada.", 401);
    }

    return apiSuccess(user);
  } catch {
    return apiError(
      "SESSION_LOOKUP_FAILED",
      "Não foi possível validar a sessão.",
      500,
    );
  }
}
