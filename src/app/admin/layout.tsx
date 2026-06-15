"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Calculator,
  Contact,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Receipt,
  Settings,
  ShieldCheck,
  Trash,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { AdminRole, AdminUser } from "@/modules/auth/domain";
import "../admin.css";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: readonly AdminRole[];
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Categorias", path: "/admin/categorias", icon: Folder },
  { name: "Produtos", path: "/admin/produtos", icon: Package },
  { name: "Vendas", path: "/admin/vendas", icon: Wallet },
  { name: "Clientes", path: "/admin/clientes", icon: Contact },
  { name: "Calculadora", path: "/admin/calculadora", icon: Calculator },
  {
    name: "Gastos",
    path: "/admin/gastos",
    icon: Receipt,
    roles: ["ADMIN"],
  },
  {
    name: "Promoções",
    path: "/admin/promocoes",
    icon: Percent,
    roles: ["ADMIN"],
  },
  {
    name: "Configurações",
    path: "/admin/configuracoes",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    name: "Usuários",
    path: "/admin/usuarios",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    name: "Lixeira",
    path: "/admin/lixeira",
    icon: Trash,
    roles: ["ADMIN"],
  },
  {
    name: "Manutenção",
    path: "/admin/manutencao",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    let active = true;
    async function loadSession() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          window.location.assign("/admin/login");
          return;
        }
        if (active) setUser(payload.data);
      } catch {
        if (active) window.location.assign("/admin/login");
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [isLoginPage]);

  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.roles || (user && item.roles.includes(user.tipo)),
      ),
    [user],
  );

  const currentItem = NAV_ITEMS.find(
    (item) =>
      pathname === item.path ||
      (item.path !== "/admin" && pathname.startsWith(`${item.path}/`)),
  );

  if (isLoginPage) {
    return <div className="admin-theme admin-auth-layout">{children}</div>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="admin-theme app-layout">
      <a className="admin-skip-link" href="#admin-main">
        Ir para o conteúdo
      </a>

      <nav
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
        id="admin-sidebar"
        aria-label="Navegação administrativa"
      >
        <Link href="/admin" className="sidebar-brand" onClick={closeSidebar}>
          <Image
            src="/assets/imagens/logos/logo_printh_branca.png"
            alt="Printh3D"
            width={44}
            height={44}
            priority
          />
          <span className="brand-text">
            Printh<span>3D</span>
          </span>
        </Link>

        <ul className="sidebar-nav">
          {visibleItems.map((item) => {
            const active =
              pathname === item.path ||
              (item.path !== "/admin" &&
                pathname.startsWith(`${item.path}/`));
            const Icon = item.icon;

            return (
              <li key={item.path} className={active ? "active" : ""}>
                <Link
                  href={item.path}
                  onClick={closeSidebar}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">
            {user?.nome?.charAt(0).toUpperCase() || <Box size={18} />}
          </div>
          <div className="user-info">
            <strong>{sessionLoading ? "Carregando…" : user?.nome}</strong>
            <span>{user?.tipo}</span>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            aria-label="Sair do sistema"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <button
        type="button"
        className={`sidebar-backdrop ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
        aria-label="Fechar menu"
        tabIndex={isSidebarOpen ? 0 : -1}
      />

      <div className="content-area">
        <header className="content-header">
          <button
            type="button"
            className="btn-hamburger"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar"
            aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isSidebarOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>

          <div>
            <span className="content-eyebrow">Painel Printh3D</span>
            <h2>{currentItem?.name || "Dashboard"}</h2>
          </div>

          <div className="header-user">
            <span>{user?.nome || "Carregando…"}</span>
            <small>{user?.tipo}</small>
          </div>
        </header>

        <main className="content-main" id="admin-main">
          {sessionLoading ? (
            <div className="admin-page-loading" role="status">
              <span className="admin-spinner" aria-hidden="true" />
              Validando sessão…
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
