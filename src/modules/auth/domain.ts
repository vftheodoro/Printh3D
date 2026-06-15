export const ADMIN_ROLES = ["ADMIN", "VENDEDOR"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUser {
  id: number;
  nome: string;
  email: string;
  tipo: AdminRole;
}

export interface AdminSessionClaims {
  sub: string;
  email: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

export function isAdminRole(value: unknown): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}
