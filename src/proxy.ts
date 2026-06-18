import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { isAdminRole, type AdminRole } from "@/modules/auth/domain";

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/api/admin/login",
]);

const ADMIN_ONLY_PREFIXES = [
  "/admin/usuarios",
  "/admin/configuracoes",
  "/admin/gastos",
  "/admin/promocoes",
  "/admin/lixeira",
  "/admin/manutencao",
  "/api/admin/users",
  "/api/admin/settings",
  "/api/admin/expenses",
  "/api/admin/promotions",
  "/api/admin/coupons",
  "/api/admin/trash",
  "/api/admin/backup",
  "/api/admin/migrate",
  "/api/admin/files",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getJwtSecret(): Uint8Array {
  const secretKey = process.env.ADMIN_JWT_SECRET;
  if (!secretKey) {
    throw new Error("Missing ADMIN_JWT_SECRET environment variable.");
  }
  return new TextEncoder().encode(secretKey);
}

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSameOriginMutation(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method)) return true;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

async function validateDatabaseSession(
  userId: string,
  role: AdminRole,
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !/^\d+$/.test(userId)) return false;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/admin_users?id=eq.${encodeURIComponent(userId)}&select=id,tipo&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) return false;

  const users = (await response.json()) as Array<{
    id?: number;
    tipo?: string;
  }>;
  return users.length === 1 && users[0].tipo === role;
}

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Sessão inválida ou expirada.",
        },
      },
      { status: 401 },
    );
  }

  const response = NextResponse.redirect(
    new URL("/admin/login", request.url),
  );
  response.cookies.delete("admin_token");
  return response;
}

function forbidden(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Seu perfil não possui permissão para esta operação.",
        },
      },
      { status: 403 },
    );
  }

  return NextResponse.redirect(new URL("/admin?error=forbidden", request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId =
    request.headers.get("x-request-id") || crypto.randomUUID();

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ORIGIN",
          message: "Origem da requisição não permitida.",
        },
      },
      { status: 403 },
    );
  }

  const token = request.cookies.get("admin_token")?.value;
  if (!token) return unauthorized(request);

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = payload.role;
    const userId = String(payload.sub ?? "");

    if (!isAdminRole(role)) return unauthorized(request);
    if (!(await validateDatabaseSession(userId, role))) {
      return unauthorized(request);
    }
    if (isAdminOnlyPath(pathname) && role !== "ADMIN") {
      return forbidden(request);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-user-id", userId);
    requestHeaders.set("x-admin-role", role satisfies AdminRole);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch {
    return unauthorized(request);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
