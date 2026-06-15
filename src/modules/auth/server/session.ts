import "server-only";

import { cookies } from "next/headers";
import { getAdminSupabase } from "@/lib/supabase";
import {
  isAdminRole,
  type AdminRole,
  type AdminUser,
} from "@/modules/auth/domain";
import { verifyAdminSession } from "@/lib/admin-auth";

export const ADMIN_COOKIE_NAME = "admin_token";

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await verifyAdminSession(token);
  if (!claims?.sub) return null;

  const userId = Number(claims.sub);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, nome, email, tipo")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !isAdminRole(data.tipo)) return null;

  return {
    id: Number(data.id),
    nome: String(data.nome),
    email: String(data.email),
    tipo: data.tipo,
  };
}

export async function requireAdminRole(
  allowedRoles: readonly AdminRole[] = ["ADMIN", "VENDEDOR"],
): Promise<AdminUser | null> {
  const user = await getCurrentAdminUser();
  if (!user || !allowedRoles.includes(user.tipo)) return null;
  return user;
}
