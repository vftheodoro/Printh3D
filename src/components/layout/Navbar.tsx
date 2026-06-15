"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, X } from "lucide-react";
import { clsx } from "clsx";

const NAV_LINKS = [
  { name: "Início", href: "/" },
  { name: "Produtos", href: "/produtos" },
  { name: "Como Funciona", href: "/materiais" },
  { name: "Contato", href: "/contato" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,padding] duration-200",
        scrolled || isOpen
          ? "border-white/8 bg-[#030712]/92 py-3 backdrop-blur-xl"
          : "border-transparent bg-transparent py-5",
      )}
    >
      <nav
        className="container-custom flex items-center justify-between"
        aria-label="Navegação principal"
      >
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl font-black text-white"
          aria-label="Printh3D, página inicial"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/8 shadow-[0_0_28px_rgba(39,168,255,0.12)]">
            <Image
              src="/assets/logos/logo_printh_padrão.png"
              alt=""
              width={34}
              height={34}
              priority
            />
          </span>
          <span className="text-xl tracking-[-0.04em] sm:text-2xl">
            Printh<span className="text-sky-400">3D</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "rounded-lg px-1 py-2 text-sm font-bold transition-colors",
                  active
                    ? "text-sky-400"
                    : "text-slate-300 hover:text-white",
                )}
              >
                {link.name}
              </Link>
            );
          })}
          <Link
            href="/orcamento"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_12px_30px_rgba(39,168,255,0.24)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-sky-300"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Pedir Orçamento
          </Link>
        </div>

        <button
          type="button"
          className="glass inline-flex h-11 w-11 items-center justify-center rounded-xl text-white lg:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </nav>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="absolute inset-x-0 top-full h-[calc(100dvh-4.5rem)] border-t border-white/8 bg-[#030712]/98 px-5 py-8 backdrop-blur-xl lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-lg flex-col gap-2"
            aria-label="Navegação móvel"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "rounded-2xl border px-5 py-4 text-lg font-black",
                  pathname === link.href
                    ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                    : "border-white/6 bg-white/[0.025] text-white",
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/orcamento"
              onClick={() => setIsOpen(false)}
              className="mt-4 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-sky-500 px-6 py-4 font-black text-slate-950"
            >
              <MessageCircle size={20} aria-hidden="true" />
              Pedir Orçamento
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
