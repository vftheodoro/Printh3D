import { getAdminSupabase } from "@/lib/supabase";
import { verifyPassword, createAdminSession } from "@/lib/admin-auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { isAdminRole } from "@/modules/auth/domain";
import { loginSchema } from "@/modules/auth/schemas";
import {
  checkLoginRateLimit,
  recordLoginAttempt,
} from "@/modules/auth/server/login-rate-limit";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = await checkLoginRateLimit(ip);

    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Muitas tentativas falhas. Aguarde alguns minutos e tente novamente.",
        429,
      );
    }

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "INVALID_CREDENTIALS_PAYLOAD",
        "Revise os dados informados.",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { email, password } = parsed.data;
    const supabase = getAdminSupabase();
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("id, nome, email, senha_hash, tipo")
      .eq("email", email)
      .maybeSingle();

    if (error || !user || !isAdminRole(user.tipo)) {
      await recordLoginAttempt(ip, false);
      return apiError("INVALID_CREDENTIALS", "Credenciais inválidas.", 401);
    }

    const isValid = await verifyPassword(password, user.senha_hash);
    if (!isValid) {
      await recordLoginAttempt(ip, false);
      return apiError("INVALID_CREDENTIALS", "Credenciais inválidas.", 401);
    }

    await recordLoginAttempt(ip, true);

    const token = await createAdminSession(
      String(user.id),
      user.email,
      user.tipo,
    );

    const response = apiSuccess({
      user: {
        id: Number(user.id),
        nome: String(user.nome),
        email: String(user.email),
        tipo: user.tipo,
      },
    });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    logger.info("Admin login succeeded.", {
      requestId,
      actorId: Number(user.id),
      action: "auth.login",
    });

    return response;
  } catch (error: unknown) {
    logger.error("Admin login failed unexpectedly.", {
      requestId,
      action: "auth.login",
      error: error instanceof Error ? error.message : "unknown",
    });

    if (
      error instanceof Error &&
      (error.message.includes("Missing required environment variable") ||
        (error.message.includes("Missing ") &&
          error.message.includes("environment variable")))
    ) {
      return apiError(
        "SERVER_CONFIGURATION_ERROR",
        "Configuração do servidor incompleta.",
        500,
      );
    }

    return apiError("LOGIN_FAILED", "Erro interno no servidor.", 500);
  }
}
